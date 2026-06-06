package chatbot

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
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
			openai.DeveloperMessage(sysPrompt),
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
	if err := validateAgentConfig(cfg.BaseURL, cfg.APIKeyAI, cfg.ModelID); err != nil {
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
		openai.DeveloperMessage(sysPrompt),
	}
	a.mu.Unlock()
	slog.Info("agent: memory cleared after 30 min")
}

func sanitizeMessages(messages []openai.ChatCompletionMessageParamUnion) []openai.ChatCompletionMessageParamUnion {
	validToolCallIDs := map[string]bool{}
	for _, msg := range messages {
		if msg.OfAssistant != nil {
			for _, tc := range msg.OfAssistant.ToolCalls {
				validToolCallIDs[*tc.GetID()] = true
			}
		}
	}

	result := make([]openai.ChatCompletionMessageParamUnion, 0, len(messages))
	for _, msg := range messages {
		if msg.OfTool != nil {
			if !validToolCallIDs[msg.OfTool.ToolCallID] {
				continue
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

func validateAgentConfig(baseURL, apiKey, model string) error {
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

	var result struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	for _, m := range result.Data {
		if m.ID == model {
			return nil
		}
	}

	return fmt.Errorf("model not found on base_url model list")
}

// probeModel sends one minimal real completion (developer system prompt + a
// dummy tool + a "ping") to verify the model is actually usable with the
// agent's request shape. It catches a bad model id, missing tool support or an
// unreachable provider when the config is saved, instead of failing later over
// Telegram.
func probeModel(baseURL, apiKey, model string) error {
	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL(baseURL),
	)

	probeTool := openai.ChatCompletionFunctionTool(shared.FunctionDefinitionParam{
		Name:        "ping",
		Description: param.NewOpt("health check, do not call"),
		Parameters: openai.FunctionParameters{
			"type":                 "object",
			"additionalProperties": false,
			"properties":           map[string]any{},
		},
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: model,
		Tools: []openai.ChatCompletionToolUnionParam{probeTool},
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.DeveloperMessage("ping"),
			openai.UserMessage("ping"),
		},
	})
	if err != nil {
		return fmt.Errorf("model is not usable for chat with tools: %w", err)
	}
	return nil
}

// agentErrorMessage classifies a validation/probe failure into a stable,
// default error key (English) based on the real cause: provider auth, a
// missing/incompatible model, or an unreachable Base URL. The frontend maps
// these keys to localized messages — the backend stays language-agnostic.
func agentErrorMessage(err error) string {
	if err == nil {
		return ""
	}

	var apiErr *openai.Error
	if errors.As(err, &apiErr) {
		switch {
		case apiErr.StatusCode == http.StatusUnauthorized:
			return "invalid api key"
		case apiErr.StatusCode == http.StatusForbidden:
			return "api key no access"
		case apiErr.StatusCode == http.StatusNotFound:
			return "model not found"
		case apiErr.StatusCode == http.StatusBadRequest,
			apiErr.StatusCode == http.StatusUnprocessableEntity:
			return "model not compatible"
		case apiErr.StatusCode == http.StatusTooManyRequests:
			return "provider rate limited"
		case apiErr.StatusCode >= 500:
			return "provider error"
		default:
			return "provider rejected request"
		}
	}

	var netErr net.Error
	if errors.As(err, &netErr) {
		return "provider unreachable"
	}

	msg := err.Error()
	switch {
	case strings.Contains(msg, "reach provider"):
		return "provider unreachable"
	case strings.Contains(msg, "model not found on base_url"):
		return "model not listed"
	case strings.Contains(msg, "provider returned"):
		return "provider returned error"
	default:
		return "agent validation failed"
	}
}

func (a *Agent) ProcessMessage(text string, images [][]byte) (string, error) {
	a.timer.Stop()
	a.timer.Reset(30 * time.Minute)

	if text == "" && len(images) > 0 {
		text = "(imagen sin descripción)"
	}

	// Memory keeps only the text. Images are heavy and the model only needs to
	// see them on the first request, where it extracts whatever it requires;
	// persisting them would re-send each base64 blob on every later turn.
	a.addMessage(openai.UserMessage(text))

	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	defer cancel()

	for round := range maxToolRounds {
		messages := a.messagesSnapshot()
		if round == 0 && len(images) > 0 {
			messages[len(messages)-1] = userMessageWithImages(text, images)
		}

		resp, err := a.Chat.Completions.New(
			ctx,
			openai.ChatCompletionNewParams{
				Model:    a.model,
				Tools:    a.toolsToParam(),
				Messages: messages,
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

// userMessageWithImages builds a multimodal user message: the text plus each
// image as a base64 data URI. Used only for the outgoing request, never stored
// in the agent's memory.
func userMessageWithImages(text string, images [][]byte) openai.ChatCompletionMessageParamUnion {
	parts := make([]openai.ChatCompletionContentPartUnionParam, 0, len(images)+1)
	if text != "" {
		parts = append(parts, openai.TextContentPart(text))
	}
	for _, img := range images {
		parts = append(parts, openai.ImageContentPart(openai.ChatCompletionContentPartImageImageURLParam{
			URL: imageDataURI(img),
		}))
	}
	return openai.UserMessage(parts)
}

func imageDataURI(img []byte) string {
	mime := http.DetectContentType(img)
	return fmt.Sprintf("data:%s;base64,%s", mime, base64.StdEncoding.EncodeToString(img))
}
