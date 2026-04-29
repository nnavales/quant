package entries

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/summit/api/apperrors"
	"github.com/nnavales/summit/api/money"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound     = apperrors.ErrNotFound
	ErrInvalidField = apperrors.ErrInvalidInput
)

var _ = errors.New

type Currency string

const CurrencyARS Currency = "ARS"
const CurrencyUSD Currency = "USD"

type Entry struct {
	ID            string      `json:"id"`
	TransactionID string      `json:"transaction_id"`
	ChannelID     string      `json:"channel_id"`
	AccountID     *string     `json:"account_id"`
	Amount        money.Money `json:"amount"`
	Currency      Currency    `json:"currency"`
	ExchangeRate  float64     `json:"exchange_rate"`
	CategoryID    *string     `json:"category_id"`
	SubcategoryID *string     `json:"subcategory_id"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     *time.Time  `json:"updated_at"`
	DeletedAt     *time.Time  `json:"deleted_at,omitempty"`
}

// Repository
type Repository interface {
	GetEntryByID(ctx context.Context, id string) (*Entry, error)
	ListEntries(ctx context.Context) ([]Entry, error)
	UpdateEntry(ctx context.Context, e Entry) (*Entry, error)
	DeleteEntry(ctx context.Context, id string) error
}

// CTOs
type EntryReq struct {
	ID            *string   `json:"id"`
	TransactionID *string   `json:"transaction_id"`
	ChannelID     *string   `json:"channelID"`
	AccountID     *string   `json:"account_id"`
	Amount        *string   `json:"amount"`
	Currency      *Currency `json:"currency"`
	ExchangeRate  *float64  `json:"exchange_rate"`
	CategoryID    *string   `json:"category_id"`
	SubcategoryID *string   `json:"subcategory_id"`
	IsDeleted     *bool     `json:"is_deleted"`
}

// Constructors
func NewEntry(now time.Time, transactionID, channelID string, amount money.Money, currency Currency, exchangeRate float64) *Entry {
	id := ulid.Make().String()
	return &Entry{
		ID:            id,
		TransactionID: transactionID,
		ChannelID:     channelID,
		Amount:        amount,
		Currency:      currency,
		ExchangeRate:  exchangeRate,
		CreatedAt:     now,
	}
}

// Setters
func (e *Entry) SetAccountID(id string) {
	e.AccountID = &id
}

func (e *Entry) SetCategoryID(id string) {
	e.CategoryID = &id
}

func (e *Entry) SetSubcategoryID(id string) {
	e.SubcategoryID = &id
}

func (e *Entry) Touch(now time.Time) {
	e.UpdatedAt = &now
}

func (e *Entry) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		e.DeletedAt = &now
	} else {
		e.DeletedAt = nil
	}
}

// Validations
func (e *Entry) Validate() error {
	if e.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if e.TransactionID == "" {
		return fmt.Errorf("transaction_id is required: %w", ErrInvalidField)
	}
	if e.ChannelID == "" {
		return fmt.Errorf("channel_id is required: %w", ErrInvalidField)
	}
	if e.AccountID != nil && *e.AccountID == "" {
		return fmt.Errorf("account_id is required: %w", ErrInvalidField)
	}
	if e.Amount == 0 {
		return fmt.Errorf("amount is required: %w", ErrInvalidField)
	}
	if e.Amount < 0 {
		return fmt.Errorf("amount is less than 0: %w", ErrInvalidField)
	}
	if e.Currency == "" {
		return fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	if e.ExchangeRate <= 0 {
		return fmt.Errorf("exchange_rate must be positive: %w", ErrInvalidField)
	}

	return nil
}
