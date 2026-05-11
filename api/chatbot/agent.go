package chatbot

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/nnavales/quant/api/config"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/packages/param"
	"github.com/openai/openai-go/v3/shared"
)

const maxMessages = 80 // max messages that the agent keeps in memory.
const maxToolRounds = 80

type Agent struct {
	openai.Client
	model    string
	mu       sync.Mutex
	timer    *time.Timer
	messages []openai.ChatCompletionMessageParamUnion
	tools    []Tool
}

func NewAgent(baseURL, apiKey, model string, tools []Tool) (*Agent, error) {
	httpClient := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
			DialContext:         (&net.Dialer{Timeout: 10 * time.Second}).DialContext,
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}

	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL(baseURL),
		option.WithHTTPClient(httpClient),
	)

	a := &Agent{
		Client: client,
		model:  model,
		messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(sysPrompt),
		},
		tools: tools,
	}

	a.timer = time.AfterFunc(time.Minute*30, a.clearMemory)
	return a, nil
}

func initAgent(cfg config.Config, tools []Tool) *Agent {
	if cfg.APIKeyAI == "" || cfg.BaseURL == "" {
		slog.Info("agent: skipped, credentials not configured")
		return nil
	}
	if err := validateAgentConfig(cfg.BaseURL, cfg.APIKeyAI); err != nil {
		slog.Warn("agent.init.validation.error", "err", err)
		return nil
	}

	a, err := NewAgent(cfg.BaseURL, cfg.APIKeyAI, cfg.ModelID, tools)
	if err != nil {
		slog.Warn("agent.init.error", "err", err)
		return nil
	}
	slog.Info("agent: initialized", "model", cfg.ModelID)
	return a
}

func updateAgent(cfg *config.Config, newCfg config.Config, tools []Tool) *Agent {
	cfg.APIKeyAI = newCfg.APIKeyAI
	cfg.BaseURL = newCfg.BaseURL
	cfg.ModelID = newCfg.ModelID
	return initAgent(newCfg, tools)
}

func (a *Agent) addMessage(msg openai.ChatCompletionMessageParamUnion) {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.messages = append(a.messages, msg)

	if len(a.messages) > maxMessages+1 {
		system := a.messages[0]

		a.messages = append(
			[]openai.ChatCompletionMessageParamUnion{system},
			a.messages[len(a.messages)-maxMessages:]...,
		)
	}
}

func (a *Agent) clearMemory() {
	a.mu.Lock()
	a.messages = []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage(sysPrompt),
	}
	a.mu.Unlock()
	slog.Info("agent: memory cleared after 30 min")
}

func sanitizeMessages(messages []openai.ChatCompletionMessageParamUnion) []openai.ChatCompletionMessageParamUnion {
	// Recolectar todos los tool_call IDs que tienen un assistant message previo
	validToolCallIDs := map[string]bool{}
	for _, msg := range messages {
		if msg.OfAssistant != nil {
			for _, tc := range msg.OfAssistant.ToolCalls {
				validToolCallIDs[*tc.GetID()] = true
			}
		}
	}

	// Filtrar tool messages huérfanos
	result := make([]openai.ChatCompletionMessageParamUnion, 0, len(messages))
	for _, msg := range messages {
		if msg.OfTool != nil {
			if !validToolCallIDs[msg.OfTool.ToolCallID] {
				continue // descartar tool message huérfano
			}
		}
		result = append(result, msg)
	}
	return result
}

func (a *Agent) messagesSnapshot() []openai.ChatCompletionMessageParamUnion {
	a.mu.Lock()
	defer a.mu.Unlock()

	snap := append([]openai.ChatCompletionMessageParamUnion(nil), a.messages...)
	return sanitizeMessages(snap)
}

func validateAgentConfig(baseURL, apiKey string) error {
	client := http.Client{Timeout: 5 * time.Second}

	req, _ := http.NewRequest("GET", baseURL+"/models", nil)
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("can't reach provider: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("provider returned %d", resp.StatusCode)
	}

	return nil
}

func (a *Agent) ProcessMessage(inputText string) (string, error) {
	a.timer.Stop()
	a.timer.Reset(30 * time.Minute)

	a.addMessage(openai.UserMessage(inputText))

	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	defer cancel()

	for range maxToolRounds {
		resp, err := a.Chat.Completions.New(
			ctx,
			openai.ChatCompletionNewParams{
				Model:    a.model,
				Tools:    a.toolsToParam(),
				Messages: a.messagesSnapshot(),
			},
		)

		if err != nil {
			return "", fmt.Errorf("LLM request failed: %w", err)
		}

		if len(resp.Choices) == 0 {
			return "", errors.New("empty response choices")
		}

		choice := resp.Choices[0]

		// persist exact assistant message
		param := choice.Message.ToParam()

		assistantParam := openai.ChatCompletionMessageParamUnion{
			OfAssistant: &openai.ChatCompletionAssistantMessageParam{
				Role: "assistant",
				Content: openai.ChatCompletionAssistantMessageParamContentUnion{
					OfString: openai.String(choice.Message.Content),
				},
				ToolCalls: param.OfAssistant.ToolCalls,
			},
		}
		a.addMessage(assistantParam)

		// final response
		if choice.FinishReason != "tool_calls" {
			return choice.Message.Content, nil
		}

		// execute tools
		for _, toolCall := range choice.Message.ToolCalls {
			tool := toolByName(a.tools, toolCall.Function.Name)

			if tool == nil {
				a.addMessage(openai.ToolMessage(`{"error":"tool not found"}`, toolCall.ID))
				continue
			}

			result, err := tool.Execute(ctx, json.RawMessage(toolCall.Function.Arguments))

			if err != nil {
				result = fmt.Sprintf(`{"error":%q}`, err.Error())
			}

			a.addMessage(openai.ToolMessage(result, toolCall.ID))
		}
	}
	return "", errors.New("max tool rounds exceeded")
}

func (a *Agent) toolsToParam() []openai.ChatCompletionToolUnionParam {
	result := make([]openai.ChatCompletionToolUnionParam, 0, len(a.tools))
	for _, t := range a.tools {
		tool := openai.ChatCompletionFunctionTool(shared.FunctionDefinitionParam{
			Name:        t.Name,
			Description: param.NewOpt(t.Description),
			Parameters:  t.Parameters,
		})
		result = append(result, tool)
	}
	return result
}

func toolByName(tools []Tool, name string) *Tool {
	for i := range tools {
		if tools[i].Name == name {
			return &tools[i]
		}
	}
	return nil
}
