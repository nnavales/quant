package entries

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
