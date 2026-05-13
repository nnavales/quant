package planning

import (
	"context"
	"fmt"
	"time"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
	"github.com/oklog/ulid/v2"
)

var ErrInvalidField = apperrors.ErrInvalidInput
var ErrNotFound = apperrors.ErrNotFound

type PlanningInput struct {
	ID          string                       `json:"id"`
	Month       timeutils.YearMonth          `json:"month"`
	Description string                       `json:"description,omitempty"`
	Type        transactions.TransactionType `json:"type"`
	Amount      money.Money                  `json:"amount"`
	Currency    entries.Currency             `json:"currency"`
	CreatedAt   time.Time                    `json:"created_at"`
	UpdatedAt   *time.Time                   `json:"updated_at"`
}

func NewPlanningInput(
	clock timeutils.Clock,
	month timeutils.YearMonth,
	concept string,
	currency entries.Currency,
	inputType transactions.TransactionType,
	amount money.Money) (*PlanningInput, error) {

	id := ulid.Make().String()

	i := &PlanningInput{
		ID:          id,
		Month:       month,
		Description: concept,
		Type:        inputType,
		Amount:      amount,
		Currency:    currency,
		CreatedAt:   clock.Now(),
	}

	if err := i.Validate(); err != nil {
		return nil, err
	}

	return i, nil
}

func (i *PlanningInput) Validate() error {
	if i.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if i.Type == "" {
		return fmt.Errorf("type is required: %w", ErrInvalidField)
	}

	if len(i.Description) > 50 {
		return fmt.Errorf("description is too long (max 50 chars): %w", ErrInvalidField)
	}

	if i.Month.IsZero() {
		return fmt.Errorf("month is required: %w", ErrInvalidField)
	}

	if i.Amount == 0 {
		return fmt.Errorf("amount is required: %w", ErrInvalidField)
	}
	if i.Amount < 0 {
		return fmt.Errorf("amount is less than 0: %w", ErrInvalidField)
	}
	if i.Currency == "" {
		return fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	return nil
}

type Repository interface {
	GetInput(ctx context.Context, ID string) (*PlanningInput, error)
	ListInputs(ctx context.Context) ([]PlanningInput, error)
	ListInputsByYear(ctx context.Context, year string) ([]PlanningInput, error)
	CreateInput(ctx context.Context, i PlanningInput) (*PlanningInput, error)
	UpdateInput(ctx context.Context, i PlanningInput, now time.Time) (*PlanningInput, error)
	DeleteInput(ctx context.Context, id string) error

	GetRateByDate(ctx context.Context, date timeutils.YearMonth) (*ExchangeRateInput, error)
	ListRatesByYear(ctx context.Context, year string) ([]ExchangeRateInput, error)
	CreateRate(ctx context.Context, i ExchangeRateInput) (*ExchangeRateInput, error)
	UpdateRate(ctx context.Context, i ExchangeRateInput, now time.Time) (*ExchangeRateInput, error)
	DeleteRate(ctx context.Context, date timeutils.YearMonth) error
}

type PlanningYear struct {
	Year   int                 `json:"year"`
	Inputs []PlanningInput     `json:"inputs"`
	Rates  []ExchangeRateInput `json:"rates"`
	Months []PlanningMonth     `json:"months"`
	Totals PlanningTotals      `json:"totals"`
}

type PlanningMonth struct {
	Month      int         `json:"month"`
	IncomeARS  money.Money `json:"income_ars"`
	ExpenseARS money.Money `json:"expense_ars"`
	SavingsARS money.Money `json:"savings_ars"`
	IncomeUSD  money.Money `json:"income_usd"`
	ExpenseUSD money.Money `json:"expense_usd"`
	SavingsUSD money.Money `json:"savings_usd"`
}

type PlanningTotals struct {
	IncomeARS  money.Money `json:"income_ars"`
	ExpenseARS money.Money `json:"expense_ars"`
	SavingsARS money.Money `json:"savings_ars"`
	IncomeUSD  money.Money `json:"income_usd"`
	ExpenseUSD money.Money `json:"expense_usd"`
	SavingsUSD money.Money `json:"savings_usd"`
}

// helper para calcular planning year desde input

type PlanningReq struct {
	ID          *string                       `json:"id"`
	Month       *timeutils.YearMonth          `json:"month"`
	Description *string                       `json:"description"`
	Type        *transactions.TransactionType `json:"type"`
	Amount      *money.Money                  `json:"amount"`
	Currency    *entries.Currency             `json:"currency"`
}

type ExchangeRateInput struct {
	Month     timeutils.YearMonth `json:"month"`
	Rate      float64             `json:"exchange_rate"`
	UpdatedAt *time.Time          `json:"updated_at"`
}

func NewExchangeRateInput(month timeutils.YearMonth, rate float64) (*ExchangeRateInput, error) {
	r := &ExchangeRateInput{
		Month: month,
		Rate:  rate,
	}

	if err := r.Validate(); err != nil {
		return nil, err
	}

	return r, nil
}

func (r *ExchangeRateInput) Validate() error {
	if r.Month.IsZero() {
		return fmt.Errorf("month is required: %w", ErrInvalidField)
	}

	if r.Rate <= 0 {
		return fmt.Errorf("rate cannot be a value less or equal to zero, %w", ErrInvalidField)
	}

	return nil
}

type ExchangeRateReq struct {
	Month *timeutils.YearMonth `json:"month"`
	Rate  *float64             `json:"exchange_rate"`
}
