package finance

import (
	"context"
	"errors"
	"fmt"
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
	ChannelID     string     `json:"channel_id"`
	AccountID     *string    `json:"account_id"`
	Amount        int64      `json:"amount"`
	Currency      Currency   `json:"currency"`
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
	GetTransactionByID(ctx context.Context, id string) (*Transaction, error)
	ListTransactions(ctx context.Context) ([]Transaction, error)
	UpdateTransaction(ctx context.Context, t Transaction) (*Transaction, error)
	DeleteTransaction(ctx context.Context, id string) error

	GetEntryByID(ctx context.Context, id string) (*Entry, error)
	ListEntries(ctx context.Context) ([]Entry, error)
	UpdateEntry(ctx context.Context, e Entry) (*Entry, error)
	DeleteEntry(ctx context.Context, id string) error

	GetInstallmentGroupByID(ctx context.Context, id string) (*InstallmentGroup, error)
	ListInstallmentGroups(ctx context.Context) ([]InstallmentGroup, error)
	UpdateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error)
	DeleteInstallmentGroup(ctx context.Context, id string) error

	CreateTransactionAggregate(ctx context.Context, agg TransactionAggregate) error
	ListTransactionsAggregate(ctx context.Context, filter *Filter) (*TransactionListResponse, error)
	GetTransactionAggregate(ctx context.Context, id string) (*TransactionRowDTO, error)
	DeleteTransactionAggregate(ctx context.Context, id string) error
	UpdateTransactionAggregate(ctx context.Context, id string, agg TransactionAggregate) error
	GetTransactionsByInstallmentGroup(ctx context.Context, groupID string, fromInstallment int) ([]TransactionRowDTO, error)
	CancelInstallments(ctx context.Context, agg TransactionAggregate, groupID string, fromInstallment int) error

	// must
	CreateChannel(ctx context.Context, c Channel) (*Channel, error)
	GetChannelByID(ctx context.Context, id string) (*Channel, error)
	ListChannels(ctx context.Context) ([]Channel, error)
	ListChannelsWithAccounts(ctx context.Context) ([]ChannelWithAccounts, error)
	UpdateChannel(ctx context.Context, c Channel) (*Channel, error)
	DeleteChannel(ctx context.Context, id string) error

	// must
	CreateAccount(ctx context.Context, a Account) (*Account, error)
	GetAccountByID(ctx context.Context, id string) (*Account, error)
	ListAccounts(ctx context.Context) ([]Account, error)
	UpdateAccount(ctx context.Context, a Account) (*Account, error)
	DeleteAccount(ctx context.Context, id string) error

	// must
	CreateCategory(ctx context.Context, c Category) (*Category, error)
	GetCategoryByID(ctx context.Context, id string) (*Category, error)
	ListCategories(ctx context.Context) ([]Category, error)
	ListCategoriesWithSubcategories(ctx context.Context) ([]CategoryWithSubcategories, error)
	UpdateCategory(ctx context.Context, c Category) (*Category, error)
	DeleteCategory(ctx context.Context, id string) error

	// must
	CreateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	GetSubcategoryByID(ctx context.Context, id string) (*Subcategory, error)
	ListSubcategories(ctx context.Context) ([]Subcategory, error)
	UpdateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	DeleteSubcategory(ctx context.Context, id string) error
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
	ChannelID     *string   `json:"channelID"`
	AccountID     *string   `json:"account_id"`
	Amount        *string   `json:"amount"`
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

type CategoryWithSubcategories struct {
	Category      Category      `json:"category"`
	Subcategories []Subcategory `json:"subcategories"`
}

type ChannelWithAccounts struct {
	Channel  Channel   `json:"channel"`
	Accounts []Account `json:"accounts"`
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

func NewEntry(now time.Time, transactionID, channelID string, amount int64, currency Currency, exchangeRate float64) *Entry {
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
var ErrInvalidField = errors.New("invalid field")

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

func (c *Category) Validate() error {
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

func (s *Subcategory) Validate() error {
	if s.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if s.CategoryID == "" {
		return fmt.Errorf("category_id is required: %w", ErrInvalidField)
	}
	if s.Name == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if len(s.Name) > 100 {
		return fmt.Errorf("name is invalid: %w", ErrInvalidField)
	}

	return nil
}

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

// Batch
type TransactionAggregateReq struct {
	Description       string               `json:"description"`
	Date              timeutils.Date       `json:"date"`
	Type              TransactionType      `json:"type"`
	Frequency         TransactionFrequency `json:"frequency"`
	InstallmentNumber *int                 `json:"installment_number"`
	Amount            string               `json:"amount"`
	Currency          Currency             `json:"currency"`
	ExchangeRate      float64              `json:"exchange_rate"`
	CategoryID        string               `json:"category_id"`
	SubcategoryID     string               `json:"subcategory_id"`
	ChannelID         string               `json:"channel_id"`
	AccountID         string               `json:"account_id"`
}

type CancelInstallmentsReq struct {
	InstallmentGroupID string `json:"installment_group_id"`
	FromInstallment    int    `json:"from_installment"`
}

type TransactionAggregate struct {
	Group *InstallmentGroup
	Items []struct {
		Transaction Transaction
		Entry       Entry
	}
}

type TransactionRowDTO struct {
	ID          string                `json:"id"`
	Date        timeutils.Date        `json:"date"`
	Description *string               `json:"description"`
	Type        TransactionType       `json:"type"`
	Frequency   *TransactionFrequency `json:"frequency"`

	EntryID      string   `json:"entry_id"`
	Amount       string   `json:"amount"`
	Currency     Currency `json:"currency"`
	ExchangeRate float64  `json:"exchange_rate"`

	CategoryID   *string `json:"category_id"`
	CategoryName *string `json:"category_name"`

	SubcategoryID   *string `json:"subcategory_id"`
	SubcategoryName *string `json:"subcategory_name"`

	AccountID   *string `json:"account_id"`
	AccountName *string `json:"account_name"`

	ChannelID   string `json:"channel_id"`
	ChannelName string `json:"channel_name"`

	InstallmentNumber  *int    `json:"installment_number"`
	TotalInstallments  *int    `json:"total_installments"`
	InstallmentGroupID *string `json:"installment_group_id"`
}

type TransactionListResponse struct {
	Data       []TransactionRowDTO `json:"data"`
	TotalCount int                 `json:"total_count"`
}

// Filters
type Filter struct {
	Limit *int
	Page  *int

	Sort  *string
	Order *string

	Search      *string
	Type        *TransactionType
	Frequency   *TransactionFrequency
	Currency    *Currency
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
		t := TransactionType(v)
		if t != TypeIncome && t != TypeExpense {
			return nil, fmt.Errorf("invalid type: %w", ErrInvalidFilter)
		}
		f.Type = &t
	}

	if v, ok := params["frequency"]; ok && v != "" {
		fr := TransactionFrequency(v)
		if fr != FrequencyFixed && fr != FrequencyVariable {
			return nil, fmt.Errorf("invalid frequency: %w", ErrInvalidFilter)
		}
		f.Frequency = &fr
	}

	if v, ok := params["currency"]; ok && v != "" {
		c := Currency(v)
		if c != CurrencyARS && c != CurrencyUSD {
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
