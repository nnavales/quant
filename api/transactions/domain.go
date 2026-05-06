package transactions

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound     = apperrors.ErrNotFound
	ErrInvalidField = apperrors.ErrInvalidInput
)

var _ = errors.New // keep errors import for Validate

type TransactionType string

const TypeIncome TransactionType = "income"
const TypeExpense TransactionType = "expense"

type TransactionFrequency string

const FrequencyFixed TransactionFrequency = "fixed"
const FrequencyVariable TransactionFrequency = "variable"

// Domain definitions
type Transaction struct {
	ID                 string                `json:"id"`
	Date               timeutils.Date        `json:"date"`
	Description        *string               `json:"description"`
	Type               TransactionType       `json:"type"`
	Frequency          *TransactionFrequency `json:"frequency"`
	InstallmentGroupID *string               `json:"installment_group_id"`
	InstallmentNumber  *int                  `json:"installment_number"`
	IsPaid             bool                  `json:"is_paid"`
	CreatedAt          time.Time             `json:"created_at"`
	UpdatedAt          *time.Time            `json:"updated_at"`
	DeletedAt          *time.Time            `json:"deleted_at,omitempty"`
}

// Repository
type Repository interface {
	GetTransactionByID(ctx context.Context, id string) (*Transaction, error)
	ListTransactions(ctx context.Context) ([]Transaction, error)
	UpdateTransaction(ctx context.Context, t Transaction) (*Transaction, error)
	DeleteTransaction(ctx context.Context, id string) error
	GetMinTransactionDate(ctx context.Context) (*timeutils.Date, error)
}

// CTOs
type TransactionReq struct {
	ID                 *string               `json:"id"`
	Date               *timeutils.Date       `json:"date"`
	Description        *string               `json:"description"`
	Type               *TransactionType      `json:"type"`
	IsPaid             *bool                 `json:"is_paid"`
	Frequency          *TransactionFrequency `json:"frequency"`
	InstallmentGroupID *string               `json:"installment_group_id"`
	InstallmentNumber  *int                  `json:"installment_number"`
	CreatedAt          *time.Time            `json:"created_at"`
	IsDeleted          *bool                 `json:"is_deleted"`
}

type TransactionIsPaidReq struct {
	IsPaid bool `json:"is_paid"`
}

// Constructors
func NewTransaction(now time.Time, date timeutils.Date, tType TransactionType) *Transaction {
	id := ulid.Make().String()
	return &Transaction{
		ID:        id,
		Date:      date,
		Type:      tType,
		IsPaid:    false,
		CreatedAt: now,
	}
}

// Setters
func (t *Transaction) SetDescription(desc string) {
	t.Description = &desc
}

func (e *Transaction) SetIsPaid(b bool) {
	e.IsPaid = b
}

func (t *Transaction) SetFrequency(freq TransactionFrequency) {
	t.Frequency = &freq
}

func (t *Transaction) SetInstallmentGroupID(id string) {
	t.InstallmentGroupID = &id
}

func (t *Transaction) SetInstallmentNumber(n int) {
	t.InstallmentNumber = &n
}

func (t *Transaction) Touch(now time.Time) {
	t.UpdatedAt = &now
}

func (t *Transaction) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		t.DeletedAt = &now
	} else {
		t.DeletedAt = nil
	}
}

// Validations
func (t *Transaction) Validate() error {
	if t.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if t.Date.IsZero() {
		return fmt.Errorf("date is required: %w", ErrInvalidField)
	}
	if t.Type != TypeIncome && t.Type != TypeExpense {
		return fmt.Errorf("type is invalid: %w", ErrInvalidField)
	}
	if t.Frequency != nil && *t.Frequency != FrequencyFixed && *t.Frequency != FrequencyVariable {
		return fmt.Errorf("frequency is invalid: %w", ErrInvalidField)
	}
	if t.InstallmentNumber != nil && t.InstallmentGroupID == nil {
		return fmt.Errorf("installment_number requires installment_group_id: %w", ErrInvalidField)
	}
	if t.InstallmentGroupID != nil && t.InstallmentNumber == nil {
		return fmt.Errorf("installment_group_id requires installment_number: %w", ErrInvalidField)
	}
	if t.Description != nil && (*t.Description == "" || len(*t.Description) > 200) {
		return fmt.Errorf("description is invalid: %w", ErrInvalidField)
	}

	return nil
}
