package historical

import (
	"bytes"
	"io"
	"net/http"

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

func (h *Handler) CreateHistoricalEntry(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[HistoricalFinanceReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	entry, err := h.service.CreateHistoricalEntry(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, entry)
}

func (h *Handler) UpdateHistoricalEntry(w http.ResponseWriter, r *http.Request) {
	dateStr := r.PathValue("date")
	if dateStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "date required", nil)
		return
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid date format", err)
		return
	}

	req, err := httpx.DecodeJSON[HistoricalFinanceReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	entry, err := h.service.UpdateHistoricalEntry(r.Context(), date, req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, entry)
}

func (h *Handler) ListHistoricalEntries(w http.ResponseWriter, r *http.Request) {
	entries, err := h.service.ListHistoricalEntries(r.Context())
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, entries)
}

func (h *Handler) GetHistoricalEntryByDate(w http.ResponseWriter, r *http.Request) {
	dateStr := r.PathValue("date")
	if dateStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "date required", nil)
		return
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid date format", err)
		return
	}

	entry, err := h.service.GetHistoricalEntryByDate(r.Context(), date)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, entry)
}

func (h *Handler) DeleteHistoricalEntry(w http.ResponseWriter, r *http.Request) {
	dateStr := r.PathValue("date")
	if dateStr == "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "date required", nil)
		return
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid date format", err)
		return
	}

	err = h.service.DeleteHistoricalEntry(r.Context(), date)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) BulkCreateHistoricalEntries(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[BulkCreateReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid request", err)
		return
	}

	err = h.service.BulkCreateHistoricalEntries(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) BulkCreateHistoricalEntriesCSV(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "failed to read request body", err)
		return
	}

	reqs, err := h.ParseHistoricalCSV(bytes.NewReader(body))
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "invalid CSV", err)
		return
	}

	req := BulkCreateReq{Data: reqs}
	err = h.service.BulkCreateHistoricalEntries(r.Context(), req)
	if err != nil {
		httpx.WriteServiceError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
