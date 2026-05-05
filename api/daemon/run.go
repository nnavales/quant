package daemon

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"

	"github.com/nnavales/summit/api/backup"
	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/config"
	"github.com/nnavales/summit/api/dashboard"
	"github.com/nnavales/summit/api/db"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/historical"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/logger"
	"github.com/nnavales/summit/api/macro"
	"github.com/nnavales/summit/api/networth"
	"github.com/nnavales/summit/api/presets"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/nnavales/summit/api/transactions"
	"github.com/nnavales/summit/api/transport"
	"github.com/nnavales/summit/api/users"
)

// Run initializes and starts the Summit API server.
// It blocks until the stop channel is closed or an interrupt signal is received.
func Run(stopCh <-chan struct{}) error {
	cfg, err := config.New()
	if err != nil {
		return fmt.Errorf("config.error: %w", err)
	}

	log, err := logger.New(cfg)
	if err != nil {
		return fmt.Errorf("logger.error %w", err)
	}
	slog.SetDefault(log)

	dbConn, err := db.New(cfg)
	if err != nil {
		return fmt.Errorf("database.error %w", err)
	}
	defer dbConn.Close()

	clock := timeutils.RealClock{}

	macroProvider, err := macro.NewEconomicProvider(context.Background())
	if err != nil {
		return fmt.Errorf("macro.provider.error: %w", err)
	}

	macroService := macro.NewService(macroProvider)

	dashboardRepo := dashboard.NewSQLiteRepo(dbConn.DB)
	dashboardService := dashboard.NewService(dashboardRepo)

	transactionsRepo := transactions.NewSQLiteRepo(dbConn.DB)
	transactionsService := transactions.NewService(clock, transactionsRepo)

	installmentsRepo := installments.NewSQLiteRepo(dbConn.DB)
	installmentsService := installments.NewService(clock, installmentsRepo)

	entriesRepo := entries.NewSQLiteRepo(dbConn.DB)
	entriesService := entries.NewService(clock, entriesRepo)

	financeRepo := finance.NewSQLiteRepo(dbConn.DB)
	historicalRepo := historical.NewSQLiteRepo(dbConn.DB)
	historicalService := historical.NewService(clock, historicalRepo, transactionsRepo)
	financeService := finance.NewService(clock, financeRepo, historicalRepo, installmentsRepo)

	channelsRepo := channels.NewSQLiteRepo(dbConn.DB)
	channelsService := channels.NewService(clock, channelsRepo)

	categoriesRepo := categories.NewSQLiteRepo(dbConn.DB)
	categoriesService := categories.NewService(clock, categoriesRepo)

	usersRepo := users.NewRepo(dbConn.DB)
	usersService := users.NewService(clock, usersRepo)

	networthRepo := networth.NewRepo(dbConn.DB)
	networthService := networth.NewService(networthRepo, clock, *macroProvider, *usersRepo)

	presetsRepo := presets.NewSQLiteRepo(dbConn.DB)
	presetsService := presets.NewService(clock, presetsRepo)

	backupService := backup.NewService(dbConn.DB, financeRepo, networthRepo, historicalRepo, categoriesRepo, channelsRepo)

	if err := users.SeedDefaults(context.Background(), usersRepo, clock); err != nil {
		slog.Warn("user.config.seed.error", "err", err)
	}

	services := &transport.Services{
		FinanceService:      financeService,
		TransactionsService: transactionsService,
		EntriesService:      entriesService,
		InstallmentsService: installmentsService,
		ChannelsService:     channelsService,
		CategoriesService:   categoriesService,
		MacroService:        macroService,
		UsersService:        usersService,
		HistoricalService:   historicalService,
		DashboardService:    dashboardService,
		NetWorthService:     networthService,
		PresetsService:      presetsService,
		BackupService:       backupService,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle OS signals
	sigCtx, stop := signal.NotifyContext(ctx, os.Interrupt)
	defer stop()

	// Also listen to the stop channel (for service.Stop)
	if stopCh != nil {
		go func() {
			select {
			case <-stopCh:
				stop()
			case <-sigCtx.Done():
			}
		}()
	}

	httpServer := transport.NewServer(cfg.Config, services)

	go func() {
		if err := httpServer.Run(sigCtx); err != nil {
			slog.Error("server.error", "err", err)
			stop()
		}
	}()

	<-sigCtx.Done()

	if err := httpServer.Shutdown(context.Background()); err != nil {
		return fmt.Errorf("server.shutdown.error: %w", err)
	}

	return nil
}
