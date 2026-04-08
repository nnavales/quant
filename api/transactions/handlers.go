package transactions

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

func (h *Handler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	tx, err := h.service.GetTransaction(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "transaction not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get transaction", err)
		return
	}
	httpx.WriteJSON(w, 200, tx)
}

func (h *Handler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	txs, err := h.service.ListTransactions(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list transactions", err)
		return
	}
	httpx.WriteJSON(w, 200, txs)
}

func (h *Handler) UpdateTransaction(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[TransactionReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	tx, err := h.service.UpdateTransaction(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "transaction not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update transaction", err)
		return
	}
	httpx.WriteJSON(w, 200, tx)
}

func (h *Handler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteTransaction(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "transaction not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete transaction", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UpdateTransactionPaid(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[TransactionIsPaidReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	transaction, err := h.service.UpdateTansactionPaid(r.Context(), id, req.IsPaid)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "transaction not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update transaction", err)
		return
	}
	httpx.WriteJSON(w, 200, transaction)
}
