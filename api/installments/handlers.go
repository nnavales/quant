package installments

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

func (h *Handler) GetInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	ig, err := h.service.GetInstallmentGroup(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "installment group not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get installment group", err)
		return
	}
	httpx.WriteJSON(w, 200, ig)
}

func (h *Handler) ListInstallmentGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.service.ListInstallmentGroups(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list installment groups", err)
		return
	}
	httpx.WriteJSON(w, 200, groups)
}

func (h *Handler) UpdateInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[InstallmentGroupReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	ig, err := h.service.UpdateInstallmentGroup(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "installment group not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update installment group", err)
		return
	}
	httpx.WriteJSON(w, 200, ig)
}

func (h *Handler) DeleteInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteInstallmentGroup(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "installment group not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete installment group", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
