package installments

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

func (h *Handler) GetInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	ig, err := h.service.GetInstallmentGroup(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, ig)
}

func (h *Handler) ListInstallmentGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.service.ListInstallmentGroups(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, groups)
}

func (h *Handler) UpdateInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[InstallmentGroupReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	ig, err := h.service.UpdateInstallmentGroup(r.Context(), id, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, ig)
}

func (h *Handler) DeleteInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	err := h.service.DeleteInstallmentGroup(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
