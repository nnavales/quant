package channels

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
		if errors.Is(err, ErrDuplicate) {
			httpx.WriteError(w, r, 409, "channel already exists", err)
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
	del := r.URL.Query().Get("deleted")
	filter := Filter{}
	if del == "true" {
		filter.Deleted = true
	} else {
		filter.Deleted = false
	}

	include := r.URL.Query().Get("include")
	if include != "accounts" {
		channels, err := h.service.ListChannels(r.Context(), filter)
		if err != nil {
			httpx.WriteError(w, r, 500, "failed to list channels", err)
			return
		}
		httpx.WriteJSON(w, 200, channels)
		return
	}

	channels, err := h.service.ListChannelsWithAccounts(r.Context(), filter)
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
		if errors.Is(err, ErrDuplicate) {
			httpx.WriteError(w, r, 409, "account already exists", err)
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

	del := r.URL.Query().Get("deleted")
	filter := Filter{}
	if del == "true" {
		filter.Deleted = true
	} else {
		filter.Deleted = false
	}
	accounts, err := h.service.ListAccounts(r.Context(), filter)
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

func (h *Handler) RestoreChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.RestoreChannel(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "channel not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to restore channel", err)
		return
	}
	httpx.WriteJSON(w, 200, "ok")
}

func (h *Handler) RestoreAccount(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.RestoreAccount(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "account not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to restore account", err)
		return
	}
	httpx.WriteJSON(w, 200, "ok")
}
