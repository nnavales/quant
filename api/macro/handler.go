package macro

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

func (h *Handler) GetIPC(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchIPC(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetInflation(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchInflation(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetDollarHistoric(w http.ResponseWriter, r *http.Request) {
	quotation := r.URL.Query().Get("quotation")
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchDollarHistoric(r.Context(), quotation, refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetDollarValue(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchDollarCotization(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetCryptoCurrency(w http.ResponseWriter, r *http.Request) {
	symbol := r.URL.Query().Get("symbol")
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchCryptoCurrency(r.Context(), symbol, refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetCountryRisk(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchCountryRisk(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetFixedDeposits(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchFixedDeposits(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetYieldAccounts(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchYieldAccounts(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetLoanRates(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh") == "true"
	res, err := h.service.FetchLoanRates(r.Context(), refresh)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}
