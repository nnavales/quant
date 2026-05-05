package main

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

/*
1. Check de si la db esta
	> Si esta: check de migraciones y correr normalmente
	> Si no esta: Crear el archivo y migraciones

2. Setear port para la API y escribirlo en un archivo.
	> Si estaba escrito correr con ese port.
	> Si no estaba setear nuevo puerto y escribirlo.

3. De alguna manera preguntar al usuario si quiere que el processo se convierta en un daemon.
	> Si acepta: crea el deamon para el OS del user
	> Si no acepta: la API se corre en modo user (solo corre con el cliente opened)
*/

func main() {
	if err := run(); err != nil {
		slog.Error("api.error", "err", err)
		os.Exit(1)
	}
}

func run() error {
	// initialize dependencies
	cfg, err := config.New()
	if err != nil {
		return fmt.Errorf("config.error: %w", err)
	}

	logger, err := logger.New(cfg.Config)
	if err != nil {
		return fmt.Errorf("logger.error %w", err)
	}
	slog.SetDefault(logger)

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

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	httpServer := transport.NewServer(cfg.Config, services)

	go func() {
		if err := httpServer.Run(ctx); err != nil {
			slog.Error("server.error", "err", err)
			stop()
		}
	}()
	<-ctx.Done()

	if err := httpServer.Shutdown(context.Background()); err != nil {
		return fmt.Errorf("server.shutdown.error: %w", err)
	}

	return nil
}
