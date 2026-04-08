package channels

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound  = errors.New("resource not found")
	ErrDuplicate = errors.New("resource already exists")
)

type Channel struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"` // "BBVA", "Mercado Pago"
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type Account struct {
	ID         string     `json:"id"`
	ChannelID  string     `json:"channel_id"`
	Name       string     `json:"name"`       // "Crédito 5270", "Débito"
	Instrument string     `json:"instrument"` // "credit_card" | "debit_card" | "transfer" | "cash"
	LastFour   *string    `json:"last_four"`  // "5270", vacío si no aplica
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
}

type Filter struct {
	Deleted bool
}

// Repository
type Repository interface {
	CreateChannel(ctx context.Context, c Channel) (*Channel, error)
	GetChannelByID(ctx context.Context, id string) (*Channel, error)
	ListChannels(ctx context.Context, filter Filter) ([]Channel, error)
	ListChannelsWithAccounts(ctx context.Context, filter Filter) ([]ChannelWithAccounts, error)
	UpdateChannel(ctx context.Context, c Channel) (*Channel, error)
	DeleteChannel(ctx context.Context, id string, now time.Time) error
	CreateAccount(ctx context.Context, a Account) (*Account, error)
	GetAccountByID(ctx context.Context, id string) (*Account, error)
	ListAccounts(ctx context.Context, filter Filter) ([]Account, error)
	UpdateAccount(ctx context.Context, a Account) (*Account, error)
	DeleteAccount(ctx context.Context, id string, now time.Time) error
	RestoreChannel(ctx context.Context, id string) error
	RestoreAccount(ctx context.Context, id string) error
}

// CTOs
type ChannelReq struct {
	ID        *string `json:"id"`
	Name      *string `json:"name"`
	IsDeleted *bool   `json:"is_deleted"`
}

type AccountReq struct {
	ID         *string `json:"id"`
	ChannelID  *string `json:"channel_id"`
	Name       *string `json:"name"`
	Instrument *string `json:"instrument"`
	LastFour   *string `json:"last_four"`
	IsDeleted  *bool   `json:"is_deleted"`
}

type ChannelWithAccounts struct {
	Channel  Channel   `json:"channel"`
	Accounts []Account `json:"accounts"`
}

// Constructors

func NewChannel(now time.Time, name string) *Channel {
	id := ulid.Make().String()
	return &Channel{
		ID:        id,
		Name:      name,
		CreatedAt: now,
	}
}

func NewAccount(now time.Time, channelID, name, instrument string) *Account {
	id := ulid.Make().String()
	return &Account{
		ID:         id,
		ChannelID:  channelID,
		Name:       name,
		Instrument: instrument,
		CreatedAt:  now,
	}
}

func (c *Channel) Touch(now time.Time) {
	c.UpdatedAt = &now
}

func (c *Channel) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		c.DeletedAt = &now
	} else {
		c.DeletedAt = nil
	}
}

func (a *Account) SetLastFour(four string) {
	a.LastFour = &four
}

func (a *Account) Touch(now time.Time) {
	a.UpdatedAt = &now
}

func (a *Account) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		a.DeletedAt = &now
	} else {
		a.DeletedAt = nil
	}
}

// Validations
var ErrInvalidField = errors.New("invalid field")

func (c *Channel) Validate() error {
	if c.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if c.Name == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if len(c.Name) > 100 {
		return fmt.Errorf("name is invalid: %w", ErrInvalidField)
	}

	return nil
}

func (a *Account) Validate() error {
	if a.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if a.ChannelID == "" {
		return fmt.Errorf("channel_id is required: %w", ErrInvalidField)
	}
	if a.Name == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if a.Instrument == "" {
		return fmt.Errorf("instrument is required: %w", ErrInvalidField)
	}
	validInstruments := map[string]bool{"credit_card": true, "debit_card": true, "transfer": true, "cash": true}
	if !validInstruments[a.Instrument] {
		return fmt.Errorf("instrument is invalid: %w", ErrInvalidField)
	}
	if a.LastFour != nil && len(*a.LastFour) != 4 {
		return fmt.Errorf("last_four is invalid: %w", ErrInvalidField)
	}

	return nil
}
