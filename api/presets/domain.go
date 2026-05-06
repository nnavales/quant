package presets

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound     = apperrors.ErrNotFound
	ErrDuplicate    = apperrors.ErrDuplicate
	ErrInvalidField = apperrors.ErrInvalidInput
)

var _ = errors.New

type Preset struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Description   *string    `json:"description"`
	Type          string     `json:"type"`
	Frequency     *string    `json:"frequency"`
	CategoryID    *string    `json:"category_id"`
	SubcategoryID *string    `json:"subcategory_id"`
	ChannelID     *string    `json:"channel_id"`
	AccountID     *string    `json:"account_id"`
	IsPaid        *bool      `json:"is_paid"`
	Currency      *string    `json:"currency"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

type Filter struct {
	Deleted bool
}

type Repository interface {
	CreatePreset(ctx context.Context, p Preset) (*Preset, error)
	GetPresetByID(ctx context.Context, id string) (*Preset, error)
	GetPresetByName(ctx context.Context, name string) (*Preset, error)
	ListPresets(ctx context.Context, filter Filter) ([]Preset, error)
	UpdatePreset(ctx context.Context, p Preset) (*Preset, error)
	DeletePreset(ctx context.Context, id string, now time.Time) error
	RestorePreset(ctx context.Context, id string) error
}

type PresetReq struct {
	ID            *string `json:"id"`
	Name          *string `json:"name"`
	Description   *string `json:"description"`
	Type          *string `json:"type"`
	Frequency     *string `json:"frequency"`
	CategoryID    *string `json:"category_id"`
	SubcategoryID *string `json:"subcategory_id"`
	ChannelID     *string `json:"channel_id"`
	AccountID     *string `json:"account_id"`
	IsPaid        *bool   `json:"is_paid"`
	Currency      *string `json:"currency"`
	IsDeleted     *bool   `json:"is_deleted"`
}

func NewPreset(now time.Time, name, presetType string) *Preset {
	id := ulid.Make().String()
	return &Preset{
		ID:        id,
		Name:      name,
		Type:      presetType,
		CreatedAt: now,
	}
}

func (p *Preset) Touch(now time.Time) {
	p.UpdatedAt = &now
}

func (p *Preset) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		p.DeletedAt = &now
	} else {
		p.DeletedAt = nil
	}
}

func (p *Preset) Validate() error {
	if p.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if p.Name == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if len(p.Name) > 100 {
		return fmt.Errorf("name is invalid: %w", ErrInvalidField)
	}
	if p.Type != "income" && p.Type != "expense" {
		return fmt.Errorf("type is invalid: %w", ErrInvalidField)
	}
	return nil
}
