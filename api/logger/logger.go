package logger

import (
	"log/slog"
	"os"

	"github.com/nnavales/summit/api/config"
)

func New(cfg config.Config) (*slog.Logger, error) {
	opts := &slog.HandlerOptions{
		AddSource: false,
		Level:     slog.LevelDebug,
	}

	if cfg.Env == config.ENV_PRODUCTION {
		opts.Level = slog.LevelInfo
		handler := slog.NewJSONHandler(os.Stdout, opts)
		return slog.New(handler), nil

	}

	handler := slog.NewTextHandler(os.Stdout, opts)
	return slog.New(handler), nil
}
