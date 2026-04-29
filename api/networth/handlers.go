package networth

import (
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

func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[assetReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	a, err := h.service.Create(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, a)
}

func (h *Handler) GetAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	a, err := h.service.Get(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, a)
}

func (h *Handler) ListAssets(w http.ResponseWriter, r *http.Request) {
	assets, err := h.service.List(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, assets)
}

func (h *Handler) UpdateAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[assetReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	a, err := h.service.Update(r.Context(), req, id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, a)
}

func (h *Handler) DeleteAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	err := h.service.Delete(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetNetWorth(w http.ResponseWriter, r *http.Request) {
	nw, err := h.service.GetNetWorth(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, nw)
}
