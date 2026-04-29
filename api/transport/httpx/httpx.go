package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/nnavales/summit/api/apperrors"
)

var (
	ErrEmptyBody   = errors.New("invalid request body")
	ErrInvalidJSON = errors.New("invalid json request")
)

func WriteJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.Error("json encode failed", "error", err)
	}
}

func DecodeJSON[T any](r io.Reader) (T, error) {
	var v T
	dec := json.NewDecoder(r)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&v); err != nil {
		if errors.Is(err, io.EOF) {
			return v, ErrEmptyBody
		}
		return v, ErrInvalidJSON
	}
	return v, nil
}

func WriteError(w http.ResponseWriter, r *http.Request, status int, msg string, err error) {
	WriteJSON(w, status, map[string]any{
		"error": msg,
	})

	if err != nil {
		*r = *SetError(r, err)
	}
}

// WriteServiceError maps known apperrors sentinel errors to HTTP status codes
// and writes the response. Unknown errors become 500 Internal Server Error.
func WriteServiceError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case err == nil:
		return
	case errors.Is(err, apperrors.ErrNotFound):
		WriteError(w, r, http.StatusNotFound, "not found", err)
	case errors.Is(err, apperrors.ErrInvalidInput):
		WriteError(w, r, http.StatusBadRequest, "invalid input", err)
	case errors.Is(err, apperrors.ErrDuplicate):
		WriteError(w, r, http.StatusConflict, "already exists", err)
	case errors.Is(err, apperrors.ErrConflict):
		WriteError(w, r, http.StatusConflict, "conflict", err)
	case errors.Is(err, apperrors.ErrUnauthorized):
		WriteError(w, r, http.StatusUnauthorized, "unauthorized", err)
	case errors.Is(err, apperrors.ErrForbidden):
		WriteError(w, r, http.StatusForbidden, "forbidden", err)
	default:
		WriteError(w, r, http.StatusInternalServerError, "internal error", err)
	}
}

type ctxKey string

const errKey ctxKey = "http_error"

func SetError(r *http.Request, err error) *http.Request {
	ctx := context.WithValue(r.Context(), errKey, err)
	return r.WithContext(ctx)
}

func GetError(r *http.Request) error {
	err, _ := r.Context().Value(errKey).(error)
	return err
}
