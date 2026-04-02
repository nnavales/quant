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

	if err := t.Validate(); err != nil {
		return nil, fmt.Errorf("invalid transaction: %w", err)
	}

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

	if req.ChannelID != nil {
		e.ChannelID = *req.ChannelID
	}
	if req.AccountID != nil {
		e.AccountID = req.AccountID
	}
	if req.TransactionID != nil {
		e.TransactionID = *req.TransactionID
	}
	if req.Amount != nil {
		amount, err := ParseAmountToCents(*req.Amount)
		if err != nil {
			return nil, fmt.Errorf("parsing failed: %w:  %w", err, ErrInvalidField)
		}
		e.Amount = amount
	}

	if req.Currency != nil {
		e.Currency = *req.Currency
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

	if err := e.Validate(); err != nil {
		return nil, fmt.Errorf("invalid entry: %w", err)
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

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid channel: %w", err)
	}

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

func (s *Service) ListChannelsWithAccounts(ctx context.Context) ([]ChannelWithAccounts, error) {
	channels, err := s.repo.ListChannelsWithAccounts(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list channels with accounts: %w", err)
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

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid channel: %w", err)
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

	if err := a.Validate(); err != nil {
		return nil, fmt.Errorf("invalid account: %w", err)
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

	if err := a.Validate(); err != nil {
		return nil, fmt.Errorf("invalid account: %w", err)
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

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid category: %w", err)
	}

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

func (s *Service) ListCategoriesWithSubcategories(ctx context.Context) ([]CategoryWithSubcategories, error) {
	categories, err := s.repo.ListCategoriesWithSubcategories(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories with subcategories: %w", err)
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

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid category: %w", err)
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

	if err := sd.Validate(); err != nil {
		return nil, fmt.Errorf("invalid subcategory: %w", err)
	}

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

	if err := sd.Validate(); err != nil {
		return nil, fmt.Errorf("invalid subcategory: %w", err)
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

	if err := ig.Validate(); err != nil {
		return nil, fmt.Errorf("invalid installment group: %w", err)
	}

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

func (s *Service) CreateTransactionAggregate(ctx context.Context, req TransactionAggregateReq) error {
	now := s.clock.Now()

	if req.Amount == "" {
		return fmt.Errorf("amount is required: %w", ErrInvalidField)
	}
	if req.ChannelID == "" {
		return fmt.Errorf("channel_id is required: %w", ErrInvalidField)
	}
	if req.Currency == "" {
		return fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	installmentCount := 1
	if req.InstallmentNumber != nil && *req.InstallmentNumber > 0 {
		installmentCount = *req.InstallmentNumber
	}

	var group *InstallmentGroup
	if installmentCount > 1 {
		group = NewInstallmentGroup(now, installmentCount, req.Date)
		if err := group.Validate(); err != nil {
			return fmt.Errorf("invalid installment group: %w", err)
		}
	}

	items := make([]struct {
		Transaction Transaction
		Entry       Entry
	}, 0, installmentCount)

	totalAmount, err := ParseAmountToCents(req.Amount)
	if err != nil {
		return fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
	}

	baseAmount := totalAmount / int64(installmentCount)
	remainder := totalAmount % int64(installmentCount)

	for i := 1; i <= installmentCount; i++ {
		installmentNum := i

		txDate := req.Date
		if i > 1 {
			txDate, err = req.Date.AddMonths(i - 1)
			if err != nil {
				return fmt.Errorf("failed to calculate installment date: %w", err)
			}
		}

		tx := NewTransaction(now, txDate, req.Type)

		if req.Description != "" {
			tx.SetDescription(req.Description)
		}
		if req.Frequency != "" {
			tx.SetFrequency(req.Frequency)
		}
		if group != nil {
			tx.SetInstallmentGroupID(group.ID)
			tx.SetInstallmentNumber(installmentNum)
		}

		if err := tx.Validate(); err != nil {
			return fmt.Errorf("invalid transaction: %w", err)
		}

		amount := baseAmount
		if i == installmentCount {
			amount += remainder
		}

		entry := NewEntry(now, tx.ID, req.ChannelID, amount, req.Currency, req.ExchangeRate)
		if req.CategoryID != "" {
			entry.SetCategoryID(req.CategoryID)
		}
		if req.SubcategoryID != "" {
			entry.SetSubcategoryID(req.SubcategoryID)
		}
		if req.AccountID != "" {
			entry.SetAccountID(req.AccountID)
		}

		if err := entry.Validate(); err != nil {
			return fmt.Errorf("invalid entry: %w", err)
		}

		items = append(items, struct {
			Transaction Transaction
			Entry       Entry
		}{
			Transaction: *tx,
			Entry:       *entry,
		})
	}

	agg := TransactionAggregate{
		Group: group,
		Items: items,
	}

	if err := s.repo.CreateTransactionAggregate(ctx, agg); err != nil {
		return fmt.Errorf("failed to create transaction aggregate: %w", err)
	}

	return nil
}

func (s *Service) ListTransactionsAggregate(ctx context.Context, filter *Filter) (*TransactionListResponse, error) {
	rows, err := s.repo.ListTransactionsAggregate(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list transaction aggregates: %w", err)
	}
	return rows, nil
}

func (s *Service) GetTransactionAggregate(ctx context.Context, id string) (*TransactionRowDTO, error) {
	row, err := s.repo.GetTransactionAggregate(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction aggregate: %w", err)
	}
	return row, nil
}

func (s *Service) DeleteTransactionAggregate(ctx context.Context, id string) error {
	if err := s.repo.DeleteTransactionAggregate(ctx, id); err != nil {
		return fmt.Errorf("failed to delete transaction aggregate: %w", err)
	}
	return nil
}

func (s *Service) UpdateTransactionAggregate(ctx context.Context, id string, req TransactionAggregateReq) error {
	now := s.clock.Now()

	if req.Amount == "" {
		return fmt.Errorf("amount is required: %w", ErrInvalidField)
	}
	if req.ChannelID == "" {
		return fmt.Errorf("channel_id is required: %w", ErrInvalidField)
	}
	if req.Currency == "" {
		return fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	installmentCount := 1
	if req.InstallmentNumber != nil && *req.InstallmentNumber > 0 {
		installmentCount = *req.InstallmentNumber
	}

	var group *InstallmentGroup
	if installmentCount > 1 {
		group = NewInstallmentGroup(now, installmentCount, req.Date)
		if err := group.Validate(); err != nil {
			return fmt.Errorf("invalid installment group: %w", err)
		}
	}

	items := make([]struct {
		Transaction Transaction
		Entry       Entry
	}, 0, installmentCount)

	totalAmount, err := ParseAmountToCents(req.Amount)
	if err != nil {
		return fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
	}

	baseAmount := totalAmount / int64(installmentCount)
	remainder := totalAmount % int64(installmentCount)

	for i := 1; i <= installmentCount; i++ {
		txDate := req.Date
		if i > 1 {
			txDate, err = req.Date.AddMonths(i - 1)
			if err != nil {
				return fmt.Errorf("failed to calculate installment date: %w", err)
			}
		}

		tx := NewTransaction(now, txDate, req.Type)

		if req.Description != "" {
			tx.SetDescription(req.Description)
		}
		if req.Frequency != "" {
			tx.SetFrequency(req.Frequency)
		}
		if group != nil {
			tx.SetInstallmentGroupID(group.ID)
			tx.SetInstallmentNumber(i)
		}

		amount := baseAmount
		if i == installmentCount {
			amount += remainder
		}

		entry := NewEntry(now, tx.ID, req.ChannelID, amount, req.Currency, req.ExchangeRate)
		if req.CategoryID != "" {
			entry.SetCategoryID(req.CategoryID)
		}
		if req.SubcategoryID != "" {
			entry.SetSubcategoryID(req.SubcategoryID)
		}
		if req.AccountID != "" {
			entry.SetAccountID(req.AccountID)
		}

		items = append(items, struct {
			Transaction Transaction
			Entry       Entry
		}{
			Transaction: *tx,
			Entry:       *entry,
		})
	}

	agg := TransactionAggregate{
		Group: group,
		Items: items,
	}

	if err := s.repo.UpdateTransactionAggregate(ctx, id, agg); err != nil {
		return fmt.Errorf("failed to update transaction aggregate: %w", err)
	}

	return nil
}

func (s *Service) CancelInstallments(ctx context.Context, req CancelInstallmentsReq) error {
	if req.InstallmentGroupID == "" {
		return fmt.Errorf("installment_group_id is required: %w", ErrInvalidField)
	}
	if req.FromInstallment <= 0 {
		return fmt.Errorf("from_installment must be greater than 0: %w", ErrInvalidField)
	}

	transactions, err := s.repo.GetTransactionsByInstallmentGroup(ctx, req.InstallmentGroupID, req.FromInstallment)
	if err != nil {
		return fmt.Errorf("failed to get transactions: %w", err)
	}

	if len(transactions) == 0 {
		return fmt.Errorf("no transactions found: %w", ErrNotFound)
	}

	var totalCents int64
	var firstTx *TransactionRowDTO
	for i := range transactions {
		tx := &transactions[i]
		amountCents, err := ParseAmountToCents(tx.Amount)
		if err != nil {
			return fmt.Errorf("failed to parse amount: %w", err)
		}
		totalCents += amountCents
		if i == 0 {
			firstTx = tx
		}
	}

	now := s.clock.Now()
	tx := NewTransaction(now, firstTx.Date, firstTx.Type)
	tx.SetDescription("Cancelación de cuotas")

	entry := NewEntry(now, tx.ID, firstTx.ChannelID, totalCents, firstTx.Currency, firstTx.ExchangeRate)
	entry.SetCategoryID(*firstTx.CategoryID)
	if firstTx.SubcategoryID != nil {
		entry.SetSubcategoryID(*firstTx.SubcategoryID)
	}
	if firstTx.AccountID != nil {
		entry.SetAccountID(*firstTx.AccountID)
	}

	if err := tx.Validate(); err != nil {
		return fmt.Errorf("invalid transaction: %w", err)
	}
	if err := entry.Validate(); err != nil {
		return fmt.Errorf("invalid entry: %w", err)
	}

	agg := TransactionAggregate{
		Items: []struct {
			Transaction Transaction
			Entry       Entry
		}{
			{
				Transaction: *tx,
				Entry:       *entry,
			},
		},
	}

	if err := s.repo.CancelInstallments(ctx, agg, req.InstallmentGroupID, req.FromInstallment); err != nil {
		return fmt.Errorf("failed to cancel installments: %w", err)
	}

	return nil
}
