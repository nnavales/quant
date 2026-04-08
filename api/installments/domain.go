package installments

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound = errors.New("resource not found")
)

type InstallmentGroup struct {
	ID                string           `json:"id"`
	TotalInstallments int              `json:"total_installments"`
	Description       string           `json:"description"`
	OriginalAmount    int64            `json:"original_amount"`
	Currency          entries.Currency `json:"currency"`
	StartDate         timeutils.Date   `json:"start_date"`
	IsCanceled        bool             `json:"is_canceled"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         *time.Time       `json:"updated_at"`
	DeletedAt         *time.Time       `json:"deleted_at,omitempty"`
}

type Repository interface {
	GetInstallmentGroupByID(ctx context.Context, id string) (*InstallmentGroup, error)
	ListInstallmentGroups(ctx context.Context) ([]InstallmentGroup, error)
	UpdateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error)
	DeleteInstallmentGroup(ctx context.Context, id string) error
}

type InstallmentGroupReq struct {
	ID                *string           `json:"id"`
	TotalInstallments *int              `json:"total_installments"`
	StartDate         *timeutils.Date   `json:"start_date"`
	IsDeleted         *bool             `json:"is_deleted"`
	Description       *string           `json:"description"`
	OriginalAmount    *int64            `json:"original_amount"`
	IsCanceled        *bool             `json:"is_canceled"`
	Currency          *entries.Currency `json:"currency"`
}

func NewInstallmentGroup(now time.Time, totalInstallments int, desc string, currency entries.Currency, amount int64, startDate timeutils.Date) *InstallmentGroup {
	id := ulid.Make().String()
	return &InstallmentGroup{
		ID:                id,
		TotalInstallments: totalInstallments,
		Description:       desc,
		OriginalAmount:    amount,
		Currency:          currency,
		StartDate:         startDate,
		IsCanceled:        false,
		CreatedAt:         now,
	}
}

func (ig *InstallmentGroup) Touch(now time.Time) {
	ig.UpdatedAt = &now
}

func (ig *InstallmentGroup) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		ig.DeletedAt = &now
	} else {
		ig.DeletedAt = nil
	}
}

func (ig *InstallmentGroup) SetDescription(desc string) {
	ig.Description = desc
}

func (ig *InstallmentGroup) SetOriginalAmount(originalAmount int64) {
	ig.OriginalAmount = originalAmount
}

func (ig *InstallmentGroup) SetCurrency(currency entries.Currency) {
	ig.Currency = currency
}

func (ig *InstallmentGroup) SetIsCanceled(isCanceled bool) {
	ig.IsCanceled = isCanceled
}

var ErrInvalidField = errors.New("invalid field")

func (ig *InstallmentGroup) Validate() error {
	if ig.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if ig.TotalInstallments <= 0 || ig.TotalInstallments > 120 {
		return fmt.Errorf("total_installments is invalid: %w", ErrInvalidField)
	}
	if ig.StartDate.IsZero() {
		return fmt.Errorf("start_date is required: %w", ErrInvalidField)
	}

	return nil
}
