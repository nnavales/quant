package networth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/nnavales/summit/api/apperrors"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/money"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound     = apperrors.ErrNotFound
	ErrInvalidField = apperrors.ErrInvalidInput
	ErrDuplicate    = apperrors.ErrDuplicate
)

var _ = errors.New

type AssetType string

const (
	AssetLiquid   AssetType = "liquid"
	AssetPhysical AssetType = "physical"
)

type NetWorth struct {
	TotalUSD    money.Money `json:"total_usd"`
	LiquidUSD   money.Money `json:"liquid_usd"`
	PhysicalUSD money.Money `json:"physical_usd"`
	Assets      []Asset     `json:"assets"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

type Asset struct {
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Amount    money.Money      `json:"amount"`
	Currency  entries.Currency `json:"currency"`
	Type      AssetType        `json:"type"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt *time.Time       `json:"updated_at,omitempty"`
}

func NewAsset(clock timeutils.Clock, name string, amount money.Money, currency entries.Currency, t AssetType) *Asset {
	now := clock.Now()
	return &Asset{
		ID:        ulid.Make().String(),
		Name:      name,
		Amount:    amount,
		Currency:  currency,
		Type:      t,
		CreatedAt: now,
	}
}

type Repository interface {
	Get(ctx context.Context, ID string) (*Asset, error)
	List(ctx context.Context) ([]Asset, error)
	Create(ctx context.Context, a Asset) (*Asset, error)
	Update(ctx context.Context, a Asset) (*Asset, error)
	Delete(ctx context.Context, ID string) error
	BulkCreateAssets(ctx context.Context, assets []Asset) error
}

func calcuateNetWorth(clock timeutils.Clock, assets []Asset, rate float64) *NetWorth {
	var totalUSD, liquidUSD, physicalUSD money.Money
	for _, a := range assets {
		switch a.Type {

		case AssetLiquid:
			if a.Currency == entries.CurrencyARS {
				a.Amount = a.Amount.Div(int64(rate))
			}
			liquidUSD = liquidUSD.Add(a.Amount)

		case AssetPhysical:
			if a.Currency == entries.CurrencyARS {
				a.Amount = a.Amount.Div(int64(rate))
			}
			physicalUSD = physicalUSD.Add(a.Amount)
		}

		totalUSD = totalUSD.Add(a.Amount)
	}

	return &NetWorth{
		TotalUSD:    totalUSD,
		LiquidUSD:   liquidUSD,
		PhysicalUSD: physicalUSD,
		UpdatedAt:   clock.Now(),
	}
}

func (a Asset) Validate() error {
	if strings.TrimSpace(a.Name) == "" {
		return ErrInvalidField
	}

	if a.Currency != entries.CurrencyARS && a.Currency != entries.CurrencyUSD {
		return ErrInvalidField
	}

	if a.Type != AssetLiquid && a.Type != AssetPhysical {
		return ErrInvalidField
	}

	return nil
}

type assetReq struct {
	Name     *string           `json:"name"`
	Amount   *money.Money      `json:"amount"`
	Currency *entries.Currency `json:"currency"`
	Type     *AssetType        `json:"type"`
}
