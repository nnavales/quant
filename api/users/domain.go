package users

import "context"

type Config map[string]any

const (
	KeyDollarSource = "dollar_source"
	KeyCurrency     = "currency"
	KeyUsername     = "username"
	KeyTimezone     = "timezone"
)

var cfg = map[string]any{
	KeyCurrency:     "ars",
	KeyDollarSource: "banco-nacion",
	KeyUsername:     "",
	KeyTimezone:     "arg",
}

func NewConfig() Config {
	return make(Config)
}

type Repository interface {
	UpdateTx(ctx context.Context, updates map[string]any) error
	Get(ctx context.Context, key string) (any, error)
	List(ctx context.Context) (Config, error)
}
