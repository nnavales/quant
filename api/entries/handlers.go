package entries

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

func (h *Handler) GetEntry(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	entry, err := h.service.GetEntry(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, entry)
}

func (h *Handler) ListEntries(w http.ResponseWriter, r *http.Request) {
	entries, err := h.service.ListEntries(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, entries)
}

func (h *Handler) UpdateEntry(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[EntryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	entry, err := h.service.UpdateEntry(r.Context(), id, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, entry)
}

func (h *Handler) DeleteEntry(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	err := h.service.DeleteEntry(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
