package macro

import (
	"errors"
	"net/http"

	"github.com/nnavales/quant/api/transport/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) writeError(w http.ResponseWriter, r *http.Request, err error) {
	var httpErr *HTTPError
	if errors.As(err, &httpErr) {
		switch {
		case httpErr.StatusCode >= 500:
			httpx.WriteError(w, r, http.StatusBadGateway, "upstream error", err)
		case httpErr.StatusCode == 429:
			httpx.WriteError(w, r, http.StatusTooManyRequests, "rate limited", err)
		default:
			httpx.WriteError(w, r, http.StatusBadRequest, "client error", err)
		}
		return
	}
	if errors.Is(err, ErrTimeout) {
		httpx.WriteError(w, r, http.StatusGatewayTimeout, "upstream timeout", err)
		return
	}
	if errors.Is(err, ErrNetworkError) {
		httpx.WriteError(w, r, http.StatusServiceUnavailable, "network error", err)
		return
	}
	httpx.WriteError(w, r, http.StatusInternalServerError, "internal error", err)
}

func (h *Handler) GetIPC(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchIPC(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetInflation(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchInflation(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetDollarHistoric(w http.ResponseWriter, r *http.Request) {
	quotation := r.URL.Query().Get("quotation")
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchDollarHistoric(r.Context(), quotation, refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetDollarValue(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchDollarCotization(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetCryptoCurrency(w http.ResponseWriter, r *http.Request) {
	symbol := r.URL.Query().Get("symbol")
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchCryptoCurrency(r.Context(), symbol, refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetCountryRisk(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchCountryRisk(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetFixedDeposits(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchFixedDeposits(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetYieldAccounts(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchYieldAccounts(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetLoanRates(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchLoanRates(r.Context(), refresh)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}
