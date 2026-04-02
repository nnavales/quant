package users

import (
	"context"

	"github.com/nnavales/summit/api/timeutils"
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
	return s.repo.Get(ctx, key)
}

func (s *Service) Set(ctx context.Context, updates map[string]any) error {
	return s.repo.UpdateTx(ctx, updates)
}

func (s *Service) List(ctx context.Context) (Config, error) {
	return s.repo.List(ctx)
}
