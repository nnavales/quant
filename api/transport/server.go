package transport

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"

	"github.com/nnavales/quant/api/backup"
	"github.com/nnavales/quant/api/categories"
	"github.com/nnavales/quant/api/channels"
	"github.com/nnavales/quant/api/chatbot"
	"github.com/nnavales/quant/api/config"
	"github.com/nnavales/quant/api/dashboard"
	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/installments"
	"github.com/nnavales/quant/api/macro"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/planning"
	"github.com/nnavales/quant/api/presets"
	"github.com/nnavales/quant/api/transactions"
	"github.com/nnavales/quant/api/transport/middleware"
	"github.com/nnavales/quant/api/users"
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
	HistoricalService   *historical.Service
	DashboardService    *dashboard.Service
	NetWorthService     *networth.Service
	PresetsService      *presets.Service
	PlanningService     *planning.Service
	BackupService       *backup.Service
}

func NewServer(cfg config.Config, services *Services) *Server {
	financeHandler := finance.NewHandler(services.FinanceService, services.CategoriesService, services.ChannelsService)
	transactionsHandler := transactions.NewHandler(services.TransactionsService)
	entriesHandler := entries.NewHandler(services.EntriesService)
	installmentsHandler := installments.NewHandler(services.InstallmentsService)
	channelsHandler := channels.NewHandler(services.ChannelsService)
	categoriesHandler := categories.NewHandler(services.CategoriesService)
	macroHandler := macro.NewHandler(services.MacroService)
	usersHandler := users.NewHandler(services.UsersService)
	historicalHandler := historical.NewHandler(services.HistoricalService)
	dashboardHandler := dashboard.NewHandler(services.DashboardService, services.PlanningService)
	networthHandler := networth.NewHandler(services.NetWorthService)
	presetsHandler := presets.NewHandler(services.PresetsService)
	planningHandler := planning.NewHandler(services.PlanningService)
	backupHandler := backup.NewHandler(services.BackupService)
	chatbotHandler := chatbot.NewHandler()

	api := http.NewServeMux()

	addRoutes(api,
		financeHandler, transactionsHandler, entriesHandler,
		installmentsHandler, channelsHandler, categoriesHandler,
		macroHandler, usersHandler, historicalHandler, dashboardHandler,
		networthHandler, presetsHandler, planningHandler, backupHandler, chatbotHandler,
	)

	var handler http.Handler = api
	handler = middleware.CORS(handler)
	handler = middleware.Logging(handler)
	handler = middleware.Recover(handler)

	root := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", handler))

	return &Server{
		Server: http.Server{Handler: root},
	}
}

func (sv *Server) Run(addr string) error {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}

	tcpAddr, ok := ln.Addr().(*net.TCPAddr)
	if !ok {
		_ = ln.Close()
		return fmt.Errorf("invalid tcp listener")
	}

	cfg, err := config.ReadConfigFile()
	if err != nil {
		_ = ln.Close()
		return fmt.Errorf("failed to load config: %w", err)
	}

	cfg.Port = tcpAddr.Port

	if err := config.EditConfigFile(cfg); err != nil {
		_ = ln.Close()
		return fmt.Errorf("failed to update config: %w", err)
	}

	slog.Info(
		"server.started",
		slog.String("addr", ln.Addr().String()),
		slog.Int("port", tcpAddr.Port),
	)

	err = sv.Serve(ln)
	if err != nil &&
		!errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("serve.error: %w", err)
	}

	return nil
}

func (sv *Server) Shutdown(ctx context.Context) error {
	slog.Info("server.shutting_down")

	if err := sv.Server.Shutdown(ctx); err != nil {
		return fmt.Errorf("shutdown.error: %w", err)
	}

	return nil
}
