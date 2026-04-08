package transport

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/config"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/macro"
	"github.com/nnavales/summit/api/transactions"
	"github.com/nnavales/summit/api/transport/middleware"
	"github.com/nnavales/summit/api/users"
)

type Server struct {
	http.Server
	Services
}

type Services struct {
	FinanceService      *finance.Service
	TransactionsService *transactions.Service
	EntriesService      *entries.Service
	InstallmentsService *installments.Service
	ChannelsService     *channels.Service
	CategoriesService   *categories.Service
	MacroService        *macro.Service
	UsersService        *users.Service
}

func NewServer(cfg config.Config, services *Services) *Server {
	financeHandler := finance.NewHandler(services.FinanceService)
	transactionsHandler := transactions.NewHandler(services.TransactionsService)
	entriesHandler := entries.NewHandler(services.EntriesService)
	installmentsHandler := installments.NewHandler(services.InstallmentsService)
	channelsHandler := channels.NewHandler(services.ChannelsService)
	categoriesHandler := categories.NewHandler(services.CategoriesService)
	macroHandler := macro.NewHandler(services.MacroService)
	usersHandler := users.NewHandler(services.UsersService)

	api := http.NewServeMux()

	addRoutes(api, financeHandler, transactionsHandler, entriesHandler, installmentsHandler, channelsHandler, categoriesHandler, macroHandler, usersHandler)

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
	slog.Info("server.started", slog.String("addr", sv.Addr))

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
