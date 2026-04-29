package finance

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/nnavales/summit/api/transactions"
)

var ErrInvalidCSV = errors.New("invalid csv")

type TransactionAggregateCSV struct {
	Description  string `csv:"description"`
	Date         string `csv:"date"`
	Type         string `csv:"type"`
	Frequency    string `csv:"frequency"`
	Installments string `csv:"installments"`
	Amount       string `csv:"amount"`
	Currency     string `csv:"currency"`
	ExchangeRate string `csv:"exchange_rate"`
	Category     string `csv:"category"`
	Subcategory  string `csv:"subcategory"`
	Channel      string `csv:"channel"`
	Account      string `csv:"account"`
	IsPaid       string `csv:"is_paid"`
}

type CSVResolver struct {
	categoriesService *categories.Service
	channelsService   *channels.Service
}

func NewCSVResolver(categoriesService *categories.Service, channelsService *channels.Service) *CSVResolver {
	return &CSVResolver{
		categoriesService: categoriesService,
		channelsService:   channelsService,
	}
}

func (r *CSVResolver) Resolve(ctx context.Context, csvReq TransactionAggregateCSV) (*TransactionAggregateReq, error) {
	date, err := timeutils.ParseDate(csvReq.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}

	txType := transactions.TransactionType(csvReq.Type)
	if txType != transactions.TypeIncome && txType != transactions.TypeExpense {
		return nil, fmt.Errorf("invalid type: must be 'income' or 'expense'")
	}

	freq := transactions.TransactionFrequency(csvReq.Frequency)
	if freq != transactions.FrequencyFixed && freq != transactions.FrequencyVariable {
		return nil, fmt.Errorf("invalid frequency: must be 'fixed' or 'variable'")
	}

	currency := entries.Currency(csvReq.Currency)
	if currency != entries.CurrencyARS && currency != entries.CurrencyUSD {
		return nil, fmt.Errorf("invalid currency: must be 'ARS' or 'USD'")
	}

	categoryID, err := r.resolveCategory(ctx, csvReq.Category)
	if err != nil {
		return nil, fmt.Errorf("category: %w", err)
	}

	var subcategoryID string
	if csvReq.Subcategory != "" {
		sid, err := r.resolveSubcategory(ctx, csvReq.Category, csvReq.Subcategory)
		if err != nil {
			return nil, fmt.Errorf("subcategory: %w", err)
		}
		subcategoryID = sid
	}

	channelID, err := r.resolveChannel(ctx, csvReq.Channel)
	if err != nil {
		return nil, fmt.Errorf("channel: %w", err)
	}

	var accountID string
	if csvReq.Account != "" {
		aid, err := r.resolveAccount(ctx, channelID, csvReq.Account)
		if err != nil {
			return nil, fmt.Errorf("account: %w", err)
		}
		accountID = aid
	}

	exchangeRate := 1.0
	if csvReq.ExchangeRate != "" {
		rate, err := strconv.ParseFloat(csvReq.ExchangeRate, 64)
		if err != nil || rate <= 0 {
			return nil, fmt.Errorf("invalid exchange_rate")
		}
		exchangeRate = rate
	}

	var installmentNum *int
	if csvReq.Installments != "" {
		n, err := strconv.Atoi(csvReq.Installments)
		if err != nil || n < 1 {
			return nil, fmt.Errorf("invalid installments")
		}
		installmentNum = &n
	}

	var isPaid *bool
	if csvReq.IsPaid != "" {
		paid := csvReq.IsPaid == "true"
		isPaid = &paid
	}

	return &TransactionAggregateReq{
		Description:       csvReq.Description,
		Date:              date,
		Type:              txType,
		Frequency:         freq,
		InstallmentNumber: installmentNum,
		Amount:            csvReq.Amount,
		Currency:          currency,
		ExchangeRate:      exchangeRate,
		CategoryID:        categoryID,
		SubcategoryID:     subcategoryID,
		ChannelID:         channelID,
		AccountID:         accountID,
		IsPaid:            isPaid,
	}, nil
}

func (r *CSVResolver) resolveCategory(ctx context.Context, name string) (string, error) {
	if name == "" {
		return "", fmt.Errorf("category name is required")
	}

	filter := categories.Filter{}
	list, err := r.categoriesService.ListCategories(ctx, filter)
	if err != nil {
		return "", err
	}
	for _, c := range list {
		if c.Name == name {
			return c.ID, nil
		}
	}

	return "", fmt.Errorf("category %q not found, create it first", name)
}

func (r *CSVResolver) resolveSubcategory(ctx context.Context, categoryName, subcategoryName string) (string, error) {
	if subcategoryName == "" {
		return "", nil
	}

	filter := categories.Filter{}
	list, err := r.categoriesService.ListSubcategories(ctx, filter)
	if err != nil {
		return "", err
	}
	for _, s := range list {
		if s.Name == subcategoryName {
			return s.ID, nil
		}
	}

	return "", fmt.Errorf("subcategory %q not found for category %q, create it first", subcategoryName, categoryName)
}

func (r *CSVResolver) resolveChannel(ctx context.Context, name string) (string, error) {
	if name == "" {
		return "", fmt.Errorf("channel name is required")
	}

	filter := channels.Filter{}
	list, err := r.channelsService.ListChannels(ctx, filter)
	if err != nil {
		return "", err
	}
	for _, c := range list {
		if c.Name == name {
			return c.ID, nil
		}
	}

	return "", fmt.Errorf("channel %q not found, create it first", name)
}

func (r *CSVResolver) resolveAccount(ctx context.Context, channelID, name string) (string, error) {
	if name == "" {
		return "", nil
	}

	filter := channels.Filter{}
	list, err := r.channelsService.ListAccounts(ctx, filter)
	if err != nil {
		return "", err
	}
	for _, a := range list {
		if a.Name == name && a.ChannelID == channelID {
			return a.ID, nil
		}
	}

	channelName := ""
	chans, _ := r.channelsService.ListChannels(ctx, filter)
	for _, c := range chans {
		if c.ID == channelID {
			channelName = c.Name
			break
		}
	}

	return "", fmt.Errorf("account %q not found for channel %q, create it first", name, channelName)
}

func (h *Handler) ParseTransactionCSV(ctx context.Context, body io.Reader, resolver *CSVResolver) ([]TransactionAggregateReq, error) {
	reader := csv.NewReader(body)

	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("%w: missing header", ErrInvalidCSV)
	}

	headerMap := make(map[string]int)
	for i, col := range header {
		headerMap[col] = i
	}

	requiredCols := []string{"description", "date", "type", "frequency", "amount", "currency", "category", "channel"}
	for _, col := range requiredCols {
		if _, ok := headerMap[col]; !ok {
			return nil, fmt.Errorf("%w: missing column %q", ErrInvalidCSV, col)
		}
	}

	var reqs []TransactionAggregateReq

	for lineNum := 2; ; lineNum++ {
		row, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("%w: line %d: %v", ErrInvalidCSV, lineNum, err)
		}

		req, err := parseTransactionCSVRow(ctx, row, headerMap, lineNum, resolver)
		if err != nil {
			return nil, err
		}

		reqs = append(reqs, req)
	}

	return reqs, nil
}

func parseTransactionCSVRow(ctx context.Context, row []string, headerMap map[string]int, lineNum int, resolver *CSVResolver) (TransactionAggregateReq, error) {
	getVal := func(col string) string {
		if idx, ok := headerMap[col]; ok && idx < len(row) {
			return row[idx]
		}
		return ""
	}

	csvReq := TransactionAggregateCSV{
		Description:  getVal("description"),
		Date:         getVal("date"),
		Type:         getVal("type"),
		Frequency:    getVal("frequency"),
		Installments: getVal("installments"),
		Amount:       getVal("amount"),
		Currency:     getVal("currency"),
		ExchangeRate: getVal("exchange_rate"),
		Category:     getVal("category"),
		Subcategory:  getVal("subcategory"),
		Channel:      getVal("channel"),
		Account:      getVal("account"),
		IsPaid:       getVal("is_paid"),
	}

	if csvReq.Description == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: description is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Date == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: date is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Type == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: type is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Frequency == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: frequency is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Amount == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: amount is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Currency == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: currency is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Category == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: category is required", ErrInvalidCSV, lineNum)
	}
	if csvReq.Channel == "" {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: channel is required", ErrInvalidCSV, lineNum)
	}

	req, err := resolver.Resolve(ctx, csvReq)
	if err != nil {
		return TransactionAggregateReq{}, fmt.Errorf("%w: line %d: %v", ErrInvalidCSV, lineNum, err)
	}

	return *req, nil
}
