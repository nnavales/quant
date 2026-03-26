package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
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
