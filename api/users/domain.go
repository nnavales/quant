package users

import (
	"context"
	"errors"
	"strconv"
)

var ErrInvalidKey = errors.New("invalid config key")

type UserConfig struct {
	DollarSource string     `json:"dollar_source"`
	Username     string     `json:"username"`
	Timezone     string     `json:"timezone"`
	DateFormat   DateFormat `json:"date_format"`
	DefaultRate  string     `json:"default_rate"`
	Theme        string     `json:"theme"`
}

type Key string

const (
	KeyDollarSource Key = "dollar_source"
	KeyUsername     Key = "username"
	KeyTimezone     Key = "timezone"
	KeyDateFormat   Key = "date_format"
	KeyDefaultRate  Key = "default_rate"
	KeyTheme        Key = "theme"
)

var DefaultUserConfig = UserConfig{
	DollarSource: "banco-nacion",
	Username:     "",
	Timezone:     "America/Argentina/Buenos_Aires",
	DateFormat:   DateSASlash,
	DefaultRate:  "1400",
	Theme:        "dark",
}

type Repository interface {
	Update(ctx context.Context, key, value string) error
	Get(ctx context.Context, key string) (string, error)
	List(ctx context.Context) (UserConfig, error)
}

type DateFormat string

const (
	DateISOSlash DateFormat = "YYYY/MM/DD"
	DateSASlash  DateFormat = "DD/MM/YYYY"
	DateNASlash  DateFormat = "MM/DD/YYYY"
	DateISODash  DateFormat = "YYYY-MM-DD"
	DateSADash   DateFormat = "DD-MM-YYYY"
	DateNADash   DateFormat = "MM-DD-YYYY"
)

var validKeys = map[Key]struct{}{
	KeyDollarSource: {},
	KeyUsername:     {},
	KeyTimezone:     {},
	KeyDateFormat:   {},
	KeyDefaultRate:  {},
	KeyTheme:        {},
}

func ValidateKey(k string) error {
	key := Key(k)
	if _, ok := validKeys[key]; !ok {
		return ErrInvalidKey
	}
	return nil
}

func (c *UserConfig) Apply(k string, v string) error {
	key := Key(k)
	switch key {
	case KeyDollarSource:
		c.DollarSource = v

	case KeyUsername:
		c.Username = v

	case KeyTimezone:
		c.Timezone = v

	case KeyDateFormat:
		c.DateFormat = DateFormat(v)

	case KeyDefaultRate:
		_, err := strconv.Atoi(v)
		if err != nil {
			return err
		}
		c.DefaultRate = v

	case KeyTheme:
		c.Theme = v
	}
	return nil
}
