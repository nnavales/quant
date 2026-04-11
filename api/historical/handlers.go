package historical

import (
	"errors"
	"net/http"

	"github.com/nnavales/summit/api/timeutils"
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

func (h *Handler) CreateHistoricalEntry(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[HistoricalFinanceReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	entry, err := h.service.CreateHistoricalEntry(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrDuplicate) {
			httpx.WriteError(w, r, 409, "historical entry already exists", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create historical entry", err)
		return
	}

	httpx.WriteJSON(w, 201, entry)
}

func (h *Handler) UpdateHistoricalEntry(w http.ResponseWriter, r *http.Request) {
	dateStr := r.PathValue("date")
	if dateStr == "" {
		httpx.WriteError(w, r, 400, "date required", nil)
		return
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid date format", err)
		return
	}

	req, err := httpx.DecodeJSON[HistoricalFinanceReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	entry, err := h.service.UpdateHistoricalEntry(r.Context(), date, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "historical entry not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update historical entry", err)
		return
	}

	httpx.WriteJSON(w, 200, entry)
}

func (h *Handler) ListHistoricalEntries(w http.ResponseWriter, r *http.Request) {
	entries, err := h.service.ListHistoricalEntries(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list historical entries", err)
		return
	}

	httpx.WriteJSON(w, 200, entries)
}

func (h *Handler) GetHistoricalEntryByDate(w http.ResponseWriter, r *http.Request) {
	dateStr := r.PathValue("date")
	if dateStr == "" {
		httpx.WriteError(w, r, 400, "date required", nil)
		return
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid date format", err)
		return
	}

	entry, err := h.service.GetHistoricalEntryByDate(r.Context(), date)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "historical entry not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get historical entry", err)
		return
	}

	httpx.WriteJSON(w, 200, entry)
}

func (h *Handler) DeleteHistoricalEntry(w http.ResponseWriter, r *http.Request) {
	dateStr := r.PathValue("date")
	if dateStr == "" {
		httpx.WriteError(w, r, 400, "date required", nil)
		return
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid date format", err)
		return
	}

	err = h.service.DeleteHistoricalEntry(r.Context(), date)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "historical entry not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete historical entry", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) BulkCreateHistoricalEntries(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[BulkCreateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	err = h.service.BulkCreateHistoricalEntries(r.Context(), req)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to bulk create historical entries", err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
