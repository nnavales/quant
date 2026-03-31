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
	res, err := h.service.FetchIPC()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetInflation(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.FetchInflation()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetDollarHistoric(w http.ResponseWriter, r *http.Request) {
	quotation := r.URL.Query().Get("quotation")
	res, err := h.service.FetchDollarHistoric(quotation)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetDollarValue(w http.ResponseWriter, r *http.Request) {
	quotation := r.URL.Query().Get("quotation")
	res, err := h.service.FetchDollarCotization(quotation)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetCryptoCurrency(w http.ResponseWriter, r *http.Request) {
	symbol := r.URL.Query().Get("symbol")
	res, err := h.service.FetchCryptoCurrency(symbol)
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetCountryRisk(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.FetchCountryRisk()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetFixedDeposits(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.FetchFixedDeposits()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetYieldAccounts(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.FetchYieldAccounts()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}

func (h *Handler) GetLoanRates(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.FetchLoanRates()
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}
