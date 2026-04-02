package users

import (
	"context"
	"log/slog"

	"github.com/nnavales/summit/api/timeutils"
)

func SeedDefaults(ctx context.Context, repo *Repo, clock timeutils.Clock) error {
	defaults := map[string]any{
		KeyDefaultDollarSource: "bna",
		KeyDefaultCurrency:     "ARS",
	}

	for key, _ := range defaults {
		err := repo.InsertIfNotExists(ctx, defaults, clock.Now())
		if err != nil {
			slog.Warn("user.config.seed.error", "key", key, "err", err)
		}
	}

	return nil
}
