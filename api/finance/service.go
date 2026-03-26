package finance

import (
	"context"
	"fmt"

	"github.com/nnavales/summit/api/timeutils"
)

type Service struct {
	repo  Repository
	clock timeutils.Clock
}

func NewService(clock timeutils.Clock, repo Repository) *Service {
	return &Service{
		repo:  repo,
		clock: clock,
	}
}

func (s *Service) CreateTransaction(ctx context.Context, req TransactionReq) (*Transaction, error) {
	now := s.clock.Now()
	t := NewTransaction(now, *req.Date, *req.Type)

	if req.Description != nil {
		t.SetDescription(*req.Description)
	}
	if req.Frequency != nil {
		t.SetFrequency(*req.Frequency)
	}
	if req.InstallmentGroupID != nil {
		t.SetInstallmentGroupID(*req.InstallmentGroupID)
	}
	if req.InstallmentNumber != nil {
		t.SetInstallmentNumber(*req.InstallmentNumber)
	}

	created, err := s.repo.CreateTransaction(ctx, *t)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}
	return created, nil
}

func (s *Service) GetTransaction(ctx context.Context, id string) (*Transaction, error) {
	tx, err := s.repo.GetTransactionByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}
	return tx, nil
}

func (s *Service) ListTransactions(ctx context.Context) ([]Transaction, error) {
	txs, err := s.repo.ListTransactions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list transactions: %w", err)
	}
	return txs, nil
}

func (s *Service) UpdateTransaction(ctx context.Context, id string, req TransactionReq) (*Transaction, error) {
	t, err := s.repo.GetTransactionByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction for update: %w", err)
	}

	now := s.clock.Now()
	if req.Date != nil {
		t.Date = *req.Date
	}
	if req.Description != nil {
		t.SetDescription(*req.Description)
	}
	if req.Type != nil {
		t.Type = *req.Type
	}
	if req.Frequency != nil {
		t.SetFrequency(*req.Frequency)
	}
	if req.InstallmentGroupID != nil {
		t.SetInstallmentGroupID(*req.InstallmentGroupID)
	}
	if req.InstallmentNumber != nil {
		t.SetInstallmentNumber(*req.InstallmentNumber)
	}
	if req.IsDeleted != nil {
		t.SetDeleted(now, *req.IsDeleted)
	}

	t.Touch(now)

	updated, err := s.repo.UpdateTransaction(ctx, *t)
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteTransaction(ctx context.Context, id string) error {
	err := s.repo.DeleteTransaction(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete transaction: %w", err)
	}
	return nil
}

func (s *Service) CreateEntry(ctx context.Context, req EntryReq) (*Entry, error) {
	if req.AccountID == nil || req.TransactionID == nil {
		return nil, fmt.Errorf("account_id and transaction_id are required")
	}

	now := s.clock.Now()
	var amountARS, amountUSD int64
	var exchangeRate float64

	if req.ExchangeRate == nil {
		dolars, err := GetExchangeRate()
		if err != nil {
			return nil, err
		}
		rates := ToRateMap(dolars)
		officialRate, ok := rates.Get(RateOficial)
		if !ok {
			return nil, fmt.Errorf("exchange rate %v: not found", RateOficial)
		}
		exchangeRate = officialRate.Sell
	} else {
		exchangeRate = *req.ExchangeRate
	}

	if req.Currency != nil && req.Amount != nil {
		switch *req.Currency {
		case CurrencyARS:
			amountARS = *req.Amount
			amountUSD = *req.Amount / int64(exchangeRate)

		case CurrencyUSD:
			amountUSD = *req.Amount
			amountARS = *req.Amount * int64(exchangeRate)
		}
	}

	e := NewEntry(now, *req.TransactionID, *req.AccountID, amountARS, amountUSD, exchangeRate)

	if req.CategoryID != nil {
		e.SetCategoryID(*req.CategoryID)
	}
	if req.SubcategoryID != nil {
		e.SetSubcategoryID(*req.SubcategoryID)
	}

	created, err := s.repo.CreateEntry(ctx, *e)
	if err != nil {
		return nil, fmt.Errorf("failed to create entry: %w", err)
	}
	return created, nil
}

func (s *Service) GetEntry(ctx context.Context, id string) (*Entry, error) {
	e, err := s.repo.GetEntryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get entry: %w", err)
	}
	return e, nil
}

func (s *Service) ListEntries(ctx context.Context) ([]Entry, error) {
	entries, err := s.repo.ListEntries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list entries: %w", err)
	}
	return entries, nil
}

func (s *Service) UpdateEntry(ctx context.Context, id string, req EntryReq) (*Entry, error) {
	e, err := s.repo.GetEntryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get entry for update: %w", err)
	}

	now := s.clock.Now()
	e.Touch(now)

	if req.AccountID != nil {
		e.AccountID = *req.AccountID
	}
	if req.TransactionID != nil {
		e.TransactionID = *req.TransactionID
	}
	if req.Amount != nil {
		e.AmountARS = *req.Amount
	}
	if req.ExchangeRate != nil {
		e.ExchangeRate = *req.ExchangeRate
	}
	if req.CategoryID != nil {
		e.SetCategoryID(*req.CategoryID)
	}
	if req.SubcategoryID != nil {
		e.SetSubcategoryID(*req.SubcategoryID)
	}
	if req.IsDeleted != nil {
		e.SetDeleted(now, *req.IsDeleted)
	}

	updated, err := s.repo.UpdateEntry(ctx, *e)
	if err != nil {
		return nil, fmt.Errorf("failed to update entry: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteEntry(ctx context.Context, id string) error {
	err := s.repo.DeleteEntry(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete entry: %w", err)
	}
	return nil
}

func (s *Service) CreateChannel(ctx context.Context, req ChannelReq) (*Channel, error) {
	if req.Name == nil {
		return nil, fmt.Errorf("name is required")
	}

	now := s.clock.Now()
	c := NewChannel(now, *req.Name)

	created, err := s.repo.CreateChannel(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to create channel: %w", err)
	}
	return created, nil
}

func (s *Service) GetChannel(ctx context.Context, id string) (*Channel, error) {
	c, err := s.repo.GetChannelByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel: %w", err)
	}
	return c, nil
}

func (s *Service) ListChannels(ctx context.Context) ([]Channel, error) {
	channels, err := s.repo.ListChannels(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list channels: %w", err)
	}
	return channels, nil
}

func (s *Service) UpdateChannel(ctx context.Context, id string, req ChannelReq) (*Channel, error) {
	c, err := s.repo.GetChannelByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel for update: %w", err)
	}

	now := s.clock.Now()
	c.Touch(now)

	if req.Name != nil {
		c.Name = *req.Name
	}
	if req.IsDeleted != nil {
		c.SetDeleted(now, *req.IsDeleted)
	}

	updated, err := s.repo.UpdateChannel(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to update channel: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteChannel(ctx context.Context, id string) error {
	err := s.repo.DeleteChannel(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete channel: %w", err)
	}
	return nil
}

func (s *Service) CreateAccount(ctx context.Context, req AccountReq) (*Account, error) {
	if req.ChannelID == nil || req.Name == nil || req.Instrument == nil {
		return nil, fmt.Errorf("channel_id, name, and instrument are required")
	}

	now := s.clock.Now()
	a := NewAccount(now, *req.ChannelID, *req.Name, *req.Instrument)

	if req.LastFour != nil {
		a.SetLastFour(*req.LastFour)
	}

	created, err := s.repo.CreateAccount(ctx, *a)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}
	return created, nil
}

func (s *Service) GetAccount(ctx context.Context, id string) (*Account, error) {
	a, err := s.repo.GetAccountByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	return a, nil
}

func (s *Service) ListAccounts(ctx context.Context) ([]Account, error) {
	accounts, err := s.repo.ListAccounts(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list accounts: %w", err)
	}
	return accounts, nil
}

func (s *Service) UpdateAccount(ctx context.Context, id string, req AccountReq) (*Account, error) {
	a, err := s.repo.GetAccountByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get account for update: %w", err)
	}

	now := s.clock.Now()
	a.Touch(now)

	if req.ChannelID != nil {
		a.ChannelID = *req.ChannelID
	}
	if req.Name != nil {
		a.Name = *req.Name
	}
	if req.Instrument != nil {
		a.Instrument = *req.Instrument
	}
	if req.LastFour != nil {
		a.SetLastFour(*req.LastFour)
	}
	if req.IsDeleted != nil {
		a.SetDeleted(now, *req.IsDeleted)
	}

	updated, err := s.repo.UpdateAccount(ctx, *a)
	if err != nil {
		return nil, fmt.Errorf("failed to update account: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteAccount(ctx context.Context, id string) error {
	err := s.repo.DeleteAccount(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete account: %w", err)
	}
	return nil
}

func (s *Service) CreateCategory(ctx context.Context, req CategoryReq) (*Category, error) {
	if req.Name == nil {
		return nil, fmt.Errorf("name is required")
	}

	now := s.clock.Now()
	c := NewCategory(now, *req.Name)

	created, err := s.repo.CreateCategory(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}
	return created, nil
}

func (s *Service) GetCategory(ctx context.Context, id string) (*Category, error) {
	c, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	return c, nil
}

func (s *Service) ListCategories(ctx context.Context) ([]Category, error) {
	categories, err := s.repo.ListCategories(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	return categories, nil
}

func (s *Service) UpdateCategory(ctx context.Context, id string, req CategoryReq) (*Category, error) {
	c, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get category for update: %w", err)
	}

	now := s.clock.Now()
	c.Touch(now)

	if req.Name != nil {
		c.Name = *req.Name
	}
	if req.IsDeleted != nil {
		c.SetDeleted(now, *req.IsDeleted)
	}

	updated, err := s.repo.UpdateCategory(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteCategory(ctx context.Context, id string) error {
	err := s.repo.DeleteCategory(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

func (s *Service) CreateSubcategory(ctx context.Context, req SubcategoryReq) (*Subcategory, error) {
	if req.CategoryID == nil || req.Name == nil {
		return nil, fmt.Errorf("category_id and name are required")
	}

	now := s.clock.Now()
	sd := NewSubcategory(now, *req.CategoryID, *req.Name)

	created, err := s.repo.CreateSubcategory(ctx, *sd)
	if err != nil {
		return nil, fmt.Errorf("failed to create subcategory: %w", err)
	}
	return created, nil
}

func (s *Service) GetSubcategory(ctx context.Context, id string) (*Subcategory, error) {
	sd, err := s.repo.GetSubcategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get subcategory: %w", err)
	}
	return sd, nil
}

func (s *Service) ListSubcategories(ctx context.Context) ([]Subcategory, error) {
	subcategories, err := s.repo.ListSubcategories(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list subcategories: %w", err)
	}
	return subcategories, nil
}

func (s *Service) UpdateSubcategory(ctx context.Context, id string, req SubcategoryReq) (*Subcategory, error) {
	sd, err := s.repo.GetSubcategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get subcategory for update: %w", err)
	}

	now := s.clock.Now()
	sd.Touch(now)

	if req.CategoryID != nil {
		sd.CategoryID = *req.CategoryID
	}
	if req.Name != nil {
		sd.Name = *req.Name
	}
	if req.IsDeleted != nil {
		sd.SetDeleted(now, *req.IsDeleted)
	}

	updated, err := s.repo.UpdateSubcategory(ctx, *sd)
	if err != nil {
		return nil, fmt.Errorf("failed to update subcategory: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteSubcategory(ctx context.Context, id string) error {
	err := s.repo.DeleteSubcategory(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete subcategory: %w", err)
	}
	return nil
}

func (s *Service) CreateInstallmentGroup(ctx context.Context, req InstallmentGroupReq) (*InstallmentGroup, error) {
	if req.TotalInstallments == nil || req.StartDate == nil {
		return nil, fmt.Errorf("total_installments and start_date are required")
	}

	now := s.clock.Now()
	ig := NewInstallmentGroup(now, *req.TotalInstallments, *req.StartDate)

	created, err := s.repo.CreateInstallmentGroup(ctx, *ig)
	if err != nil {
		return nil, fmt.Errorf("failed to create installment group: %w", err)
	}
	return created, nil
}

func (s *Service) GetInstallmentGroup(ctx context.Context, id string) (*InstallmentGroup, error) {
	ig, err := s.repo.GetInstallmentGroupByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get installment group: %w", err)
	}
	return ig, nil
}

func (s *Service) ListInstallmentGroups(ctx context.Context) ([]InstallmentGroup, error) {
	groups, err := s.repo.ListInstallmentGroups(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list installment groups: %w", err)
	}
	return groups, nil
}

func (s *Service) UpdateInstallmentGroup(ctx context.Context, id string, req InstallmentGroupReq) (*InstallmentGroup, error) {
	ig, err := s.repo.GetInstallmentGroupByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get installment group for update: %w", err)
	}

	now := s.clock.Now()
	if req.TotalInstallments != nil {
		ig.TotalInstallments = *req.TotalInstallments
	}
	if req.StartDate != nil {
		ig.StartDate = *req.StartDate
	}
	if req.IsDeleted != nil {
		ig.SetDeleted(now, *req.IsDeleted)
	}
	ig.Touch(now)

	updated, err := s.repo.UpdateInstallmentGroup(ctx, *ig)
	if err != nil {
		return nil, fmt.Errorf("failed to update installment group: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteInstallmentGroup(ctx context.Context, id string) error {
	err := s.repo.DeleteInstallmentGroup(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete installment group: %w", err)
	}
	return nil
}
