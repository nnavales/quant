package finance

import (
	"context"
	"fmt"

	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/installments"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
)

type Service struct {
	repo            Repository
	histRepo        historical.Repository
	installmentRepo installments.Repository
	clock           timeutils.Clock
}

func NewService(clock timeutils.Clock, repo Repository, histRepo historical.Repository, installmentRepo installments.Repository) *Service {
	return &Service{
		repo:            repo,
		histRepo:        histRepo,
		installmentRepo: installmentRepo,
		clock:           clock,
	}
}

func (s *Service) CreateTransactionAggregate(ctx context.Context, req TransactionAggregateReq) (*TransactionRowDTO, error) {
	now := s.clock.Now()

	if req.Amount == "" {
		return nil, fmt.Errorf("amount is required: %w", ErrInvalidField)
	}
	if req.ChannelID == "" {
		return nil, fmt.Errorf("channel_id is required: %w", ErrInvalidField)
	}
	if req.Currency == "" {
		return nil, fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	installmentCount := 1
	if req.InstallmentNumber != nil && *req.InstallmentNumber > 0 {
		installmentCount = *req.InstallmentNumber
	}
	totalAmount, err := money.ParseAmountToCents(req.Amount)
	if err != nil {
		return nil, fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
	}

	var group *installments.InstallmentGroup
	if installmentCount > 1 {
		group = installments.NewInstallmentGroup(now, installmentCount, req.Description, req.Currency, money.Money(totalAmount), req.Date)
		if err := group.Validate(); err != nil {
			return nil, fmt.Errorf("invalid installment group: %w", err)
		}
	}

	items := make([]struct {
		Transaction transactions.Transaction
		Entry       entries.Entry
	}, 0, installmentCount)

	baseAmount := totalAmount / int64(installmentCount)
	remainder := totalAmount % int64(installmentCount)

	cutoff, err := s.histRepo.GetCutOff(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get cutoff: %w", err)
	}

	for i := 1; i <= installmentCount; i++ {
		installmentNum := i

		txDate := req.Date
		if i > 1 {
			txDate, err = req.Date.AddMonths(i - 1)
			if err != nil {
				return nil, fmt.Errorf("failed to calculate installment date: %w", err)
			}
		}

		tx := transactions.NewTransaction(now, txDate, req.Type)

		if req.Description != "" {
			tx.SetDescription(req.Description)
		}
		if req.Frequency != "" {
			tx.SetFrequency(req.Frequency)
		}
		if req.IsPaid != nil {
			tx.SetIsPaid(*req.IsPaid)
		}

		if group != nil {
			tx.SetInstallmentGroupID(group.ID)
			tx.SetInstallmentNumber(installmentNum)
		}

		if err := tx.Validate(); err != nil {
			return nil, fmt.Errorf("invalid transaction: %w", err)
		}

		amount := baseAmount
		if i == installmentCount {
			amount += remainder
		}

		entry := entries.NewEntry(now, tx.ID, req.ChannelID, money.Money(amount), req.Currency, req.ExchangeRate)
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
			return nil, fmt.Errorf("invalid entry: %w", err)
		}

		if cutoff != nil && timeutils.IsSameOrBeforeMonth(txDate.Time, cutoff.Time) {
			return nil, fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
		}

		items = append(items, struct {
			Transaction transactions.Transaction
			Entry       entries.Entry
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
		return nil, fmt.Errorf("failed to create transaction aggregate: %w", err)
	}

	return s.repo.GetTransactionAggregate(ctx, agg.Items[0].Transaction.ID)
}

func (s *Service) ListTransactionsAggregate(ctx context.Context, filter *Filter) (*TransactionListResponse, error) {
	rows, err := s.repo.ListTransactionsAggregate(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list transaction aggregates: %w", err)
	}
	return rows, nil
}

func (s *Service) ListTransactionIDs(ctx context.Context, filter *Filter) ([]TransactionIDAmount, error) {
	rows, err := s.repo.ListTransactionIDs(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list transaction ids: %w", err)
	}
	return rows, nil
}

func (s *Service) ListTransactionsByInstallmentGroups(ctx context.Context) ([]InstallmentRowDTO, error) {
	installmentGroups, err := s.installmentRepo.ListInstallmentGroups(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get installment groups: %w", err)
	}

	installmentRows := make([]InstallmentRowDTO, 0)
	for _, group := range installmentGroups {
		var groupTxs InstallmentRowDTO
		groupTxs.ID = group.ID
		txs, err := s.repo.GetTransactionsByInstallmentGroup(ctx, groupTxs.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get transactions for installment group %s: %w", groupTxs.ID, err)
		}
		if len(txs) == 0 {
			continue
		}

		txBase := txs[0]
		txEnd := txs[len(txs)-1]

		groupTxs.AccountID = txBase.AccountID
		groupTxs.CategoryID = txBase.CategoryID
		groupTxs.SubcategoryID = txBase.SubcategoryID
		groupTxs.ChannelID = txBase.ChannelName

		groupTxs.AccountName = txBase.AccountName
		groupTxs.CategoryName = txBase.CategoryName
		groupTxs.SubcategoryName = txBase.SubcategoryName
		groupTxs.ChannelName = txBase.ChannelName

		groupTxs.Type = txBase.Type
		groupTxs.Frequency = txBase.Frequency
		groupTxs.Description = txBase.Description
		groupTxs.TotalInstallments = txBase.TotalInstallments
		groupTxs.TotalAmount = *txBase.OriginalAmount
		groupTxs.IsCanceled = txBase.IsCanceled
		groupTxs.Currency = txBase.Currency
		groupTxs.ExchangeRate = txBase.ExchangeRate

		groupTxs.StartDate = txBase.Date
		groupTxs.EndDate = txEnd.Date

		groupTxs.Installments = txs

		installmentRows = append(installmentRows, groupTxs)
	}

	return installmentRows, nil
}

func (s *Service) GetTransactionsByInstallmentGroup(ctx context.Context, id string) ([]TransactionRowDTO, error) {
	rows, err := s.repo.GetTransactionsByInstallmentGroup(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions from installment group: %w", err)
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

func (s *Service) UpdateTransactionAggregate(ctx context.Context, id string, req TransactionAggregateReq) (*TransactionRowDTO, error) {
	now := s.clock.Now()

	if req.Amount == "" {
		return nil, fmt.Errorf("amount is required: %w", ErrInvalidField)
	}
	if req.ChannelID == "" {
		return nil, fmt.Errorf("channel_id is required: %w", ErrInvalidField)
	}
	if req.Currency == "" {
		return nil, fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	installmentCount := 1
	if req.InstallmentNumber != nil && *req.InstallmentNumber > 0 {
		installmentCount = *req.InstallmentNumber
	}

	totalAmount, err := money.ParseAmountToCents(req.Amount)
	if err != nil {
		return nil, fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
	}

	var group *installments.InstallmentGroup
	if installmentCount > 1 {
		group = installments.NewInstallmentGroup(now, installmentCount, req.Description, req.Currency, money.Money(totalAmount), req.Date)
		if err := group.Validate(); err != nil {
			return nil, fmt.Errorf("invalid installment group: %w", err)
		}
	}

	items := make([]struct {
		Transaction transactions.Transaction
		Entry       entries.Entry
	}, 0, installmentCount)

	baseAmount := totalAmount / int64(installmentCount)
	remainder := totalAmount % int64(installmentCount)

	cutoff, err := s.histRepo.GetCutOff(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get cutoff: %w", err)
	}

	for i := 1; i <= installmentCount; i++ {
		txDate := req.Date
		if i > 1 {
			txDate, err = req.Date.AddMonths(i - 1)
			if err != nil {
				return nil, fmt.Errorf("failed to calculate installment date: %w", err)
			}
		}

		tx := transactions.NewTransaction(now, txDate, req.Type)

		if cutoff != nil && timeutils.IsSameOrBeforeMonth(txDate.Time, cutoff.Time) {
			return nil, fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
		}

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

		if err := tx.Validate(); err != nil {
			return nil, fmt.Errorf("invalid transaction: %w", err)
		}

		amount := baseAmount
		if i == installmentCount {
			amount += remainder
		}

		entry := entries.NewEntry(now, tx.ID, req.ChannelID, money.Money(amount), req.Currency, req.ExchangeRate)
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
			return nil, fmt.Errorf("invalid entry: %w", err)
		}

		items = append(items, struct {
			Transaction transactions.Transaction
			Entry       entries.Entry
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
		return nil, fmt.Errorf("failed to update transaction aggregate: %w", err)
	}

	return s.repo.GetTransactionAggregate(ctx, id)
}

func (s *Service) CancelInstallments(ctx context.Context, req CancelInstallmentsReq) error {
	if req.InstallmentGroupID == "" {
		return fmt.Errorf("installment_group_id is required: %w", ErrInvalidField)
	}
	if req.FromInstallment <= 0 {
		return fmt.Errorf("from_installment must be greater than 0: %w", ErrInvalidField)
	}

	now := s.clock.Now()
	if err := s.repo.CancelInstallments(ctx, req.InstallmentGroupID, req.FromInstallment, now); err != nil {
		return fmt.Errorf("failed to cancel installments: %w", err)
	}

	return nil
}

func (s *Service) ListHistoricalEntries(ctx context.Context, filter *Filter) (*HistoricalListResponse, error) {
	rows, err := s.repo.ListHistoricalEntries(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list historical entries: %w", err)
	}
	return rows, nil
}

func (s *Service) BulkCreateTransactionAggregate(ctx context.Context, req BulkTransactionReq) error {
	now := s.clock.Now()

	txAggs := make([]TransactionAggregate, 0)
	for _, r := range req.Data {
		if r.Amount == "" {
			return fmt.Errorf("amount is required: %w", ErrInvalidField)
		}
		if r.ChannelID == "" {
			return fmt.Errorf("channel_id is required: %w", ErrInvalidField)
		}
		if r.Currency == "" {
			return fmt.Errorf("currency is required: %w", ErrInvalidField)
		}

		installmentCount := 1
		if r.InstallmentNumber != nil && *r.InstallmentNumber > 0 {
			installmentCount = *r.InstallmentNumber
		}
		totalAmount, err := money.ParseAmountToCents(r.Amount)
		if err != nil {
			return fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
		}

		var group *installments.InstallmentGroup
		if installmentCount > 1 {
			group = installments.NewInstallmentGroup(now, installmentCount, r.Description, r.Currency, money.Money(totalAmount), r.Date)
			if err := group.Validate(); err != nil {
				return fmt.Errorf("invalid installment group: %w", err)
			}
		}

		items := make([]struct {
			Transaction transactions.Transaction
			Entry       entries.Entry
		}, 0, installmentCount)

		baseAmount := totalAmount / int64(installmentCount)
		remainder := totalAmount % int64(installmentCount)

		cutoff, err := s.histRepo.GetCutOff(ctx)
		if err != nil {
			return fmt.Errorf("failed to get cutoff: %w", err)
		}

		for i := 1; i <= installmentCount; i++ {
			installmentNum := i

			txDate := r.Date
			if i > 1 {
				txDate, err = r.Date.AddMonths(i - 1)
				if err != nil {
					return fmt.Errorf("failed to calculate installment date: %w", err)
				}
			}

			tx := transactions.NewTransaction(now, txDate, r.Type)

			if r.Description != "" {
				tx.SetDescription(r.Description)
			}
			if r.Frequency != "" {
				tx.SetFrequency(r.Frequency)
			}
			if group != nil {
				tx.SetInstallmentGroupID(group.ID)
				tx.SetInstallmentNumber(installmentNum)
			}

			if r.IsPaid != nil {
				tx.SetIsPaid(*r.IsPaid)
			}

			if err := tx.Validate(); err != nil {
				return fmt.Errorf("invalid transaction: %w", err)
			}

			amount := baseAmount
			if i == installmentCount {
				amount += remainder
			}

			entry := entries.NewEntry(now, tx.ID, r.ChannelID, money.Money(amount), r.Currency, r.ExchangeRate)
			if r.CategoryID != "" {
				entry.SetCategoryID(r.CategoryID)
			}
			if r.SubcategoryID != "" {
				entry.SetSubcategoryID(r.SubcategoryID)
			}
			if r.AccountID != "" {
				entry.SetAccountID(r.AccountID)
			}

			if err := entry.Validate(); err != nil {
				return fmt.Errorf("invalid entry: %w", err)
			}

			if cutoff != nil && timeutils.IsSameOrBeforeMonth(txDate.Time, cutoff.Time) {
				return fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
			}

			items = append(items, struct {
				Transaction transactions.Transaction
				Entry       entries.Entry
			}{
				Transaction: *tx,
				Entry:       *entry,
			})
		}

		agg := TransactionAggregate{
			Group: group,
			Items: items,
		}

		txAggs = append(txAggs, agg)

	}

	if err := s.repo.BulkCreateTransactionAggregate(ctx, txAggs); err != nil {
		return fmt.Errorf("failed to create transaction aggregate: %w", err)
	}

	return nil
}

func (s *Service) BulkDeleteTransactionAggregate(ctx context.Context, ids []string) error {
	if err := s.repo.BulkDeleteTransactionAggregate(ctx, ids); err != nil {
		return fmt.Errorf("failed to bulk delete transaction aggregate: %w", err)
	}
	return nil
}
