package transport

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/nnavales/summit/api/config"
	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/transport/middleware"
)

type Server struct {
	http.Server
	Services
}

type Services struct {
	*finance.Service
}

func NewServer(cfg config.Config, services *Services) *Server {
	financeHandler := finance.NewHandler(services.Service)

	api := http.NewServeMux()

	addRoutes(api, financeHandler)

	var handler http.Handler = api
	handler = middleware.CORS(handler)
	handler = middleware.Logging(handler)
	handler = middleware.Recover(handler)

	root := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", handler))

	return &Server{
		Server: http.Server{Addr: cfg.Addr, Handler: root},
	}
}

func (sv *Server) Run(ctx context.Context) error {
	slog.Info("server.started", slog.String("addr", "localhost:6969"))

	if err := sv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	return nil
}

func (sv *Server) Shutdown(ctx context.Context) error {
	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	slog.Info("server.shutting_down")
	return sv.Server.Shutdown(shutdownCtx)
}
