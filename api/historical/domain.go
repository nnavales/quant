package historical

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
)

var (
	ErrInvalidField = apperrors.ErrInvalidInput
	ErrNotFound     = apperrors.ErrNotFound
	ErrDuplicate    = apperrors.ErrDuplicate
)

var _ = errors.New

type HistoricalEntry struct {
	Date         timeutils.Date `json:"date"`
	ExchangeRate float64        `json:"exchange_rate"`

	IncomeUSD         money.Money `json:"income_usd"`
	IncomeFixedUSD    money.Money `json:"income_fixed_usd"`
	IncomeVariableUSD money.Money `json:"income_variable_usd"`

	ExpenseUSD         money.Money `json:"expense_usd"`
	ExpenseFixedUSD    money.Money `json:"expense_fixed_usd"`
	ExpenseVariableUSD money.Money `json:"expense_variable_usd"`

	SavingsUSD money.Money `json:"savings_usd"`

	CreatedAt time.Time `json:"created_at"`
}

func NewHistoricalFinance(
	clock timeutils.Clock,
	date timeutils.Date,
	exchangeRate float64,
	income, incomeFixed, incomeVariable, expense, expenseFixed, expenseVariable money.Money,
) (*HistoricalEntry, error) {
	h := &HistoricalEntry{
		Date:               date,
		ExchangeRate:       exchangeRate,
		IncomeUSD:          income,
		IncomeFixedUSD:     incomeFixed,
		IncomeVariableUSD:  incomeVariable,
		ExpenseUSD:         expense,
		ExpenseFixedUSD:    expenseFixed,
		ExpenseVariableUSD: expenseVariable,
		CreatedAt:          clock.Now(),
	}

	h.Normalize()

	if err := h.Validate(); err != nil {
		return nil, err
	}

	return h, nil
}

type HistoricalFinanceReq struct {
	Date         *timeutils.Date `json:"date"`
	ExchangeRate *float64        `json:"exchange_rate"`

	IncomeUSD         *string `json:"income_usd"`
	IncomeFixedUSD    *string `json:"income_fixed_usd"`
	IncomeVariableUSD *string `json:"income_variable_usd"`

	ExpenseUSD         *string `json:"expense_usd"`
	ExpenseFixedUSD    *string `json:"expense_fixed_usd"`
	ExpenseVariableUSD *string `json:"expense_variable_usd"`
}

type BulkCreateReq struct {
	Data []HistoricalFinanceReq `json:"data"`
}

func (req HistoricalFinanceReq) ToEntry(clock timeutils.Clock) (*HistoricalEntry, error) {
	income, err := money.ParseAmountToCents(*req.IncomeUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse income_usd: %w", err)
	}

	incomeFixed, err := money.ParseAmountToCents(*req.IncomeFixedUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse income_fixed_usd: %w", err)
	}

	incomeVariable, err := money.ParseAmountToCents(*req.IncomeVariableUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse income_variable_usd: %w", err)
	}

	expense, err := money.ParseAmountToCents(*req.ExpenseUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse expense_usd: %w", err)
	}

	expenseFixed, err := money.ParseAmountToCents(*req.ExpenseFixedUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse expense_fixed_usd: %w", err)
	}

	expenseVariable, err := money.ParseAmountToCents(*req.ExpenseVariableUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse expense_variable_usd: %w", err)
	}

	exchangeRate := 1.0
	if req.ExchangeRate != nil && *req.ExchangeRate > 0 {
		exchangeRate = *req.ExchangeRate
	}

	return NewHistoricalFinance(
		clock,
		*req.Date,
		exchangeRate,
		money.Money(income),
		money.Money(incomeFixed),
		money.Money(incomeVariable),
		money.Money(expense),
		money.Money(expenseFixed),
		money.Money(expenseVariable),
	)
}

func (h HistoricalEntry) Validate() error {
	if h.Date.IsZero() {
		return fmt.Errorf("%w: date is required", ErrInvalidField)
	}

	if h.ExchangeRate <= 0 {
		return fmt.Errorf("%w: exchange_rate must be > 0", ErrInvalidField)
	}

	if h.IncomeUSD < 0 {
		return fmt.Errorf("%w: income_usd cannot be negative", ErrInvalidField)
	}

	if h.ExpenseUSD < 0 {
		return fmt.Errorf("%w: expense_usd cannot be negative", ErrInvalidField)
	}

	if h.IncomeFixedUSD < 0 || h.IncomeVariableUSD < 0 {
		return fmt.Errorf("%w: income breakdown cannot be negative", ErrInvalidField)
	}

	if h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD && h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD-1 && h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD+1 && h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD-2 && h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD+2 && h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD-3 && h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD+3 {
		return fmt.Errorf("%w: income breakdown mismatch", ErrInvalidField)
	}

	if h.ExpenseFixedUSD < 0 || h.ExpenseVariableUSD < 0 {
		return fmt.Errorf("%w: expense breakdown cannot be negative", ErrInvalidField)
	}

	if h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD && h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD-1 && h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD+1 && h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD-2 && h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD+2 && h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD-3 && h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD+3 {
		return fmt.Errorf("%w: expense breakdown mismatch", ErrInvalidField)
	}

	return nil
}

type Repository interface {
	CreateHistoricalEntry(ctx context.Context, h HistoricalEntry) (*HistoricalEntry, error)
	UpdateHistoricalEntry(ctx context.Context, h HistoricalEntry) (*HistoricalEntry, error)
	ListHistoricalEntries(ctx context.Context, h HistoricalEntry) ([]*HistoricalEntry, error)
	GetHistoricalEntryByDate(ctx context.Context, date timeutils.Date) (*HistoricalEntry, error)
	DeleteHistoricalEntry(ctx context.Context, h HistoricalEntry) error

	BulkCreateHistoricalEntries(ctx context.Context, histEntries []HistoricalEntry) error
	GetCutOff(ctx context.Context) (*timeutils.Date, error)
}

func (h HistoricalEntry) CalculatedSavings() money.Money {
	return h.IncomeUSD.Sub(h.ExpenseUSD)
}

func (h *HistoricalEntry) Normalize() {
	h.SavingsUSD = h.CalculatedSavings()

	if h.IncomeFixedUSD == 0 && h.IncomeVariableUSD == 0 {
		h.IncomeVariableUSD = h.IncomeUSD
	}

	if h.ExpenseFixedUSD == 0 && h.ExpenseVariableUSD == 0 {
		h.ExpenseVariableUSD = h.ExpenseUSD
	}
}

func (h *HistoricalEntry) ApplyUpdate(req HistoricalFinanceReq) error {
	if req.Date != nil {
		h.Date = *req.Date
	}

	if req.ExchangeRate != nil {
		h.ExchangeRate = *req.ExchangeRate
	}

	if req.IncomeUSD != nil {
		parsed, err := money.ParseAmountToCents(*req.IncomeUSD)
		if err != nil {
			return fmt.Errorf("failed to parse income_usd: %w", err)
		}
		h.IncomeUSD = money.Money(parsed)
	}

	if req.IncomeFixedUSD != nil {
		parsed, err := money.ParseAmountToCents(*req.IncomeFixedUSD)
		if err != nil {
			return fmt.Errorf("failed to parse income_fixed_usd: %w", err)
		}
		h.IncomeFixedUSD = money.Money(parsed)
	}

	if req.IncomeVariableUSD != nil {
		parsed, err := money.ParseAmountToCents(*req.IncomeVariableUSD)
		if err != nil {
			return fmt.Errorf("failed to parse income_variable_usd: %w", err)
		}
		h.IncomeVariableUSD = money.Money(parsed)
	}

	if req.ExpenseUSD != nil {
		parsed, err := money.ParseAmountToCents(*req.ExpenseUSD)
		if err != nil {
			return fmt.Errorf("failed to parse expense_usd: %w", err)
		}
		h.ExpenseUSD = money.Money(parsed)
	}

	if req.ExpenseFixedUSD != nil {
		parsed, err := money.ParseAmountToCents(*req.ExpenseFixedUSD)
		if err != nil {
			return fmt.Errorf("failed to parse expense_fixed_usd: %w", err)
		}
		h.ExpenseFixedUSD = money.Money(parsed)
	}

	if req.ExpenseVariableUSD != nil {
		parsed, err := money.ParseAmountToCents(*req.ExpenseVariableUSD)
		if err != nil {
			return fmt.Errorf("failed to parse expense_variable_usd: %w", err)
		}
		h.ExpenseVariableUSD = money.Money(parsed)
	}

	h.Normalize()

	return h.Validate()
}
