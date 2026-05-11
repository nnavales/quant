package chatbot

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"time"

	"github.com/nnavales/quant/api/config"
	tele "gopkg.in/telebot.v4"
)

// handlers
func registerHandlers(b *tele.Bot, a *Agent) {
	b.Handle("/start", func(c tele.Context) error {
		return c.Send("Bienvenido a Quant")
	})

	b.Handle(tele.OnText, func(c tele.Context) error {
		if a == nil {
			return c.Send("Agente no configurado")
		}
		reply, err := a.ProcessMessage(c.Text())
		if err != nil {
			return c.Send("Error: " + err.Error())
		}

		return safeSend(c, reply)
	})
}

func NewBot(token string, telegramID int64, a *Agent) (*tele.Bot, error) {
	if telegramID == 0 {
		return nil, errors.New("telegramID is required")
	}

	pref := tele.Settings{
		Token:  token,
		Poller: &tele.LongPoller{Timeout: 10 * time.Second},
	}
	bot, err := tele.NewBot(pref)
	if err != nil {
		return nil, err
	}

	if telegramID != 0 {
		bot.Use(func(next tele.HandlerFunc) tele.HandlerFunc {
			return func(c tele.Context) error {
				if c.Sender().ID != telegramID {
					return nil // ignore
				}
				return next(c)
			}
		})
	}

	registerHandlers(bot, a)
	return bot, nil
}

func initBot(cfg config.Config, a *Agent) *tele.Bot {
	if cfg.TelegramToken == "" || cfg.TelegramID == 0 {
		slog.Info("bot: skipped, token or id not configured")
		return nil
	}
	if err := validateToken(cfg.TelegramToken); err != nil {
		slog.Warn("bot: token validation failed", "err", err)
		return nil
	}
	bot, err := NewBot(cfg.TelegramToken, cfg.TelegramID, a)
	if err != nil {
		slog.Warn("bot: creation failed", "err", err)
		return nil
	}
	slog.Info("bot: started", "id", cfg.TelegramID)
	go bot.Start()
	return bot
}

func updateBot(cfg *config.Config, newCfg config.Config, bot *tele.Bot, a *Agent) *tele.Bot {
	if bot != nil {
		bot.Stop()
	}
	cfg.TelegramToken = newCfg.TelegramToken
	cfg.TelegramID = newCfg.TelegramID
	return initBot(newCfg, a)
}

// validation token with telegram API
func validateToken(token string) error {
	var url = fmt.Sprintf("https://api.telegram.org/bot%s/getMe", token)
	res, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("request to telegram API failed: %w", err)
	}

	if res.StatusCode > 299 || res.StatusCode < 200 {
		return fmt.Errorf("bad API response (%d): %w", res.StatusCode, err)
	}

	type telegramRes struct {
		Ok     bool `json:"ok"`
		Result struct {
			ID       int    `json:"id"`
			IsBot    bool   `json:"is_bot"`
			Username string `json:"username"`
		} `json:"result"`
	}

	b, _ := io.ReadAll(res.Body)
	var teleRes telegramRes
	if err := json.Unmarshal(b, &teleRes); err != nil {
		return fmt.Errorf("unable to decode telegram API response: %w", err)
	}

	var invalidTokenErr = errors.New("invalid telegram token")
	if !teleRes.Ok {
		return invalidTokenErr
	}

	if !teleRes.Result.IsBot {
		return invalidTokenErr
	}

	return nil
}

func safeSend(c tele.Context, text string) error {
	err := c.Send(text, &tele.SendOptions{
		ParseMode: tele.ModeHTML,
	})

	if err == nil {
		return nil
	}

	// fallback: texto plano
	return c.Send(stripHTML(text))
}

func stripHTML(s string) string {
	var tagRe = regexp.MustCompile(`<[^>]*>`)
	return tagRe.ReplaceAllString(s, "")
}
