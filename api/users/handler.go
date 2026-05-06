package users

import (
	"net/http"

	"github.com/nnavales/quant/api/transport/httpx"
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
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, config)
}

func (h *Handler) GetConfigByKey(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	if key == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "key required", nil)
		return
	}

	value, err := h.service.Get(r.Context(), key)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, value)
}

func (h *Handler) SetConfig(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[map[string]any](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	if err := h.service.Set(r.Context(), req); err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
