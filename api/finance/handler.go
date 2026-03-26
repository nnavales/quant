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

func (h *Handler) GetRates(w http.ResponseWriter, r *http.Request) {
	dolars, err := GetExchangeRate()
	if err != nil {
		httpx.WriteError(w, r, 500, "dolarAPI error", err)
		return
	}
	rates := ToRateSlice(dolars)
	httpx.WriteJSON(w, 200, rates)
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[TransactionReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	tx, err := h.service.CreateTransaction(r.Context(), req)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to create transaction", err)
		return
	}
	httpx.WriteJSON(w, 201, tx)
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

func (h *Handler) CreateEntry(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[EntryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	entry, err := h.service.CreateEntry(r.Context(), req)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to create entry", err)
		return
	}
	httpx.WriteJSON(w, 201, entry)
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

func (h *Handler) CreateChannel(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[ChannelReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.CreateChannel(r.Context(), req)
	if err != nil {
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
	channels, err := h.service.ListChannels(r.Context())
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

func (h *Handler) CreateInstallmentGroup(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[InstallmentGroupReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	ig, err := h.service.CreateInstallmentGroup(r.Context(), req)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to create installment group", err)
		return
	}
	httpx.WriteJSON(w, 201, ig)
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
