package daemon

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nnavales/quant/api/chatbot"
	"github.com/nnavales/quant/api/config"
	"github.com/nnavales/quant/api/daemon/runtime"
	"github.com/nnavales/quant/api/logger"
	"github.com/nnavales/quant/api/transport"
)

// Run initializes and starts the Quant API server.
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

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCtx, stop := signal.NotifyContext(
		ctx,
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	if stopCh != nil {
		go func() {
			select {
			case <-stopCh:
				stop()

			case <-sigCtx.Done():
			}
		}()
	}

	app, err := runtime.NewApp(sigCtx, cfg)
	if err != nil {
		return fmt.Errorf("runtime.error: %w", err)
	}

	defer app.Close()

	go chatbot.Start(sigCtx, cfg.Config, &chatbot.ServiceTools{
		FinanceSvc:    app.Services.FinanceService,
		CategorySvc:   app.Services.CategoriesService,
		ChannelSvc:    app.Services.ChannelsService,
		MacroSvc:      app.Services.MacroService,
		DashboardSvc:  app.Services.DashboardService,
		UserSvc:       app.Services.UsersService,
		HistoricalSvc: app.Services.HistoricalService,
		NetWorthSvc:   app.Services.NetWorthService,
	})

	addr := "127.0.0.1:0"

	if cfg.Mode == "service" {
		addr = fmt.Sprintf("127.0.0.1:%d", cfg.Port)
	}

	httpServer := transport.NewServer(cfg.Config, app.Services)

	serverErrCh := make(chan error, 1)

	go func() {
		serverErrCh <- httpServer.Run(addr)
	}()

	select {
	case <-sigCtx.Done():

	case err := <-serverErrCh:
		if err != nil &&
			!errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("server.error: %w", err)
		}
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("server.shutdown.error: %w", err)
	}

	return nil
}
