package planning

import (
	"net/http"
	"strconv"
	"time"

	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
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

func (h *Handler) CreateInput(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[PlanningReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	input, err := h.service.CreateInput(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, input)
}

func (h *Handler) GetInput(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	input, err := h.service.GetInput(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, input)
}

func (h *Handler) ListInputs(w http.ResponseWriter, r *http.Request) {
	inputs, err := h.service.ListInputs(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, inputs)
}

func (h *Handler) UpdateInput(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[PlanningReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	input, err := h.service.UpdateInput(r.Context(), id, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, input)
}

func (h *Handler) DeleteInput(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	err := h.service.DeleteInput(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateRate(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[ExchangeRateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	rate, err := h.service.CreateRate(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, rate)
}

func (h *Handler) GetRateByDate(w http.ResponseWriter, r *http.Request) {
	ym := r.PathValue("date")
	if ym == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "date required", nil)
		return
	}

	date, err := timeutils.ParseYearMonth(ym)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid date", err)
		return
	}

	rate, err := h.service.GetRateByDate(r.Context(), date)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rate)
}

func (h *Handler) ListRatesByYear(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	if yearStr == "" {
		yearStr = strconv.Itoa(time.Now().Year())
	}

	rates, err := h.service.ListRatesByYear(r.Context(), yearStr)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rates)
}

func (h *Handler) UpdateRate(w http.ResponseWriter, r *http.Request) {
	ym := r.PathValue("date")
	if ym == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "date required", nil)
		return
	}

	date, err := timeutils.ParseYearMonth(ym)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid date", err)
		return
	}

	req, err := httpx.DecodeJSON[ExchangeRateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	rate, err := h.service.UpdateRate(r.Context(), date, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, rate)
}

func (h *Handler) DeleteRate(w http.ResponseWriter, r *http.Request) {
	ym := r.PathValue("date")
	if ym == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "date required", nil)
		return
	}

	date, err := timeutils.ParseYearMonth(ym)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid date", err)
		return
	}

	err = h.service.DeleteRate(r.Context(), date)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateGoal(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[PlanningGoalReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	goal, err := h.service.CreateGoal(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, goal)
}

func (h *Handler) GetGoal(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	goal, err := h.service.GetGoal(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, goal)
}

func (h *Handler) ListGoalsByYear(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	if yearStr == "" {
		yearStr = strconv.Itoa(time.Now().Year())
	}

	goals, err := h.service.ListGoalsByYear(r.Context(), yearStr)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, goals)
}

func (h *Handler) UpdateGoal(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[PlanningGoalReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	goal, err := h.service.UpdateGoal(r.Context(), id, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, goal)
}

func (h *Handler) DeleteGoal(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "id required", nil)
		return
	}

	err := h.service.DeleteGoal(r.Context(), id)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type GenerateGoalsReq struct {
	Year         int         `json:"year"`
	ExtraIncome  money.Money `json:"extra_income"`
	ExtraExpense money.Money `json:"extra_expense"`
}

func (h *Handler) GenerateGoals(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[GenerateGoalsReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	err = h.service.GenerateGoalsFromForecast(r.Context(), req.Year, GoalAdjustment{
		ExtraIncome:  req.ExtraIncome,
		ExtraExpense: req.ExtraExpense,
	})
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	goals, err := h.service.ListGoalsByYear(r.Context(), strconv.Itoa(req.Year))
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, goals)
}

func (h *Handler) GetPlanningConfig(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "year required", nil)
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid year", err)
		return
	}

	cfg, err := h.service.GetPlanningConfig(r.Context(), year)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, cfg)
}

func (h *Handler) SetPlanningConfig(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "year required", nil)
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid year", err)
		return
	}

	req, err := httpx.DecodeJSON[PlanningConfigReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	cfg, err := h.service.SetPlanningConfig(r.Context(), year, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, cfg)
}

func (h *Handler) GetPlanYear(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "year required", nil)
		return
	}

	p, err := h.service.GetPlanYear(r.Context(), yearStr)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, p)
}

func (h *Handler) GetForecastYear(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "year required", nil)
		return
	}

	p, err := h.service.BuildPlanningYear(r.Context(), yearStr)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, p)
}
