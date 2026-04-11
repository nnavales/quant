package historical

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/timeutils"
)

var (
	ErrInvalidField = errors.New("invalid field")
	ErrNotFound     = errors.New("resource not found")
	ErrDuplicate    = errors.New("resource already exists")
)

type HistoricalEntry struct {
	Date         timeutils.Date `json:"date"`
	ExchangeRate float64        `json:"exchange_rate"`

	IncomeUSD         int64 `json:"income_usd"`
	IncomeFixedUSD    int64 `json:"income_fixed_usd"`
	IncomeVariableUSD int64 `json:"income_variable_usd"`

	ExpenseUSD         int64 `json:"expense_usd"`
	ExpenseFixedUSD    int64 `json:"expense_fixed_usd"`
	ExpenseVariableUSD int64 `json:"expense_variable_usd"`

	SavingsUSD int64 `json:"savings_usd"`

	CreatedAt time.Time `json:"created_at"`
}

func NewHistoricalFinance(
	clock timeutils.Clock,
	date timeutils.Date,
	exchangeRate float64,
	income, incomeFixed, incomeVariable, expense, expenseFixed, expenseVariable int64,
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

	SavingsUSD *string `json:"savings_usd"`
}

type BulkCreateReq struct {
	Data []HistoricalFinanceReq `json:"data"`
}

func (req HistoricalFinanceReq) ToEntry(clock timeutils.Clock) (*HistoricalEntry, error) {
	income, err := entries.ParseAmountToCents(*req.IncomeUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse income_usd: %w", err)
	}

	incomeFixed, err := entries.ParseAmountToCents(*req.IncomeFixedUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse income_fixed_usd: %w", err)
	}

	incomeVariable, err := entries.ParseAmountToCents(*req.IncomeVariableUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse income_variable_usd: %w", err)
	}

	expense, err := entries.ParseAmountToCents(*req.ExpenseUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse expense_usd: %w", err)
	}

	expenseFixed, err := entries.ParseAmountToCents(*req.ExpenseFixedUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse expense_fixed_usd: %w", err)
	}

	expenseVariable, err := entries.ParseAmountToCents(*req.ExpenseVariableUSD)
	if err != nil {
		return nil, fmt.Errorf("failed to parse expense_variable_usd: %w", err)
	}

	return NewHistoricalFinance(
		clock,
		*req.Date,
		*req.ExchangeRate,
		income,
		incomeFixed,
		incomeVariable,
		expense,
		expenseFixed,
		expenseVariable,
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

	if h.IncomeFixedUSD+h.IncomeVariableUSD != h.IncomeUSD {
		return fmt.Errorf("%w: income breakdown mismatch", ErrInvalidField)
	}

	if h.ExpenseFixedUSD < 0 || h.ExpenseVariableUSD < 0 {
		return fmt.Errorf("%w: expense breakdown cannot be negative", ErrInvalidField)
	}

	if h.ExpenseFixedUSD+h.ExpenseVariableUSD != h.ExpenseUSD {
		return fmt.Errorf("%w: expense breakdown mismatch", ErrInvalidField)
	}

	if h.SavingsUSD != h.CalculatedSavings() {
		return fmt.Errorf("%w: savings mismatch", ErrInvalidField)
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

func (h HistoricalEntry) CalculatedSavings() int64 {
	return h.IncomeUSD - h.ExpenseUSD
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
		parsed, err := entries.ParseAmountToCents(*req.IncomeUSD)
		if err != nil {
			return fmt.Errorf("failed to parse income_usd: %w", err)
		}
		h.IncomeUSD = parsed
	}

	if req.IncomeFixedUSD != nil {
		parsed, err := entries.ParseAmountToCents(*req.IncomeFixedUSD)
		if err != nil {
			return fmt.Errorf("failed to parse income_fixed_usd: %w", err)
		}
		h.IncomeFixedUSD = parsed
	}

	if req.IncomeVariableUSD != nil {
		parsed, err := entries.ParseAmountToCents(*req.IncomeVariableUSD)
		if err != nil {
			return fmt.Errorf("failed to parse income_variable_usd: %w", err)
		}
		h.IncomeVariableUSD = parsed
	}

	if req.ExpenseUSD != nil {
		parsed, err := entries.ParseAmountToCents(*req.ExpenseUSD)
		if err != nil {
			return fmt.Errorf("failed to parse expense_usd: %w", err)
		}
		h.ExpenseUSD = parsed
	}

	if req.ExpenseFixedUSD != nil {
		parsed, err := entries.ParseAmountToCents(*req.ExpenseFixedUSD)
		if err != nil {
			return fmt.Errorf("failed to parse expense_fixed_usd: %w", err)
		}
		h.ExpenseFixedUSD = parsed
	}

	if req.ExpenseVariableUSD != nil {
		parsed, err := entries.ParseAmountToCents(*req.ExpenseVariableUSD)
		if err != nil {
			return fmt.Errorf("failed to parse expense_variable_usd: %w", err)
		}
		h.ExpenseVariableUSD = parsed
	}

	if req.SavingsUSD != nil {
		parsed, err := entries.ParseAmountToCents(*req.SavingsUSD)
		if err != nil {
			return fmt.Errorf("failed to parse savings_usd: %w", err)
		}
		h.SavingsUSD = parsed
	}

	h.Normalize()

	return h.Validate()
}
