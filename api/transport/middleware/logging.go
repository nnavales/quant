package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/nnavales/summit/api/transport/httpx"
)

type responseWrapper struct {
	http.ResponseWriter
	status  int
	written bool
}

func (r *responseWrapper) WriteHeader(statusCode int) {
	if r.written == true {
		return
	}

	r.status = statusCode
	r.written = true
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseWrapper) Write(b []byte) (int, error) {
	if !r.written {
		r.WriteHeader(200)
	}

	return r.ResponseWriter.Write(b)
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rw := &responseWrapper{
			ResponseWriter: w,
			status:         http.StatusOK,
		}

		start := time.Now()
		next.ServeHTTP(rw, r)
		took := time.Since(start)

		err := httpx.GetError(r)

		args := []any{
			"method", r.Method,
			"request_uri", r.URL.Path,
			"status", rw.status,
			"requests_size", r.ContentLength,
			"took", took,
		}

		if err != nil {
			args = append(args, "error", err)
		}

		if rw.status > 499 {
			slog.Error("http.request", args...)
		} else if rw.status == 401 || rw.status == 403 {
			slog.Warn("http.request", args...)
		} else {
			slog.Info("http.request", args...)
		}
	})
}
