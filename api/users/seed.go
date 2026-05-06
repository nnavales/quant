package users

import (
	"context"
	"log/slog"

	"github.com/nnavales/quant/api/timeutils"
)

func SeedDefaults(ctx context.Context, repo *Repo, clock timeutils.Clock) error {
	err := repo.InsertIfNotExists(ctx, cfg, clock.Now())
	if err != nil {
		slog.Warn("user.config.seed.error", "err", err)
	}

	return nil
}
