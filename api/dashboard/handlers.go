package dashboard

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

func (h *Handler) GetKPIs(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.GetKPIs(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetKPIEvolution(w http.ResponseWriter, r *http.Request) {
	kpi := r.PathValue("kpi")

	res, err := h.service.GetKPIEvolution(r.Context(), kpi)
	if err != nil {
		if err == ErrInvalidKPI {
			httpx.WriteError(w, r, http.StatusBadRequest, "invalid kpi", err)
			return
		}
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) GetDimensionSeries(w http.ResponseWriter, r *http.Request) {
	dimension := r.PathValue("dimension")

	filter, err := parseDimensionFilter(r.URL.Query())
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid filter", err)
		return
	}

	res, err := h.service.GetDimensionSeries(r.Context(), dimension, filter)
	if err != nil {
		if err == ErrInvalidDimension {
			httpx.WriteError(w, r, http.StatusBadRequest, "invalid dimension", err)
			return
		}
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}
