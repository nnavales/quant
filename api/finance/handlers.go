package finance

import (
	"net/http"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/transport/httpx"
)

type Handler struct {
	service           *Service
	categoriesService *categories.Service
	channelsService   *channels.Service
}

func NewHandler(service *Service, categoriesService *categories.Service, channelsService *channels.Service) *Handler {
	return &Handler{
		service:           service,
		categoriesService: categoriesService,
		channelsService:   channelsService,
	}
}

func (h *Handler) CreateTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[TransactionAggregateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	agg, err := h.service.CreateTransactionAggregate(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, agg)
}

func (h *Handler) ListTransactionsAggregate(w http.ResponseWriter, r *http.Request) {
	params := make(FilterParams)
	for k, v := range r.URL.Query() {
		params[k] = v[0]
	}

	filter, err := NewFilter(params)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, err.Error(), nil)
		return
	}

	rows, err := h.service.ListTransactionsAggregate(r.Context(), filter)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rows)
}

func (h *Handler) GetTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	row, err := h.service.GetTransactionAggregate(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, row)
}

func (h *Handler) GetTransactionsByInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	rows, err := h.service.GetTransactionsByInstallmentGroup(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rows)
}

func (h *Handler) ListTransactionsByInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.ListTransactionsByInstallmentGroups(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rows)
}

func (h *Handler) UpdateTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[TransactionAggregateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	agg, err := h.service.UpdateTransactionAggregate(r.Context(), id, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, agg)
}

func (h *Handler) DeleteTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	err := h.service.DeleteTransactionAggregate(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CancelInstallments(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[CancelInstallmentsReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	err = h.service.CancelInstallments(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
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
		httpx.WriteError(w, r, http.StatusBadRequest, err.Error(), nil)
		return
	}

	rows, err := h.service.ListHistoricalEntries(r.Context(), filter)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rows)
}

func (h *Handler) CreateBulkTransactionAggregate(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[BulkTransactionReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	err = h.service.BulkCreateTransactionAggregate(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}
