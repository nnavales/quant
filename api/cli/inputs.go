package cli

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
)

var ErrInvalidInput = apperrors.ErrInvalidInput

type Input interface {
	Validate() error
	Usage() string
}

func parseInput[T Input](args []string, buildFromMap func(map[string]string) (T, error)) (T, error) {
	var input T

	fs := newFlagSet()
	file := fs.String("file", "", "JSON file path")
	body := fs.String("body", "", "JSON body string")
	if err := fs.Parse(args); err != nil {
		return input, err
	}

	var err error
	switch {
	case *file != "":
		b, err := os.ReadFile(*file)
		if err != nil {
			return input, fmt.Errorf("unable to read file %q: %w", *file, err)
		}
		if err := json.Unmarshal(b, &input); err != nil {
			return input, fmt.Errorf("unable to unmarshal JSON: %w", err)
		}
	case *body != "":
		if err := json.Unmarshal([]byte(*body), &input); err != nil {
			return input, fmt.Errorf("unable to unmarshal JSON: %w", err)
		}
	default:
		kv := parseKV(fs.Args())
		input, err = buildFromMap(kv)
		if err != nil {
			return input, err
		}
	}

	return input, input.Validate()
}

func newFlagSet() *flag.FlagSet {
	fs := flag.NewFlagSet("", flag.ExitOnError)
	fs.SetOutput(io.Discard)
	return fs
}

func parseKV(args []string) map[string]string {
	m := make(map[string]string)
	for _, arg := range args {
		idx := strings.Index(arg, "=")
		if idx <= 0 {
			continue
		}
		m[arg[:idx]] = arg[idx+1:]
	}
	return m
}

// ========================
// Transactions
// ========================

type CreateTransactionInput struct {
	Description       string                            `json:"description"`
	Date              timeutils.Date                    `json:"date"`
	Type              transactions.TransactionType      `json:"type"`
	Frequency         transactions.TransactionFrequency `json:"frequency"`
	Amount            string                            `json:"amount"`
	Currency          entries.Currency                  `json:"currency"`
	ExchangeRate      float64                           `json:"exchange_rate"`
	CategoryID        string                            `json:"category_id"`
	SubcategoryID     string                            `json:"subcategory_id"`
	ChannelID         string                            `json:"channel_id"`
	AccountID         string                            `json:"account_id"`
	IsPaid            *bool                             `json:"is_paid,omitempty"`
	InstallmentNumber *int                              `json:"installment_number,omitempty"`
}

func newCreateTransactionInput(m map[string]string) (CreateTransactionInput, error) {
	var in CreateTransactionInput
	if v, ok := m["description"]; ok {
		in.Description = v
	}
	if v, ok := m["date"]; ok {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return in, fmt.Errorf("invalid date: %w", ErrInvalidInput)
		}
		in.Date = d
	}
	if v, ok := m["type"]; ok {
		in.Type = transactions.TransactionType(v)
	}
	if v, ok := m["frequency"]; ok {
		in.Frequency = transactions.TransactionFrequency(v)
	}
	if v, ok := m["amount"]; ok {
		in.Amount = v
	}
	if v, ok := m["currency"]; ok {
		in.Currency = entries.Currency(v)
	}
	if v, ok := m["exchange_rate"]; ok {
		r, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return in, fmt.Errorf("invalid exchange_rate: %w", ErrInvalidInput)
		}
		in.ExchangeRate = r
	}
	if v, ok := m["category_id"]; ok {
		in.CategoryID = v
	}
	if v, ok := m["subcategory_id"]; ok {
		in.SubcategoryID = v
	}
	if v, ok := m["channel_id"]; ok {
		in.ChannelID = v
	}
	if v, ok := m["account_id"]; ok {
		in.AccountID = v
	}
	if v, ok := m["is_paid"]; ok {
		b, err := strconv.ParseBool(v)
		if err != nil {
			return in, fmt.Errorf("invalid is_paid: %w", ErrInvalidInput)
		}
		in.IsPaid = &b
	}
	if v, ok := m["installment_number"]; ok {
		n, err := strconv.Atoi(v)
		if err != nil {
			return in, fmt.Errorf("invalid installment_number: %w", ErrInvalidInput)
		}
		in.InstallmentNumber = &n
	}
	return in, nil
}

func (in CreateTransactionInput) Validate() error {
	if strings.TrimSpace(in.Description) == "" {
		return fmt.Errorf("description is required: %w", ErrInvalidInput)
	}
	if in.Date.IsZero() {
		return fmt.Errorf("date is required: %w", ErrInvalidInput)
	}
	if in.Type != transactions.TypeIncome && in.Type != transactions.TypeExpense {
		return fmt.Errorf("type must be income or expense: %w", ErrInvalidInput)
	}
	if in.Frequency != transactions.FrequencyFixed && in.Frequency != transactions.FrequencyVariable {
		return fmt.Errorf("frequency must be fixed or variable: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.Amount) == "" {
		return fmt.Errorf("amount is required: %w", ErrInvalidInput)
	}
	if _, err := money.ParseAmountToCents(in.Amount); err != nil {
		return fmt.Errorf("amount is invalid: %w", ErrInvalidInput)
	}
	if in.Currency != entries.CurrencyARS && in.Currency != entries.CurrencyUSD {
		return fmt.Errorf("currency must be ARS or USD: %w", ErrInvalidInput)
	}
	if in.ExchangeRate <= 0 {
		return fmt.Errorf("exchange_rate must be positive: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.CategoryID) == "" {
		return fmt.Errorf("category_id is required: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.SubcategoryID) == "" {
		return fmt.Errorf("subcategory_id is required: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.ChannelID) == "" {
		return fmt.Errorf("channel_id is required: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.AccountID) == "" {
		return fmt.Errorf("account_id is required: %w", ErrInvalidInput)
	}
	if in.InstallmentNumber != nil && *in.InstallmentNumber < 1 {
		return fmt.Errorf("installment_number must be >= 1: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateTransactionInput) Usage() string {
	return "description=<text> date=<yyyy-mm-dd> type=income|expense frequency=fixed|variable amount=<number> currency=ARS|USD exchange_rate=<float> category_id=<id> subcategory_id=<id> channel_id=<id> account_id=<id> [is_paid=true|false] [installment_number=<n>]"
}

type UpdateTransactionInput struct {
	Description       *string                            `json:"description,omitempty"`
	Date              *timeutils.Date                    `json:"date,omitempty"`
	Type              *transactions.TransactionType      `json:"type,omitempty"`
	Frequency         *transactions.TransactionFrequency `json:"frequency,omitempty"`
	Amount            *string                            `json:"amount,omitempty"`
	Currency          *entries.Currency                  `json:"currency,omitempty"`
	ExchangeRate      *float64                           `json:"exchange_rate,omitempty"`
	CategoryID        *string                            `json:"category_id,omitempty"`
	SubcategoryID     *string                            `json:"subcategory_id,omitempty"`
	ChannelID         *string                            `json:"channel_id,omitempty"`
	AccountID         *string                            `json:"account_id,omitempty"`
	IsPaid            *bool                              `json:"is_paid,omitempty"`
	InstallmentNumber *int                               `json:"installment_number,omitempty"`
}

func newUpdateTransactionInput(m map[string]string) (UpdateTransactionInput, error) {
	var in UpdateTransactionInput
	if v, ok := m["description"]; ok && v != "" {
		in.Description = &v
	}
	if v, ok := m["date"]; ok && v != "" {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return in, fmt.Errorf("invalid date: %w", ErrInvalidInput)
		}
		in.Date = &d
	}
	if v, ok := m["type"]; ok && v != "" {
		t := transactions.TransactionType(v)
		in.Type = &t
	}
	if v, ok := m["frequency"]; ok && v != "" {
		f := transactions.TransactionFrequency(v)
		in.Frequency = &f
	}
	if v, ok := m["amount"]; ok && v != "" {
		in.Amount = &v
	}
	if v, ok := m["currency"]; ok && v != "" {
		c := entries.Currency(v)
		in.Currency = &c
	}
	if v, ok := m["exchange_rate"]; ok && v != "" {
		r, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return in, fmt.Errorf("invalid exchange_rate: %w", ErrInvalidInput)
		}
		in.ExchangeRate = &r
	}
	if v, ok := m["category_id"]; ok && v != "" {
		in.CategoryID = &v
	}
	if v, ok := m["subcategory_id"]; ok && v != "" {
		in.SubcategoryID = &v
	}
	if v, ok := m["channel_id"]; ok && v != "" {
		in.ChannelID = &v
	}
	if v, ok := m["account_id"]; ok && v != "" {
		in.AccountID = &v
	}
	if v, ok := m["is_paid"]; ok && v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			return in, fmt.Errorf("invalid is_paid: %w", ErrInvalidInput)
		}
		in.IsPaid = &b
	}
	if v, ok := m["installment_number"]; ok && v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			return in, fmt.Errorf("invalid installment_number: %w", ErrInvalidInput)
		}
		in.InstallmentNumber = &n
	}
	return in, nil
}

func (in UpdateTransactionInput) Validate() error {
	if in.Description != nil && strings.TrimSpace(*in.Description) == "" {
		return fmt.Errorf("description cannot be empty: %w", ErrInvalidInput)
	}
	if in.Date != nil && in.Date.IsZero() {
		return fmt.Errorf("date cannot be zero: %w", ErrInvalidInput)
	}
	if in.Type != nil && *in.Type != transactions.TypeIncome && *in.Type != transactions.TypeExpense {
		return fmt.Errorf("type must be income or expense: %w", ErrInvalidInput)
	}
	if in.Frequency != nil && *in.Frequency != transactions.FrequencyFixed && *in.Frequency != transactions.FrequencyVariable {
		return fmt.Errorf("frequency must be fixed or variable: %w", ErrInvalidInput)
	}
	if in.Amount != nil {
		if strings.TrimSpace(*in.Amount) == "" {
			return fmt.Errorf("amount cannot be empty: %w", ErrInvalidInput)
		}
		if _, err := money.ParseAmountToCents(*in.Amount); err != nil {
			return fmt.Errorf("amount is invalid: %w", ErrInvalidInput)
		}
	}
	if in.Currency != nil && *in.Currency != entries.CurrencyARS && *in.Currency != entries.CurrencyUSD {
		return fmt.Errorf("currency must be ARS or USD: %w", ErrInvalidInput)
	}
	if in.ExchangeRate != nil && *in.ExchangeRate <= 0 {
		return fmt.Errorf("exchange_rate must be positive: %w", ErrInvalidInput)
	}
	if in.CategoryID != nil && strings.TrimSpace(*in.CategoryID) == "" {
		return fmt.Errorf("category_id cannot be empty: %w", ErrInvalidInput)
	}
	if in.SubcategoryID != nil && strings.TrimSpace(*in.SubcategoryID) == "" {
		return fmt.Errorf("subcategory_id cannot be empty: %w", ErrInvalidInput)
	}
	if in.ChannelID != nil && strings.TrimSpace(*in.ChannelID) == "" {
		return fmt.Errorf("channel_id cannot be empty: %w", ErrInvalidInput)
	}
	if in.AccountID != nil && strings.TrimSpace(*in.AccountID) == "" {
		return fmt.Errorf("account_id cannot be empty: %w", ErrInvalidInput)
	}
	if in.InstallmentNumber != nil && *in.InstallmentNumber < 1 {
		return fmt.Errorf("installment_number must be >= 1: %w", ErrInvalidInput)
	}
	return nil
}

func (UpdateTransactionInput) Usage() string {
	return "[description=<text>] [date=<yyyy-mm-dd>] [type=income|expense] [frequency=fixed|variable] [amount=<number>] [currency=ARS|USD] [exchange_rate=<float>] [category_id=<id>] [subcategory_id=<id>] [channel_id=<id>] [account_id=<id>] [is_paid=true|false] [installment_number=<n>]"
}

// ========================
// Categories
// ========================

type CreateCategoryInput struct {
	Name string `json:"name"`
}

func newCreateCategoryInput(m map[string]string) (CreateCategoryInput, error) {
	var in CreateCategoryInput
	if v, ok := m["name"]; ok {
		in.Name = v
	}
	return in, nil
}

func (in CreateCategoryInput) Validate() error {
	if strings.TrimSpace(in.Name) == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidInput)
	}
	if len(in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateCategoryInput) Usage() string {
	return "name=<text>"
}

type UpdateCategoryInput struct {
	Name *string `json:"name,omitempty"`
}

func newUpdateCategoryInput(m map[string]string) (UpdateCategoryInput, error) {
	var in UpdateCategoryInput
	if v, ok := m["name"]; ok && v != "" {
		in.Name = &v
	}
	return in, nil
}

func (in UpdateCategoryInput) Validate() error {
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return fmt.Errorf("name cannot be empty: %w", ErrInvalidInput)
	}
	if in.Name != nil && len(*in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	return nil
}

func (UpdateCategoryInput) Usage() string {
	return "[name=<text>]"
}

type CreateSubcategoryInput struct {
	CategoryID string `json:"category_id"`
	Name       string `json:"name"`
}

func newCreateSubcategoryInput(m map[string]string) (CreateSubcategoryInput, error) {
	var in CreateSubcategoryInput
	if v, ok := m["category_id"]; ok {
		in.CategoryID = v
	}
	if v, ok := m["name"]; ok {
		in.Name = v
	}
	return in, nil
}

func (in CreateSubcategoryInput) Validate() error {
	if strings.TrimSpace(in.CategoryID) == "" {
		return fmt.Errorf("category_id is required: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.Name) == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidInput)
	}
	if len(in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateSubcategoryInput) Usage() string {
	return "category_id=<id> name=<text>"
}

type UpdateSubcategoryInput struct {
	CategoryID *string `json:"category_id,omitempty"`
	Name       *string `json:"name,omitempty"`
}

func newUpdateSubcategoryInput(m map[string]string) (UpdateSubcategoryInput, error) {
	var in UpdateSubcategoryInput
	if v, ok := m["category_id"]; ok && v != "" {
		in.CategoryID = &v
	}
	if v, ok := m["name"]; ok && v != "" {
		in.Name = &v
	}
	return in, nil
}

func (in UpdateSubcategoryInput) Validate() error {
	if in.CategoryID != nil && strings.TrimSpace(*in.CategoryID) == "" {
		return fmt.Errorf("category_id cannot be empty: %w", ErrInvalidInput)
	}
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return fmt.Errorf("name cannot be empty: %w", ErrInvalidInput)
	}
	if in.Name != nil && len(*in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	return nil
}

func (UpdateSubcategoryInput) Usage() string {
	return "[category_id=<id>] [name=<text>]"
}

// ========================
// Channels / Accounts
// ========================

type CreateChannelInput struct {
	Name string `json:"name"`
}

func newCreateChannelInput(m map[string]string) (CreateChannelInput, error) {
	var in CreateChannelInput
	if v, ok := m["name"]; ok {
		in.Name = v
	}
	return in, nil
}

func (in CreateChannelInput) Validate() error {
	if strings.TrimSpace(in.Name) == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidInput)
	}
	if len(in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateChannelInput) Usage() string {
	return "name=<text>"
}

type UpdateChannelInput struct {
	Name *string `json:"name,omitempty"`
}

func newUpdateChannelInput(m map[string]string) (UpdateChannelInput, error) {
	var in UpdateChannelInput
	if v, ok := m["name"]; ok && v != "" {
		in.Name = &v
	}
	return in, nil
}

func (in UpdateChannelInput) Validate() error {
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return fmt.Errorf("name cannot be empty: %w", ErrInvalidInput)
	}
	if in.Name != nil && len(*in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	return nil
}

func (UpdateChannelInput) Usage() string {
	return "[name=<text>]"
}

type CreateAccountInput struct {
	ChannelID  string `json:"channel_id"`
	Name       string `json:"name"`
	Instrument string `json:"instrument"`
}

func newCreateAccountInput(m map[string]string) (CreateAccountInput, error) {
	var in CreateAccountInput
	if v, ok := m["channel_id"]; ok {
		in.ChannelID = v
	}
	if v, ok := m["name"]; ok {
		in.Name = v
	}
	if v, ok := m["instrument"]; ok {
		in.Instrument = v
	}
	return in, nil
}

func (in CreateAccountInput) Validate() error {
	if strings.TrimSpace(in.ChannelID) == "" {
		return fmt.Errorf("channel_id is required: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(in.Name) == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidInput)
	}
	if len(in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	if !isValidInstrument(in.Instrument) {
		return fmt.Errorf("instrument must be credit_card, debit_card, transfer or cash: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateAccountInput) Usage() string {
	return "channel_id=<id> name=<text> instrument=credit_card|debit_card|transfer|cash"
}

type UpdateAccountInput struct {
	ChannelID  *string `json:"channel_id,omitempty"`
	Name       *string `json:"name,omitempty"`
	Instrument *string `json:"instrument,omitempty"`
}

func newUpdateAccountInput(m map[string]string) (UpdateAccountInput, error) {
	var in UpdateAccountInput
	if v, ok := m["channel_id"]; ok && v != "" {
		in.ChannelID = &v
	}
	if v, ok := m["name"]; ok && v != "" {
		in.Name = &v
	}
	if v, ok := m["instrument"]; ok && v != "" {
		in.Instrument = &v
	}
	return in, nil
}

func (in UpdateAccountInput) Validate() error {
	if in.ChannelID != nil && strings.TrimSpace(*in.ChannelID) == "" {
		return fmt.Errorf("channel_id cannot be empty: %w", ErrInvalidInput)
	}
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return fmt.Errorf("name cannot be empty: %w", ErrInvalidInput)
	}
	if in.Name != nil && len(*in.Name) > 100 {
		return fmt.Errorf("name must be at most 100 characters: %w", ErrInvalidInput)
	}
	if in.Instrument != nil && !isValidInstrument(*in.Instrument) {
		return fmt.Errorf("instrument must be credit_card, debit_card, transfer or cash: %w", ErrInvalidInput)
	}
	return nil
}

func (UpdateAccountInput) Usage() string {
	return "[channel_id=<id>] [name=<text>] [instrument=credit_card|debit_card|transfer|cash]"
}

func isValidInstrument(i string) bool {
	switch i {
	case "credit_card", "debit_card", "transfer", "cash":
		return true
	}
	return false
}

// ========================
// Assets (NetWorth)
// ========================

type CreateAssetInput struct {
	Name     string             `json:"name"`
	Amount   money.Money        `json:"amount"`
	Currency entries.Currency   `json:"currency"`
	Type     networth.AssetType `json:"type"`
}

func newCreateAssetInput(m map[string]string) (CreateAssetInput, error) {
	var in CreateAssetInput
	if v, ok := m["name"]; ok {
		in.Name = v
	}
	if v, ok := m["amount"]; ok {
		a, err := money.ParseAmountToCents(v)
		if err != nil {
			return in, fmt.Errorf("invalid amount: %w", ErrInvalidInput)
		}
		in.Amount = money.Money(a)
	}
	if v, ok := m["currency"]; ok {
		in.Currency = entries.Currency(v)
	}
	if v, ok := m["type"]; ok {
		in.Type = networth.AssetType(v)
	}
	return in, nil
}

func (in CreateAssetInput) Validate() error {
	if strings.TrimSpace(in.Name) == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidInput)
	}
	if in.Amount <= 0 {
		return fmt.Errorf("amount must be positive: %w", ErrInvalidInput)
	}
	if in.Currency != entries.CurrencyARS && in.Currency != entries.CurrencyUSD {
		return fmt.Errorf("currency must be ARS or USD: %w", ErrInvalidInput)
	}
	if in.Type != networth.AssetLiquid && in.Type != networth.AssetPhysical {
		return fmt.Errorf("type must be liquid or physical: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateAssetInput) Usage() string {
	return "name=<text> amount=<number> currency=ARS|USD type=liquid|physical"
}

type UpdateAssetInput struct {
	Name     *string             `json:"name,omitempty"`
	Amount   *money.Money        `json:"amount,omitempty"`
	Currency *entries.Currency   `json:"currency,omitempty"`
	Type     *networth.AssetType `json:"type,omitempty"`
}

func newUpdateAssetInput(m map[string]string) (UpdateAssetInput, error) {
	var in UpdateAssetInput
	if v, ok := m["name"]; ok && v != "" {
		in.Name = &v
	}
	if v, ok := m["amount"]; ok && v != "" {
		a, err := money.ParseAmountToCents(v)
		if err != nil {
			return in, fmt.Errorf("invalid amount: %w", ErrInvalidInput)
		}
		m := money.Money(a)
		in.Amount = &m
	}
	if v, ok := m["currency"]; ok && v != "" {
		c := entries.Currency(v)
		in.Currency = &c
	}
	if v, ok := m["type"]; ok && v != "" {
		t := networth.AssetType(v)
		in.Type = &t
	}
	return in, nil
}

func (in UpdateAssetInput) Validate() error {
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return fmt.Errorf("name cannot be empty: %w", ErrInvalidInput)
	}
	if in.Amount != nil && *in.Amount <= 0 {
		return fmt.Errorf("amount must be positive: %w", ErrInvalidInput)
	}
	if in.Currency != nil && *in.Currency != entries.CurrencyARS && *in.Currency != entries.CurrencyUSD {
		return fmt.Errorf("currency must be ARS or USD: %w", ErrInvalidInput)
	}
	if in.Type != nil && *in.Type != networth.AssetLiquid && *in.Type != networth.AssetPhysical {
		return fmt.Errorf("type must be liquid or physical: %w", ErrInvalidInput)
	}
	return nil
}

func (UpdateAssetInput) Usage() string {
	return "[name=<text>] [amount=<number>] [currency=ARS|USD] [type=liquid|physical]"
}

// ========================
// Historical
// ========================

type CreateHistoricalEntryInput struct {
	Date               timeutils.Date `json:"date"`
	ExchangeRate       float64        `json:"exchange_rate"`
	IncomeUSD          string         `json:"income_usd"`
	IncomeFixedUSD     string         `json:"income_fixed_usd"`
	IncomeVariableUSD  string         `json:"income_variable_usd"`
	ExpenseUSD         string         `json:"expense_usd"`
	ExpenseFixedUSD    string         `json:"expense_fixed_usd"`
	ExpenseVariableUSD string         `json:"expense_variable_usd"`
}

func newCreateHistoricalEntryInput(m map[string]string) (CreateHistoricalEntryInput, error) {
	var in CreateHistoricalEntryInput
	if v, ok := m["date"]; ok {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return in, fmt.Errorf("invalid date: %w", ErrInvalidInput)
		}
		in.Date = d
	}
	if v, ok := m["exchange_rate"]; ok {
		r, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return in, fmt.Errorf("invalid exchange_rate: %w", ErrInvalidInput)
		}
		in.ExchangeRate = r
	}
	if v, ok := m["income_usd"]; ok {
		in.IncomeUSD = v
	}
	if v, ok := m["income_fixed_usd"]; ok {
		in.IncomeFixedUSD = v
	}
	if v, ok := m["income_variable_usd"]; ok {
		in.IncomeVariableUSD = v
	}
	if v, ok := m["expense_usd"]; ok {
		in.ExpenseUSD = v
	}
	if v, ok := m["expense_fixed_usd"]; ok {
		in.ExpenseFixedUSD = v
	}
	if v, ok := m["expense_variable_usd"]; ok {
		in.ExpenseVariableUSD = v
	}
	return in, nil
}

func (in CreateHistoricalEntryInput) Validate() error {
	if in.Date.IsZero() {
		return fmt.Errorf("date is required: %w", ErrInvalidInput)
	}
	if in.ExchangeRate <= 0 {
		return fmt.Errorf("exchange_rate must be positive: %w", ErrInvalidInput)
	}
	income, err := money.ParseAmountToCents(in.IncomeUSD)
	if err != nil {
		return fmt.Errorf("income_usd is invalid: %w", ErrInvalidInput)
	}
	incomeFixed, err := money.ParseAmountToCents(in.IncomeFixedUSD)
	if err != nil {
		return fmt.Errorf("income_fixed_usd is invalid: %w", ErrInvalidInput)
	}
	incomeVariable, err := money.ParseAmountToCents(in.IncomeVariableUSD)
	if err != nil {
		return fmt.Errorf("income_variable_usd is invalid: %w", ErrInvalidInput)
	}
	expense, err := money.ParseAmountToCents(in.ExpenseUSD)
	if err != nil {
		return fmt.Errorf("expense_usd is invalid: %w", ErrInvalidInput)
	}
	expenseFixed, err := money.ParseAmountToCents(in.ExpenseFixedUSD)
	if err != nil {
		return fmt.Errorf("expense_fixed_usd is invalid: %w", ErrInvalidInput)
	}
	expenseVariable, err := money.ParseAmountToCents(in.ExpenseVariableUSD)
	if err != nil {
		return fmt.Errorf("expense_variable_usd is invalid: %w", ErrInvalidInput)
	}
	if income < 0 || incomeFixed < 0 || incomeVariable < 0 {
		return fmt.Errorf("income amounts cannot be negative: %w", ErrInvalidInput)
	}
	if expense < 0 || expenseFixed < 0 || expenseVariable < 0 {
		return fmt.Errorf("expense amounts cannot be negative: %w", ErrInvalidInput)
	}
	if !breakdownMatches(income, incomeFixed, incomeVariable) {
		return fmt.Errorf("income breakdown does not match total: %w", ErrInvalidInput)
	}
	if !breakdownMatches(expense, expenseFixed, expenseVariable) {
		return fmt.Errorf("expense breakdown does not match total: %w", ErrInvalidInput)
	}
	return nil
}

func (CreateHistoricalEntryInput) Usage() string {
	return "date=<yyyy-mm-dd> exchange_rate=<float> income_usd=<number> income_fixed_usd=<number> income_variable_usd=<number> expense_usd=<number> expense_fixed_usd=<number> expense_variable_usd=<number>"
}

type UpdateHistoricalEntryInput struct {
	Date               *timeutils.Date `json:"date,omitempty"`
	ExchangeRate       *float64        `json:"exchange_rate,omitempty"`
	IncomeUSD          *string         `json:"income_usd,omitempty"`
	IncomeFixedUSD     *string         `json:"income_fixed_usd,omitempty"`
	IncomeVariableUSD  *string         `json:"income_variable_usd,omitempty"`
	ExpenseUSD         *string         `json:"expense_usd,omitempty"`
	ExpenseFixedUSD    *string         `json:"expense_fixed_usd,omitempty"`
	ExpenseVariableUSD *string         `json:"expense_variable_usd,omitempty"`
}

func newUpdateHistoricalEntryInput(m map[string]string) (UpdateHistoricalEntryInput, error) {
	var in UpdateHistoricalEntryInput
	if v, ok := m["date"]; ok && v != "" {
		d, err := timeutils.ParseDate(v)
		if err != nil {
			return in, fmt.Errorf("invalid date: %w", ErrInvalidInput)
		}
		in.Date = &d
	}
	if v, ok := m["exchange_rate"]; ok && v != "" {
		r, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return in, fmt.Errorf("invalid exchange_rate: %w", ErrInvalidInput)
		}
		in.ExchangeRate = &r
	}
	if v, ok := m["income_usd"]; ok && v != "" {
		in.IncomeUSD = &v
	}
	if v, ok := m["income_fixed_usd"]; ok && v != "" {
		in.IncomeFixedUSD = &v
	}
	if v, ok := m["income_variable_usd"]; ok && v != "" {
		in.IncomeVariableUSD = &v
	}
	if v, ok := m["expense_usd"]; ok && v != "" {
		in.ExpenseUSD = &v
	}
	if v, ok := m["expense_fixed_usd"]; ok && v != "" {
		in.ExpenseFixedUSD = &v
	}
	if v, ok := m["expense_variable_usd"]; ok && v != "" {
		in.ExpenseVariableUSD = &v
	}
	return in, nil
}

func (in UpdateHistoricalEntryInput) Validate() error {
	if in.Date != nil && in.Date.IsZero() {
		return fmt.Errorf("date cannot be zero: %w", ErrInvalidInput)
	}
	if in.ExchangeRate != nil && *in.ExchangeRate <= 0 {
		return fmt.Errorf("exchange_rate must be positive: %w", ErrInvalidInput)
	}
	if err := validateHistoricalAmount("income_usd", in.IncomeUSD); err != nil {
		return err
	}
	if err := validateHistoricalAmount("income_fixed_usd", in.IncomeFixedUSD); err != nil {
		return err
	}
	if err := validateHistoricalAmount("income_variable_usd", in.IncomeVariableUSD); err != nil {
		return err
	}
	if err := validateHistoricalAmount("expense_usd", in.ExpenseUSD); err != nil {
		return err
	}
	if err := validateHistoricalAmount("expense_fixed_usd", in.ExpenseFixedUSD); err != nil {
		return err
	}
	if err := validateHistoricalAmount("expense_variable_usd", in.ExpenseVariableUSD); err != nil {
		return err
	}
	return nil
}

func (UpdateHistoricalEntryInput) Usage() string {
	return "[date=<yyyy-mm-dd>] [exchange_rate=<float>] [income_usd=<number>] [income_fixed_usd=<number>] [income_variable_usd=<number>] [expense_usd=<number>] [expense_fixed_usd=<number>] [expense_variable_usd=<number>]"
}

// ========================
// Cancel Installments
// ========================

type CancelInstallmentsInput struct {
	InstallmentGroupID string `json:"installment_group_id"`
	FromInstallment    int    `json:"from_installment"`
}

func newCancelInstallmentsInput(m map[string]string) (CancelInstallmentsInput, error) {
	var in CancelInstallmentsInput
	if v, ok := m["installment_group_id"]; ok {
		in.InstallmentGroupID = v
	}
	if v, ok := m["from_installment"]; ok {
		n, err := strconv.Atoi(v)
		if err != nil {
			return in, fmt.Errorf("invalid from_installment: %w", ErrInvalidInput)
		}
		in.FromInstallment = n
	}
	return in, nil
}

func (in CancelInstallmentsInput) Validate() error {
	if strings.TrimSpace(in.InstallmentGroupID) == "" {
		return fmt.Errorf("installment_group_id is required: %w", ErrInvalidInput)
	}
	if in.FromInstallment < 1 {
		return fmt.Errorf("from_installment must be >= 1: %w", ErrInvalidInput)
	}
	return nil
}

func (CancelInstallmentsInput) Usage() string {
	return "installment_group_id=<id> from_installment=<n>"
}

// ========================
// Config
// ========================

type ConfigSetInput map[string]any

func newConfigSetInput(m map[string]string) (ConfigSetInput, error) {
	in := make(ConfigSetInput, len(m))
	for k, v := range m {
		in[k] = v
	}
	return in, nil
}

func (in ConfigSetInput) Validate() error {
	if len(in) == 0 {
		return fmt.Errorf("at least one key=value is required: %w", ErrInvalidInput)
	}
	return nil
}

func (ConfigSetInput) Usage() string {
	return "<key=value>"
}

func validateHistoricalAmount(field string, v *string) error {
	if v == nil {
		return nil
	}
	parsed, err := money.ParseAmountToCents(*v)
	if err != nil {
		return fmt.Errorf("%s is invalid: %w", field, ErrInvalidInput)
	}
	if parsed < 0 {
		return fmt.Errorf("%s cannot be negative: %w", field, ErrInvalidInput)
	}
	return nil
}

func breakdownMatches(total, fixed, variable int64) bool {
	sum := fixed + variable
	diff := total - sum
	if diff < 0 {
		diff = -diff
	}
	return diff <= 3
}
