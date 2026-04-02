package users

import "context"

type Config map[string]any

const (
	KeyDefaultDollarSource = "default_dollar_source"
	KeyDefaultCurrency     = "default_currency"
)

func NewConfig() Config {
	return make(Config)
}

type Repository interface {
	UpdateTx(ctx context.Context, updates map[string]any) error
	Get(ctx context.Context, key string) (any, error)
	List(ctx context.Context) (Config, error)
}
