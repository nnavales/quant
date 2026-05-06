package logger

import (
	"log/slog"
	"os"
	"path/filepath"

	"github.com/nnavales/quant/api/config"
	"gopkg.in/natefinch/lumberjack.v2"
)

func New(cfg config.Runtime) (*slog.Logger, error) {
	level := slog.LevelInfo

	opts := &slog.HandlerOptions{
		AddSource: false,
		Level:     level,
	}

	if cfg.Env == "dev" {
		level = slog.LevelDebug
		return slog.New(slog.NewTextHandler(os.Stdout, opts)), nil
	}

	if err := os.MkdirAll(cfg.AppDataDir, 0755); err != nil {
		return nil, err
	}

	path := filepath.Join(cfg.AppDataDir, "log.json")

	w := &lumberjack.Logger{
		Filename:   path,
		MaxSize:    100,
		MaxBackups: 3,
		MaxAge:     7,
	}

	handler := slog.NewJSONHandler(w, opts)

	return slog.New(handler), nil
}
