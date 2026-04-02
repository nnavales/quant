package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"

	"github.com/nnavales/summit/api/config"
	"github.com/nnavales/summit/api/db"
	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/logger"
	"github.com/nnavales/summit/api/macro"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/nnavales/summit/api/transport"
	"github.com/nnavales/summit/api/users"
)

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

	logger, err := logger.New(cfg)
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

	financeRepo := finance.NewSQLiteRepo(dbConn.DB)
	financeService := finance.NewService(clock, financeRepo)

	usersRepo := users.NewRepo(dbConn.DB)
	usersService := users.NewService(clock, usersRepo)

	err = financeService.SeedDefaults(context.Background())
	if err != nil {
		slog.Warn("finances.seed.error", "err", err)
	}

	if err := users.SeedDefaults(context.Background(), usersRepo, clock); err != nil {
		slog.Warn("user.config.seed.error", "err", err)
	}

	services := &transport.Services{
		FinanceService: financeService,
		MacroService:   macroService,
		UsersService:   usersService,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	httpServer := transport.NewServer(cfg, services)

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
