package finance

import (
	"context"
	"fmt"

	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/historical"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/timeutils"
	"github.com/nnavales/summit/api/transactions"
)

type Service struct {
	repo     Repository
	histRepo historical.Repository
	clock    timeutils.Clock
}

func NewService(clock timeutils.Clock, repo Repository, histRepo historical.Repository) *Service {
	return &Service{
		repo:     repo,
		histRepo: histRepo,
		clock:    clock,
	}
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
	totalAmount, err := entries.ParseAmountToCents(req.Amount)
	if err != nil {
		return fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
	}

	var group *installments.InstallmentGroup
	if installmentCount > 1 {
		group = installments.NewInstallmentGroup(now, installmentCount, req.Description, req.Currency, totalAmount, req.Date)
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

		txDate := req.Date
		if i > 1 {
			txDate, err = req.Date.AddMonths(i - 1)
			if err != nil {
				return fmt.Errorf("failed to calculate installment date: %w", err)
			}
		}

		tx := transactions.NewTransaction(now, txDate, req.Type)

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

		entry := entries.NewEntry(now, tx.ID, req.ChannelID, amount, req.Currency, req.ExchangeRate)
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

	totalAmount, err := entries.ParseAmountToCents(req.Amount)
	if err != nil {
		return fmt.Errorf("parsing failed: %w: %w", err, ErrInvalidField)
	}

	var group *installments.InstallmentGroup
	if installmentCount > 1 {
		group = installments.NewInstallmentGroup(now, installmentCount, req.Description, req.Currency, totalAmount, req.Date)
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
		txDate := req.Date
		if i > 1 {
			txDate, err = req.Date.AddMonths(i - 1)
			if err != nil {
				return fmt.Errorf("failed to calculate installment date: %w", err)
			}
		}

		tx := transactions.NewTransaction(now, txDate, req.Type)

		if cutoff != nil && timeutils.IsSameOrBeforeMonth(txDate.Time, cutoff.Time) {
			return fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
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

		amount := baseAmount
		if i == installmentCount {
			amount += remainder
		}

		entry := entries.NewEntry(now, tx.ID, req.ChannelID, amount, req.Currency, req.ExchangeRate)
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
