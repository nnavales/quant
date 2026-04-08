package entries

import (
	"errors"
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
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	entry, err := h.service.GetEntry(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "entry not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get entry", err)
		return
	}
	httpx.WriteJSON(w, 200, entry)
}

func (h *Handler) ListEntries(w http.ResponseWriter, r *http.Request) {
	entries, err := h.service.ListEntries(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list entries", err)
		return
	}
	httpx.WriteJSON(w, 200, entries)
}

func (h *Handler) UpdateEntry(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[EntryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	entry, err := h.service.UpdateEntry(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "entry not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update entry", err)
		return
	}
	httpx.WriteJSON(w, 200, entry)
}

func (h *Handler) DeleteEntry(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteEntry(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "entry not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete entry", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
