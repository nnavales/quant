package channels

import (
	"context"
	"log/slog"

	"github.com/nnavales/quant/api/timeutils"
)

func SeedDefaults(ctx context.Context, repo *SQLiteRepo, clock timeutils.Clock) error {
	now := clock.Now()

	channelNames := []string{
		"Efectivo", "Mercado Pago", "Uala", "BBVA", "Galicia", "Naranja X", "Brubank", "BPRO", "Binance", "Cocos Cap.",
	}

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
	}{
		{"Efectivo", "Efectivo", "cash"},
		{"Mercado Pago", "Transferencia", "transfer"},
		{"Mercado Pago", "Credito 5662", "credit_card"},
		{"Uala", "Transferencia", "transfer"},
		{"Uala", "Debito 8934", "debit_card"},
		{"Uala", "Credito 3838", "credit_card"},
		{"BBVA", "Transferencia", "transfer"},
		{"BBVA", "Credito 5270", "credit_card"},
		{"BBVA", "Signature 0530", "debit_card"},
		{"BBVA", "Debito 9996", "debit_card"},
		{"Galicia", "Transferencia", "transfer"},
		{"Galicia", "Debito 4294", "debit_card"},
		{"Galicia", "Credito 7310", "credit_card"},
		{"Galicia", "Credito 2936", "credit_card"},
		{"Naranja X", "Transferencia", "transfer"},
		{"Naranja X", "Debito 7518", "debit_card"},
		{"Brubank", "Transferencia", "transfer"},
		{"Brubank", "Debito 2549", "debit_card"},
		{"BPRO", "Transferencia", "transfer"},
		{"BPRO", "Debito 5011", "debit_card"},
		{"Binance", "Transferencia", "transfer"},
		{"Binance", "P2P", "transfer"},
		{"Cocos Cap.", "Transferencia", "transfer"},
	}

	for _, as := range accountSeeds {
		channelID, ok := channelIDs[as.channelName]
		if !ok {
			continue
		}

		existingAccounts, err := repo.ListAccounts(ctx, Filter{Deleted: false})
		if err == nil {
			found := false
			for _, acc := range existingAccounts {
				if acc.ChannelID == channelID && acc.Name == as.name {
					found = true
					break
				}
			}
			if found {
				slog.Info("account.seed.found", "account", as.name)
				continue
			}
		}

		acc := NewAccount(now, channelID, as.name, as.instrument)
		_, err = repo.CreateAccount(ctx, *acc)
		if err != nil {
			slog.Warn("account.seed.error", "err", err, "account", as.name)
		} else {
			slog.Info("account.seed.created", "account", as.name)
		}
	}

	return nil
}
