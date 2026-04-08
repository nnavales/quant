package transactions

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

func (s *Service) UpdateTansactionPaid(ctx context.Context, id string, isPaid bool) (*Transaction, error) {
	e, err := s.repo.GetTransactionByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction for update: %w", err)
	}

	now := s.clock.Now()
	e.Touch(now)
	e.SetIsPaid(isPaid)

	if err := e.Validate(); err != nil {
		return nil, fmt.Errorf("invalid entry: %w", err)
	}

	updated, err := s.repo.UpdateTransaction(ctx, *e)
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction: %w", err)
	}
	return updated, nil
}
