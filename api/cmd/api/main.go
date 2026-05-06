package main

import (
	"log/slog"
	"os"

	"github.com/nnavales/quant/api/daemon"
)

func main() {
	if err := daemon.Run(nil); err != nil {
		slog.Error("api.error", "err", err)
		os.Exit(1)
	}
}
