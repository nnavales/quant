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
		httpx.WriteError(w, r, 400, "bad request: token required", err)
		return
	}

	if id == 0 {
		httpx.WriteError(w, r, 400, "bad request: id required", err)
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
		httpx.WriteError(w, r, 400, "bad request: api key required", err)
		return
	}

	if strings.TrimSpace(req.ModelID) == "" {
		httpx.WriteError(w, r, 400, "bad request: model id required", err)
		return
	}

	if strings.TrimSpace(req.BaseURL) == "" {
		httpx.WriteError(w, r, 400, "bad request: base url required", err)
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
