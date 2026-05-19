package runtime

import (
	"context"
	"fmt"

	"github.com/nnavales/quant/api/backup"
	"github.com/nnavales/quant/api/categories"
	"github.com/nnavales/quant/api/channels"
	"github.com/nnavales/quant/api/config"
	"github.com/nnavales/quant/api/dashboard"
	"github.com/nnavales/quant/api/db"
	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/installments"
	"github.com/nnavales/quant/api/macro"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/planning"
	"github.com/nnavales/quant/api/presets"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
	"github.com/nnavales/quant/api/transport"
	"github.com/nnavales/quant/api/users"
)

type App struct {
	DB       *db.DB
	Services *transport.Services
}

func NewApp(ctx context.Context, cfg config.Runtime) (*App, error) {
	dbConn, err := db.New(cfg)
	if err != nil {
		return nil, fmt.Errorf("database.error: %w", err)
	}

	clock := timeutils.RealClock{}

	macroProvider, err := macro.NewEconomicProvider(ctx)
	if err != nil {
		dbConn.Close()
		return nil, fmt.Errorf("macro.provider.error: %w", err)
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

	planningRepo := planning.NewSQLiteRepo(dbConn.DB)
	planningService := planning.NewService(clock, planningRepo)

	presetsRepo := presets.NewSQLiteRepo(dbConn.DB)
	presetsService := presets.NewService(clock, presetsRepo)

	backupService := backup.NewService(dbConn.DB, financeRepo, networthRepo, historicalRepo, categoriesRepo, channelsRepo)

	if err := users.SeedDefaults(ctx, usersRepo, clock); err != nil {
		return nil, fmt.Errorf("users.seed.error: %w", err)
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
		PlanningService:     planningService,
		BackupService:       backupService,
	}

	return &App{
		DB:       dbConn,
		Services: services,
	}, nil
}

func (a *App) Close() error {
	if a.DB != nil {
		a.DB.Close()
	}

	return nil
}
