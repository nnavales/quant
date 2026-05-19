package dashboard

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/nnavales/quant/api/planning"
	"github.com/nnavales/quant/api/transport/httpx"
)

type Handler struct {
	service         *Service
	planningService *planning.Service
}

func NewHandler(service *Service, planningSrv *planning.Service) *Handler {
	return &Handler{
		service:         service,
		planningService: planningSrv,
	}
}

func (h *Handler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	year := time.Now().Year()
	if y := r.URL.Query().Get("year"); y != "" {
		year, _ = strconv.Atoi(y)
	}

	forecast, err := h.planningService.BuildPlanningYear(r.Context(), strconv.Itoa(year))
	if err != nil {
		httpx.WriteServiceError(w, r, fmt.Errorf("failed to get forecast: %w", err))
		return
	}

	plan, err := h.planningService.GetPlanYear(r.Context(), strconv.Itoa(year))
	if err != nil {
		httpx.WriteServiceError(w, r, fmt.Errorf("failed to get plan: %w", err))
		return
	}

	res, err := h.service.GetMetrics(r.Context(), forecast, plan)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
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
