package installments

import (
	"context"
	"fmt"

	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
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
		return nil, fmt.Errorf("failed to get installment group: %w", err)
	}

	if req.TotalInstallments != nil {
		ig.TotalInstallments = *req.TotalInstallments
	}
	if req.StartDate != nil {
		ig.StartDate = *req.StartDate
	}
	if req.IsDeleted != nil {
		ig.SetDeleted(s.clock.Now(), *req.IsDeleted)
	} else {
		ig.Touch(s.clock.Now())
	}
	if req.OriginalAmount != nil {
		ig.SetOriginalAmount(money.Money(*req.OriginalAmount))
	}
	if req.Description != nil {
		ig.SetDescription(*req.Description)
	}
	if req.Currency != nil {
		ig.SetCurrency(*req.Currency)
	}
	if req.IsCanceled != nil {
		ig.SetIsCanceled(*req.IsCanceled)
	}

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
