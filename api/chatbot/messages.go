package chatbot

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"gopkg.in/telebot.v4"
)

type Message struct {
	Text   string
	Images [][]byte
}

func buildMessage(bot telebot.API, input telebot.Message) (*Message, error) {
	msg := &Message{Text: input.Text}
	if input.Caption != "" {
		msg.Text = input.Caption
	}

	if input.Photo != nil {
		data, err := downloadFile(bot, &input.Photo.File)
		if err != nil {
			return nil, fmt.Errorf("downloading photo %s: %w", input.Photo.FileID, err)
		}
		msg.Images = append(msg.Images, data)
	}

	if input.Document != nil && strings.HasPrefix(input.Document.MIME, "image/") {
		data, err := downloadFile(bot, &input.Document.File)
		if err != nil {
			return nil, fmt.Errorf("downloading document %s: %w", input.Document.FileID, err)
		}
		msg.Images = append(msg.Images, data)
	}

	return msg, nil
}

func downloadFile(bot telebot.API, f *telebot.File) ([]byte, error) {
	rc, err := bot.File(f)
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, rc); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
