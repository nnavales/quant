package users

import "context"

type Config map[string]any

const (
	KeyDollarSource = "dollar_source"
	KeyUsername     = "username"
	KeyTimezone     = "timezone"
	KeyDateFormat   = "date_format"
	KeyDefaultRate  = "default_rate"
	KeyAccentColor  = "accent_color"
)

type DateFormat string

const (
	DateISOSlash DateFormat = "YYYY/MM/DD"
	DateSASlash  DateFormat = "DD/MM/YYYY"
	DateNASlash  DateFormat = "MM/DD/YYYY"
	DateISODash  DateFormat = "YYYY-MM-DD"
	DateSADash   DateFormat = "DD-MM-YYYY"
	DateNADash   DateFormat = "MM-DD-YYYY"
)

var cfg = map[string]any{
	KeyDollarSource: "banco-nacion",
	KeyUsername:     "",
	KeyTimezone:     "America/Argentina/Buenos_Aires",
	KeyDateFormat:   DateSASlash,
	KeyDefaultRate:  "1400",
	KeyAccentColor:  "blue",
}

func NewConfig() Config {
	return make(Config)
}

type Repository interface {
	UpdateTx(ctx context.Context, updates map[string]any) error
	Get(ctx context.Context, key string) (any, error)
	List(ctx context.Context) (Config, error)
}
