package chatbot

import (
	"context"
	"log/slog"

	"github.com/nnavales/quant/api/config"
)

/*
-> We try to inicializate the agent
-> We try to initializate the bot
	-> If they fail (one or both) there is no problem, the things dont run and that's it
	-> On update of config or adding new one we update agent and update bot if they changed (it reinitializes them)
-> Telegram consumes the message and makes the agent process it. After that it gives back an answer
*/

func Start(ctx context.Context, cfg config.Config, svcTools *ServiceTools) {
	tools := NewTools(svcTools)
	a := initAgent(cfg, tools)
	bot := initBot(cfg, a)

	slog.Info("chatbot: waiting for config changes")
	for range config.Watch() {
		newCfg, _ := config.ReadConfigFile()

		agentChanged := newCfg.APIKeyAI != cfg.APIKeyAI ||
			newCfg.BaseURL != cfg.BaseURL ||
			newCfg.ModelID != cfg.ModelID

		telegramChanged := newCfg.TelegramToken != cfg.TelegramToken ||
			newCfg.TelegramID != cfg.TelegramID

		if agentChanged {
			a = updateAgent(&cfg, newCfg, tools)
		}

		// the bot's OnText handler captures *Agent at registration, so a new
		// agent only takes effect once the bot is rebuilt — rebind it whenever
		// the agent or the telegram creds changed.
		if agentChanged || telegramChanged {
			bot = updateBot(&cfg, newCfg, bot, a)
		}
	}
}
