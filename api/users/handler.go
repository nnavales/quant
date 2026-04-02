package users

import (
	"encoding/json"
	"net/http"

	"github.com/nnavales/summit/api/transport/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) GetConfig(w http.ResponseWriter, r *http.Request) {
	config, err := h.service.List(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to get config", err)
		return
	}
	httpx.WriteJSON(w, 200, config)
}

func (h *Handler) GetConfigByKey(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	if key == "" {
		httpx.WriteError(w, r, 400, "key required", nil)
		return
	}

	value, err := h.service.Get(r.Context(), key)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to get config", err)
		return
	}
	httpx.WriteJSON(w, 200, value)
}

func (h *Handler) SetConfig(w http.ResponseWriter, r *http.Request) {
	var req map[string]any
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, r, 400, "invalid request body", err)
		return
	}

	if err := h.service.Set(r.Context(), req); err != nil {
		httpx.WriteError(w, r, 500, "failed to set config", err)
		return
	}

	httpx.WriteJSON(w, 200, map[string]string{"status": "ok"})
}
