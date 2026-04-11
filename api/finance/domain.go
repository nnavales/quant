package finance

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/nnavales/summit/api/transactions"
)

var (
	ErrNotFound = errors.New("resource not found")
)

// Repository
type Repository interface {
	CreateTransactionAggregate(ctx context.Context, agg TransactionAggregate) error
	ListTransactionsAggregate(ctx context.Context, filter *Filter) (*TransactionListResponse, error)
	GetTransactionAggregate(ctx context.Context, id string) (*TransactionRowDTO, error)
	DeleteTransactionAggregate(ctx context.Context, id string) error
	UpdateTransactionAggregate(ctx context.Context, id string, agg TransactionAggregate) error
	GetTransactionsByInstallmentGroup(ctx context.Context, groupID string, fromInstallment int) ([]TransactionRowDTO, error)
	CancelInstallments(ctx context.Context, groupID string, fromInstallment int, now time.Time) error
	DeleteTransactionsByInstallmentGroup(ctx context.Context, groupID string, fromInstallment int) error
	ListHistoricalEntries(ctx context.Context, filter *Filter) (*HistoricalListResponse, error)
}

type HistoricalRowDTO struct {
	Month           string  `json:"month"`
	Income          string  `json:"income"`
	IncomeFixed     string  `json:"income_fixed"`
	IncomeVariable  string  `json:"income_variable"`
	Expense         string  `json:"expense"`
	ExpenseFixed    string  `json:"expense_fixed"`
	ExpenseVariable string  `json:"expense_variable"`
	ExchangeRate    float64 `json:"exchange_rate"`
	Savings         string  `json:"savings"`
	Source          string  `json:"source"`
}

// Validations
var ErrInvalidField = errors.New("invalid field")

// Batch
type TransactionAggregateReq struct {
	Description       string                            `json:"description"`
	Date              timeutils.Date                    `json:"date"`
	Type              transactions.TransactionType      `json:"type"`
	Frequency         transactions.TransactionFrequency `json:"frequency"`
	InstallmentNumber *int                              `json:"installment_number"`
	Amount            string                            `json:"amount"`
	Currency          entries.Currency                  `json:"currency"`
	ExchangeRate      float64                           `json:"exchange_rate"`
	CategoryID        string                            `json:"category_id"`
	SubcategoryID     string                            `json:"subcategory_id"`
	ChannelID         string                            `json:"channel_id"`
	AccountID         string                            `json:"account_id"`
	IsPaid            *bool                             `json:"is_paid"`
}

type TransactionAggregate struct {
	Group *installments.InstallmentGroup
	Items []struct {
		Transaction transactions.Transaction
		Entry       entries.Entry
	}
}

type TransactionRowDTO struct {
	ID          string                             `json:"id"`
	Date        timeutils.Date                     `json:"date"`
	Description *string                            `json:"description"`
	Type        transactions.TransactionType       `json:"type"`
	Frequency   *transactions.TransactionFrequency `json:"frequency"`

	EntryID      string           `json:"entry_id"`
	IsPaid       bool             `json:"is_paid"`
	Amount       string           `json:"amount"`
	Currency     entries.Currency `json:"currency"`
	ExchangeRate float64          `json:"exchange_rate"`

	CategoryID   *string `json:"category_id"`
	CategoryName *string `json:"category_name"`

	SubcategoryID   *string `json:"subcategory_id"`
	SubcategoryName *string `json:"subcategory_name"`

	AccountID   *string `json:"account_id"`
	AccountName *string `json:"account_name"`

	ChannelID   string `json:"channel_id"`
	ChannelName string `json:"channel_name"`

	InstallmentNumber    *int            `json:"installment_number"`
	TotalInstallments    *int            `json:"total_installments"`
	InstallmentGroupID   *string         `json:"installment_group_id"`
	InstallmentStartDate *timeutils.Date `json:"installment_start_date"`
	IsCanceled           *bool           `json:"is_canceled"`
	OriginalAmount       *string         `json:"original_amount"`
}

type TransactionListResponse struct {
	Data       []TransactionRowDTO `json:"data"`
	TotalCount int                 `json:"total_count"`
}

type HistoricalListResponse struct {
	Data       []HistoricalRowDTO `json:"data"`
	TotalCount int                `json:"total_count"`
}

// Filters
type Filter struct {
	Limit *int
	Page  *int

	Sort  *string
	Order *string

	Search      *string
	Type        *transactions.TransactionType
	Frequency   *transactions.TransactionFrequency
	Currency    *entries.Currency
	Installment *bool
	Category    *string
	Subcategory *string
	Channel     *string
	Account     *string
	DateFrom    *timeutils.Date
	DateTo      *timeutils.Date
}

type FilterParams map[string]string

var ErrInvalidFilter = errors.New("invalid filter value")

func NewFilter(params FilterParams) (*Filter, error) {
	f := &Filter{}

	if v, ok := params["page"]; ok && v != "" {
		page := 1
		if _, err := fmt.Sscanf(v, "%d", &page); err != nil || page < 1 {
			return nil, fmt.Errorf("invalid page: %w", ErrInvalidFilter)
		}
		f.Page = &page
	}

	if v, ok := params["limit"]; ok && v != "" {
		limit := 20
		if _, err := fmt.Sscanf(v, "%d", &limit); err != nil || limit < 1 || limit > 100 {
			return nil, fmt.Errorf("invalid limit: %w", ErrInvalidFilter)
		}
		f.Limit = &limit
	}

	if v, ok := params["sort"]; ok && v != "" {
		if v != "date" && v != "amount" && v != "created_at" {
			return nil, fmt.Errorf("invalid sort: %w", ErrInvalidFilter)
		}
		f.Sort = &v
	}

	if v, ok := params["order"]; ok && v != "" {
		if v != "asc" && v != "desc" {
			return nil, fmt.Errorf("invalid order: %w", ErrInvalidFilter)
		}
		f.Order = &v
	}

	if v, ok := params["search"]; ok && v != "" {
		f.Search = &v
	}

	if v, ok := params["type"]; ok && v != "" {
		t := transactions.TransactionType(v)
		if t != transactions.TypeIncome && t != transactions.TypeExpense {
			return nil, fmt.Errorf("invalid type: %w", ErrInvalidFilter)
		}
		f.Type = &t
	}

	if v, ok := params["frequency"]; ok && v != "" {
		fr := transactions.TransactionFrequency(v)
		if fr != transactions.FrequencyFixed && fr != transactions.FrequencyVariable {
			return nil, fmt.Errorf("invalid frequency: %w", ErrInvalidFilter)
		}
		f.Frequency = &fr
	}

	if v, ok := params["currency"]; ok && v != "" {
		c := entries.Currency(v)
		if c != entries.CurrencyARS && c != entries.CurrencyUSD {
			return nil, fmt.Errorf("invalid currency: %w", ErrInvalidFilter)
		}
		f.Currency = &c
	}

	if v, ok := params["installment"]; ok && v != "" {
		inst := v == "true"
		f.Installment = &inst
	}

	if v, ok := params["category"]; ok && v != "" {
		f.Category = &v
	}

	if v, ok := params["subcategory"]; ok && v != "" {
		f.Subcategory = &v
	}

	if v, ok := params["channel"]; ok && v != "" {
		f.Channel = &v
	}

	if v, ok := params["account"]; ok && v != "" {
		f.Account = &v
	}

	if v, ok := params["date_from"]; ok && v != "" {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return nil, fmt.Errorf("invalid date_from: %w", ErrInvalidFilter)
		}
		f.DateFrom = &d
	}

	if v, ok := params["date_to"]; ok && v != "" {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return nil, fmt.Errorf("invalid date_to: %w", ErrInvalidFilter)
		}
		f.DateTo = &d
	}

	return f, nil
}

func NewHistoricalFilter(params FilterParams) (*Filter, error) {
	f := &Filter{}
	if v, ok := params["page"]; ok && v != "" {
		page := 1
		if _, err := fmt.Sscanf(v, "%d", &page); err != nil || page < 1 {
			return nil, fmt.Errorf("invalid page: %w", ErrInvalidFilter)
		}
		f.Page = &page
	}

	if v, ok := params["limit"]; ok && v != "" {
		limit := 20
		if _, err := fmt.Sscanf(v, "%d", &limit); err != nil || limit < 1 || limit > 100 {
			return nil, fmt.Errorf("invalid limit: %w", ErrInvalidFilter)
		}
		f.Limit = &limit
	}

	if v, ok := params["sort"]; ok && v != "" {
		if v != "month" && v != "income" && v != "expense" {
			return nil, fmt.Errorf("invalid sort: %w", ErrInvalidFilter)
		}
		f.Sort = &v
	}

	if v, ok := params["order"]; ok && v != "" {
		if v != "asc" && v != "desc" {
			return nil, fmt.Errorf("invalid order: %w", ErrInvalidFilter)
		}
		f.Order = &v
	}

	if v, ok := params["date_from"]; ok && v != "" {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return nil, fmt.Errorf("invalid date_from: %w", ErrInvalidFilter)
		}
		f.DateFrom = &d
	}

	if v, ok := params["date_to"]; ok && v != "" {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return nil, fmt.Errorf("invalid date_to: %w", ErrInvalidFilter)
		}
		f.DateTo = &d
	}

	return f, nil
}

type CancelInstallmentsReq struct {
	InstallmentGroupID string `json:"installment_group_id"`
	FromInstallment    int    `json:"from_installment"`
}
