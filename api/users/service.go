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

func (s *Service) Get(ctx context.Context, key string) (string, error) {
	v, err := s.repo.Get(ctx, key)
	if err != nil {
		return "", fmt.Errorf("failed to get config: %w", err)
	}
	return v, nil
}

func (s *Service) Set(ctx context.Context, key, val string) error {
	if err := s.repo.Update(ctx, key, val); err != nil {
		return fmt.Errorf("failed to set config: %w", err)
	}
	return nil
}

func (s *Service) List(ctx context.Context) (UserConfig, error) {
	cfg, err := s.repo.List(ctx)
	if err != nil {
		return UserConfig{}, fmt.Errorf("failed to list config: %w", err)
	}
	return cfg, nil
}
