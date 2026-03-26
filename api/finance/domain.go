package finance

import (
	"context"
	"errors"
	"time"

	"github.com/nnavales/summit/api/timeutils"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound = errors.New("resource not found")
)

type TransactionType string

const TypeIncome TransactionType = "income"
const TypeExpense TransactionType = "expense"

type TransactionFrequency string

const FrequencyFixed TransactionFrequency = "fixed"
const FrequencyVariable TransactionFrequency = "variable"

type Currency string

const CurrencyARS Currency = "ARS"
const CurrencyUSD Currency = "USD"

// Domain definitions
type Transaction struct {
	ID                 string                `json:"id"`
	Date               timeutils.Date        `json:"date"`
	Description        *string               `json:"description"`
	Type               TransactionType       `json:"type"`
	Frequency          *TransactionFrequency `json:"frequency"`
	InstallmentGroupID *string               `json:"installment_group_id"`
	InstallmentNumber  *int                  `json:"installment_number"`
	CreatedAt          time.Time             `json:"created_at"`
	UpdatedAt          *time.Time            `json:"updated_at"`
	DeletedAt          *time.Time            `json:"deleted_at,omitempty"`
}

type Entry struct {
	ID            string     `json:"id"`
	TransactionID string     `json:"transaction_id"`
	AccountID     string     `json:"account_id"`
	AmountARS     int64      `json:"amount_ars"`
	AmountUSD     int64      `json:"amount_usd"`
	ExchangeRate  float64    `json:"exchange_rate"`
	CategoryID    *string    `json:"category_id"`
	SubcategoryID *string    `json:"subcategory_id"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

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

type Category struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type Subcategory struct {
	ID         string     `json:"id"`
	CategoryID string     `json:"category_id"`
	Name       string     `json:"name"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
}

type InstallmentGroup struct {
	ID                string         `json:"id"`
	TotalInstallments int            `json:"total_installments"`
	StartDate         timeutils.Date `json:"start_date"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         *time.Time     `json:"updated_at"`
	DeletedAt         *time.Time     `json:"deleted_at,omitempty"`
}

// Repository
type Repository interface {
	CreateTransaction(ctx context.Context, t Transaction) (*Transaction, error)
	GetTransactionByID(ctx context.Context, id string) (*Transaction, error)
	ListTransactions(ctx context.Context) ([]Transaction, error)
	UpdateTransaction(ctx context.Context, t Transaction) (*Transaction, error)
	DeleteTransaction(ctx context.Context, id string) error

	CreateEntry(ctx context.Context, e Entry) (*Entry, error)
	GetEntryByID(ctx context.Context, id string) (*Entry, error)
	ListEntries(ctx context.Context) ([]Entry, error)
	UpdateEntry(ctx context.Context, e Entry) (*Entry, error)
	DeleteEntry(ctx context.Context, id string) error

	CreateChannel(ctx context.Context, c Channel) (*Channel, error)
	GetChannelByID(ctx context.Context, id string) (*Channel, error)
	ListChannels(ctx context.Context) ([]Channel, error)
	UpdateChannel(ctx context.Context, c Channel) (*Channel, error)
	DeleteChannel(ctx context.Context, id string) error

	CreateAccount(ctx context.Context, a Account) (*Account, error)
	GetAccountByID(ctx context.Context, id string) (*Account, error)
	ListAccounts(ctx context.Context) ([]Account, error)
	UpdateAccount(ctx context.Context, a Account) (*Account, error)
	DeleteAccount(ctx context.Context, id string) error

	CreateCategory(ctx context.Context, c Category) (*Category, error)
	GetCategoryByID(ctx context.Context, id string) (*Category, error)
	ListCategories(ctx context.Context) ([]Category, error)
	UpdateCategory(ctx context.Context, c Category) (*Category, error)
	DeleteCategory(ctx context.Context, id string) error

	CreateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	GetSubcategoryByID(ctx context.Context, id string) (*Subcategory, error)
	ListSubcategories(ctx context.Context) ([]Subcategory, error)
	UpdateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	DeleteSubcategory(ctx context.Context, id string) error

	CreateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error)
	GetInstallmentGroupByID(ctx context.Context, id string) (*InstallmentGroup, error)
	ListInstallmentGroups(ctx context.Context) ([]InstallmentGroup, error)
	UpdateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error)
	DeleteInstallmentGroup(ctx context.Context, id string) error
}

// CTOs
type TransactionReq struct {
	ID                 *string               `json:"id"`
	Date               *timeutils.Date       `json:"date"`
	Description        *string               `json:"description"`
	Type               *TransactionType      `json:"type"`
	Frequency          *TransactionFrequency `json:"frequency"`
	InstallmentGroupID *string               `json:"installment_group_id"`
	InstallmentNumber  *int                  `json:"installment_number"`
	CreatedAt          *time.Time            `json:"created_at"`
	IsDeleted          *bool                 `json:"is_deleted"`
}

type EntryReq struct {
	ID            *string   `json:"id"`
	TransactionID *string   `json:"transaction_id"`
	AccountID     *string   `json:"account_id"`
	Amount        *int64    `json:"amount"`
	Currency      *Currency `json:"currency"`
	ExchangeRate  *float64  `json:"exchange_rate"`
	CategoryID    *string   `json:"category_id"`
	SubcategoryID *string   `json:"subcategory_id"`
	IsDeleted     *bool     `json:"is_deleted"`
}

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

type CategoryReq struct {
	ID        *string `json:"id"`
	Name      *string `json:"name"`
	IsDeleted *bool   `json:"is_deleted"`
}

type SubcategoryReq struct {
	ID         *string `json:"id"`
	CategoryID *string `json:"category_id"`
	Name       *string `json:"name"`
	IsDeleted  *bool   `json:"is_deleted"`
}

type InstallmentGroupReq struct {
	ID                *string         `json:"id"`
	TotalInstallments *int            `json:"total_installments"`
	StartDate         *timeutils.Date `json:"start_date"`
	IsDeleted         *bool           `json:"is_deleted"`
}

// Constructors
func NewTransaction(now time.Time, date timeutils.Date, tType TransactionType) *Transaction {
	id := ulid.Make().String()
	return &Transaction{
		ID:        id,
		Date:      date,
		Type:      tType,
		CreatedAt: now,
	}
}

func NewEntry(now time.Time, transactionID, accountID string, amountARS, amountUSD int64, exchangeRate float64) *Entry {
	id := ulid.Make().String()
	return &Entry{
		ID:            id,
		TransactionID: transactionID,
		AccountID:     accountID,
		AmountARS:     amountARS,
		AmountUSD:     amountUSD,
		ExchangeRate:  exchangeRate,
		CreatedAt:     now,
	}
}

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

func NewCategory(now time.Time, name string) *Category {
	id := ulid.Make().String()
	return &Category{
		ID:        id,
		Name:      name,
		CreatedAt: now,
	}
}

func NewSubcategory(now time.Time, categoryID, name string) *Subcategory {
	id := ulid.Make().String()
	return &Subcategory{
		ID:         id,
		CategoryID: categoryID,
		Name:       name,
		CreatedAt:  now,
	}
}

func NewInstallmentGroup(now time.Time, totalInstallments int, startDate timeutils.Date) *InstallmentGroup {
	id := ulid.Make().String()
	return &InstallmentGroup{
		ID:                id,
		TotalInstallments: totalInstallments,
		StartDate:         startDate,
		CreatedAt:         now,
	}
}

// Setters
func (t *Transaction) SetDescription(desc string) {
	t.Description = &desc
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

func (c *Category) Touch(now time.Time) {
	c.UpdatedAt = &now
}

func (c *Category) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		c.DeletedAt = &now
	} else {
		c.DeletedAt = nil
	}
}

func (s *Subcategory) Touch(now time.Time) {
	s.UpdatedAt = &now
}

func (s *Subcategory) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		s.DeletedAt = &now
	} else {
		s.DeletedAt = nil
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

// Validations
