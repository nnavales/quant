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

func (h *Handler) UpdateEntryPaid(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[UpdateEntryPaidReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	entry, err := h.service.UpdateEntryPaid(r.Context(), id, req.IsPaid)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "entry not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update entry", err)
		return
	}
	httpx.WriteJSON(w, 200, entry)
}

func (h *Handler) CreateChannel(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[ChannelReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.CreateChannel(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create channel", err)
		return
	}
	httpx.WriteJSON(w, 201, c)
}

func (h *Handler) GetChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	c, err := h.service.GetChannel(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "channel not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get channel", err)
		return
	}
	httpx.WriteJSON(w, 200, c)
}

func (h *Handler) ListChannels(w http.ResponseWriter, r *http.Request) {
	include := r.URL.Query().Get("include")
	if include != "accounts" {
		channels, err := h.service.ListChannels(r.Context())
		if err != nil {
			httpx.WriteError(w, r, 500, "failed to list channels", err)
			return
		}
		httpx.WriteJSON(w, 200, channels)
		return
	}

	channels, err := h.service.ListChannelsWithAccounts(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list channels", err)
		return
	}
	httpx.WriteJSON(w, 200, channels)
}

func (h *Handler) UpdateChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[ChannelReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.UpdateChannel(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "channel not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update channel", err)
		return
	}
	httpx.WriteJSON(w, 200, c)
}

func (h *Handler) DeleteChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteChannel(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "channel not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete channel", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[AccountReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	a, err := h.service.CreateAccount(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create account", err)
		return
	}
	httpx.WriteJSON(w, 201, a)
}

func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	a, err := h.service.GetAccount(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "account not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get account", err)
		return
	}
	httpx.WriteJSON(w, 200, a)
}

func (h *Handler) ListAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := h.service.ListAccounts(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list accounts", err)
		return
	}
	httpx.WriteJSON(w, 200, accounts)
}

func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[AccountReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	a, err := h.service.UpdateAccount(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "account not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update account", err)
		return
	}
	httpx.WriteJSON(w, 200, a)
}

func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteAccount(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "account not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete account", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[CategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.CreateCategory(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create category", err)
		return
	}
	httpx.WriteJSON(w, 201, c)
}

func (h *Handler) GetCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	c, err := h.service.GetCategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get category", err)
		return
	}
	httpx.WriteJSON(w, 200, c)
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.service.ListCategories(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list categories", err)
		return
	}
	httpx.WriteJSON(w, 200, categories)
}

func (h *Handler) ListCategoriesWithSubcategories(w http.ResponseWriter, r *http.Request) {
	include := r.URL.Query().Get("include")
	if include != "subcategories" {
		h.ListCategories(w, r)
		return
	}

	categories, err := h.service.ListCategoriesWithSubcategories(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list categories", err)
		return
	}
	httpx.WriteJSON(w, 200, categories)
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[CategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.UpdateCategory(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update category", err)
		return
	}
	httpx.WriteJSON(w, 200, c)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteCategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete category", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateSubcategory(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[SubcategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	sd, err := h.service.CreateSubcategory(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create subcategory", err)
		return
	}
	httpx.WriteJSON(w, 201, sd)
}

func (h *Handler) GetSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	sd, err := h.service.GetSubcategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get subcategory", err)
		return
	}
	httpx.WriteJSON(w, 200, sd)
}

func (h *Handler) ListSubcategories(w http.ResponseWriter, r *http.Request) {
	subcategories, err := h.service.ListSubcategories(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list subcategories", err)
		return
	}
	httpx.WriteJSON(w, 200, subcategories)
}

func (h *Handler) UpdateSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[SubcategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	sd, err := h.service.UpdateSubcategory(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update subcategory", err)
		return
	}
	httpx.WriteJSON(w, 200, sd)
}

func (h *Handler) DeleteSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteSubcategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete subcategory", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
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
