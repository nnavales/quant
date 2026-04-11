package historical

import (
	"context"
	"fmt"

	"github.com/nnavales/summit/api/timeutils"
	"github.com/nnavales/summit/api/transactions"
)

type Service struct {
	repo   Repository
	txRepo transactions.Repository
	clock  timeutils.Clock
}

func NewService(clock timeutils.Clock, repo Repository, txRepo transactions.Repository) *Service {
	return &Service{
		repo:   repo,
		txRepo: txRepo,
		clock:  clock,
	}
}

func (s *Service) CreateHistoricalEntry(ctx context.Context, req HistoricalFinanceReq) (*HistoricalEntry, error) {
	entry, err := req.ToEntry(s.clock)
	if err != nil {
		return nil, fmt.Errorf("failed to convert request to entry: %w", err)
	}

	cutoff, err := s.txRepo.GetMinTransactionDate(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get cutoff: %w", err)
	}

	if cutoff != nil && timeutils.IsSameOrAfterMonth(entry.Date.Time, cutoff.Time) {
		return nil, fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
	}

	created, err := s.repo.CreateHistoricalEntry(ctx, *entry)
	if err != nil {
		return nil, fmt.Errorf("failed to save historical entry: %w", err)
	}

	return created, nil
}

func (s *Service) UpdateHistoricalEntry(ctx context.Context, date timeutils.Date, req HistoricalFinanceReq) (*HistoricalEntry, error) {
	existing, err := s.repo.GetHistoricalEntryByDate(ctx, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get historical entry: %w", err)
	}

	if err := existing.ApplyUpdate(req); err != nil {
		return nil, fmt.Errorf("failed to apply update: %w", err)
	}

	cutoff, err := s.txRepo.GetMinTransactionDate(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get cutoff: %w", err)
	}

	if cutoff != nil && timeutils.IsSameOrAfterMonth(existing.Date.Time, cutoff.Time) {
		return nil, fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
	}

	updated, err := s.repo.UpdateHistoricalEntry(ctx, *existing)
	if err != nil {
		return nil, fmt.Errorf("failed to update historical entry: %w", err)
	}

	return updated, nil
}

func (s *Service) ListHistoricalEntries(ctx context.Context) ([]*HistoricalEntry, error) {
	entries, err := s.repo.ListHistoricalEntries(ctx, HistoricalEntry{})
	if err != nil {
		return nil, fmt.Errorf("failed to list historical entries: %w", err)
	}
	return entries, nil
}

func (s *Service) GetHistoricalEntryByDate(ctx context.Context, date timeutils.Date) (*HistoricalEntry, error) {
	entry, err := s.repo.GetHistoricalEntryByDate(ctx, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get historical entry: %w", err)
	}
	return entry, nil
}

func (s *Service) DeleteHistoricalEntry(ctx context.Context, date timeutils.Date) error {
	err := s.repo.DeleteHistoricalEntry(ctx, HistoricalEntry{Date: date})
	if err != nil {
		return fmt.Errorf("failed to delete historical entry: %w", err)
	}
	return nil
}

func (s *Service) BulkCreateHistoricalEntries(ctx context.Context, bulkReq BulkCreateReq) error {
	var entries = make([]HistoricalEntry, 0, len(bulkReq.Data))

	cutoff, err := s.txRepo.GetMinTransactionDate(ctx)
	if err != nil {
		return fmt.Errorf("failed to get cutoff: %w", err)
	}

	for _, r := range bulkReq.Data {
		e, err := r.ToEntry(s.clock)
		if err != nil {
			return fmt.Errorf("failed to convert request to entry: %w", err)
		}

		if cutoff != nil && timeutils.IsSameOrAfterMonth(e.Date.Time, cutoff.Time) {
			return fmt.Errorf("transaction month overlaps cutoff: %w", ErrInvalidField)
		}

		entries = append(entries, *e)
	}

	if len(entries) == 0 {
		return nil
	}

	if err := s.repo.BulkCreateHistoricalEntries(ctx, entries); err != nil {
		return fmt.Errorf("failed to bulk create historical entries: %w", err)
	}
	return nil
}
