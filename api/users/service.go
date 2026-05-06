package users

import (
	"context"
	"fmt"

	"github.com/nnavales/quant/api/timeutils"
)

type Service struct {
	repo  *Repo
	clock timeutils.Clock
}

func NewService(clock timeutils.Clock, repo *Repo) *Service {
	return &Service{
		repo:  repo,
		clock: clock,
	}
}

func (s *Service) Get(ctx context.Context, key string) (any, error) {
	v, err := s.repo.Get(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("failed to get config: %w", err)
	}
	return v, nil
}

func (s *Service) Set(ctx context.Context, updates map[string]any) error {
	if err := s.repo.UpdateTx(ctx, updates); err != nil {
		return fmt.Errorf("failed to set config: %w", err)
	}
	return nil
}

func (s *Service) List(ctx context.Context) (Config, error) {
	cfg, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list config: %w", err)
	}
	return cfg, nil
}
