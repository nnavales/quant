package channels

import (
	"context"
	"log/slog"

	"github.com/nnavales/summit/api/timeutils"
)

func SeedDefaults(ctx context.Context, repo *SQLiteRepo, clock timeutils.Clock) error {
	channelNames := []string{"Efectivo", "Mercado Pago", "BBVA", "Santander", "Provincia", "Galicia", "Banco Nación"}

	now := clock.Now()
	channelIDs := make(map[string]string)

	existingChannels, err := repo.ListChannels(ctx, Filter{Deleted: false})
	if err == nil {
		for _, ch := range existingChannels {
			channelIDs[ch.Name] = ch.ID
		}
	}

	for _, name := range channelNames {
		if _, exists := channelIDs[name]; exists {
			slog.Info("channel.seed.found", "channel", name)
			continue
		}

		c := NewChannel(now, name)
		created, err := repo.CreateChannel(ctx, *c)
		if err != nil {
			slog.Warn("channel.seed.error", "err", err, "channel", name)
			continue
		}
		channelIDs[name] = created.ID
		slog.Info("channel.seed.created", "channel", name)
	}

	accountSeeds := []struct {
		channelName string
		name        string
		instrument  string
		lastFour    string
	}{
		{"Efectivo", "Efectivo", "cash", ""},
		{"Mercado Pago", "Débito", "debit_card", ""},
		{"Mercado Pago", "Crédito", "credit_card", "0000"},
		{"BBVA", "Débito", "debit_card", ""},
		{"BBVA", "Crédito", "credit_card", "1234"},
		{"Santander", "Débito", "debit_card", ""},
		{"Santander", "Crédito", "credit_card", "5678"},
		{"Provincia", "Débito", "debit_card", ""},
		{"Galicia", "Débito", "debit_card", ""},
		{"Galicia", "Crédito", "credit_card", "9012"},
		{"Banco Nación", "Débito", "debit_card", ""},
	}

	for _, as := range accountSeeds {
		channelID, ok := channelIDs[as.channelName]
		if !ok {
			continue
		}
		acc := NewAccount(now, channelID, as.name, as.instrument)
		if as.lastFour != "" {
			acc.SetLastFour(as.lastFour)
		}
		_, err := repo.CreateAccount(ctx, *acc)
		if err != nil {
			slog.Warn("account.seed.error", "err", err, "account", as.name)
		} else {
			slog.Info("account.seed.created", "account", as.name)
		}
	}

	return nil
}
