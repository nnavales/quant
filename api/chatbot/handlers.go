package chatbot

import (
	"net/http"
	"strings"

	"github.com/nnavales/quant/api/config"
	"github.com/nnavales/quant/api/transport/httpx"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

// this handler updates or sets config fields for chatbot configuration
func (h *Handler) SetChatCFG(w http.ResponseWriter, r *http.Request) {
	type tokenReq struct {
		UserID int    `json:"telegram_id"`
		Token  string `json:"telegram_token"`
	}

	req, err := httpx.DecodeJSON[tokenReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "bad request", err)
		return
	}

	token := req.Token
	id := req.UserID

	if strings.TrimSpace(token) == "" {
		httpx.WriteError(w, r, 400, "telegram token required", err)
		return
	}

	if id == 0 {
		httpx.WriteError(w, r, 400, "telegram id required", err)
		return
	}

	if err := validateToken(token); err != nil {
		httpx.WriteError(w, r, 400, "telegram token invalid", err)
		return
	}

	if err := validateChat(token, int64(id)); err != nil {
		httpx.WriteError(w, r, 400, err.Error(), err)
		return
	}

	if err := config.EditConfigFile(config.Config{TelegramToken: token, TelegramID: int64(id)}); err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) SetAgentCFG(w http.ResponseWriter, r *http.Request) {
	type configAIReq struct {
		APIKey  string `json:"api_key"`
		ModelID string `json:"model_id"`
		BaseURL string `json:"base_url"`
	}

	req, err := httpx.DecodeJSON[configAIReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "bad request", err)
		return
	}

	if strings.TrimSpace(req.APIKey) == "" {
		httpx.WriteError(w, r, 400, "api key required", err)
		return
	}

	if strings.TrimSpace(req.ModelID) == "" {
		httpx.WriteError(w, r, 400, "model id required", err)
		return
	}

	if strings.TrimSpace(req.BaseURL) == "" {
		httpx.WriteError(w, r, 400, "base url required", err)
		return
	}

	if err := validateAgentConfig(req.BaseURL, req.APIKey, req.ModelID); err != nil {
		httpx.WriteError(w, r, 400, agentErrorMessage(err), err)
		return
	}

	if err := probeModel(req.BaseURL, req.APIKey, req.ModelID); err != nil {
		httpx.WriteError(w, r, 400, agentErrorMessage(err), err)
		return
	}

	if err := config.EditConfigFile(
		config.Config{
			APIKeyAI: req.APIKey,
			ModelID:  req.ModelID,
			BaseURL:  req.BaseURL}); err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)

}

func (h *Handler) GetCfg(w http.ResponseWriter, r *http.Request) {
	var configRes struct {
		UserID  int    `json:"telegram_id"`
		Token   string `json:"telegram_token"`
		APIKey  string `json:"api_key"`
		ModelID string `json:"model_id"`
		BaseURL string `json:"base_url"`
	}

	cfg, err := config.ReadConfigFile()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}

	configRes.APIKey = cfg.APIKeyAI
	configRes.ModelID = cfg.ModelID
	configRes.BaseURL = cfg.BaseURL
	configRes.Token = cfg.TelegramToken
	configRes.UserID = int(cfg.TelegramID)

	httpx.WriteJSON(w, 200, configRes)
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.ReadConfigFile()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}

	agentOK := strings.TrimSpace(cfg.APIKeyAI) != "" &&
		strings.TrimSpace(cfg.ModelID) != "" &&
		strings.TrimSpace(cfg.BaseURL) != "" &&
		validateAgentConfig(cfg.BaseURL, cfg.APIKeyAI, cfg.ModelID) == nil

	telegramOK := strings.TrimSpace(cfg.TelegramToken) != "" &&
		cfg.TelegramID != 0 &&
		validateToken(cfg.TelegramToken) == nil

	httpx.WriteJSON(w, 200, map[string]any{
		"agent":    agentOK,
		"telegram": telegramOK,
		"ok":       agentOK && telegramOK,
	})
}
