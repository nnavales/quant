package finance

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

func (h *Handler) CreateTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[TransactionAggregateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	err = h.service.CreateTransactionAggregate(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create transaction aggregate", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListTransactionsAggregate(w http.ResponseWriter, r *http.Request) {
	params := make(FilterParams)
	for k, v := range r.URL.Query() {
		params[k] = v[0]
	}

	filter, err := NewFilter(params)
	if err != nil {
		httpx.WriteError(w, r, 400, err.Error(), nil)
		return
	}

	rows, err := h.service.ListTransactionsAggregate(r.Context(), filter)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list transaction aggregates", err)
		return
	}
	httpx.WriteJSON(w, 200, rows)
}

func (h *Handler) GetTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	row, err := h.service.GetTransactionAggregate(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "transaction aggregate not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get transaction aggregate", err)
		return
	}
	httpx.WriteJSON(w, 200, row)
}

func (h *Handler) UpdateTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[TransactionAggregateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	err = h.service.UpdateTransactionAggregate(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update transaction aggregate", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteTransactionAggregate(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "transaction aggregate not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete transaction aggregate", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CancelInstallments(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[CancelInstallmentsReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	err = h.service.CancelInstallments(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to cancel installments", err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) ListHistoricalEntries(w http.ResponseWriter, r *http.Request) {
	params := make(FilterParams)
	for k, v := range r.URL.Query() {
		params[k] = v[0]
	}

	filter, err := NewHistoricalFilter(params)
	if err != nil {
		httpx.WriteError(w, r, 400, err.Error(), nil)
		return
	}

	rows, err := h.service.ListHistoricalEntries(r.Context(), filter)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list historical entries", err)
		return
	}
	httpx.WriteJSON(w, 200, rows)
}
