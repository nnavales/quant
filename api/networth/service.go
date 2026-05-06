package networth

import (
	"context"
	"fmt"
	"strconv"

	"github.com/nnavales/quant/api/macro"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/users"
)

type Service struct {
	repo     Repository
	provider macro.Provider
	userRepo users.Repo
	clock    timeutils.Clock
}

func NewService(repo Repository, clock timeutils.Clock, provider macro.Provider, userRepo users.Repo) *Service {
	return &Service{
		repo:     repo,
		clock:    clock,
		provider: provider,
		userRepo: userRepo,
	}
}

func (s *Service) Get(ctx context.Context, ID string) (*Asset, error) {
	asset, err := s.repo.Get(ctx, ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get asset: %w", err)
	}

	return asset, nil

}
func (s *Service) List(ctx context.Context) ([]Asset, error) {
	assets, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list assets: %w", err)
	}

	return assets, nil
}

func (s *Service) Create(ctx context.Context, req assetReq) (*Asset, error) {
	asset := NewAsset(s.clock, *req.Name, *req.Amount, *req.Currency, *req.Type)
	if err := asset.Validate(); err != nil {
		return nil, err
	}

	if _, err := s.repo.Create(ctx, *asset); err != nil {
		return nil, fmt.Errorf("failed to create asset: %w", err)
	}

	return asset, nil
}

func (s *Service) Update(ctx context.Context, req assetReq, ID string) (*Asset, error) {
	a, err := s.repo.Get(ctx, ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get asset for update: %w", err)
	}

	if req.Name != nil {
		a.Name = *req.Name
	}

	if req.Amount != nil {
		a.Amount = *req.Amount
	}

	if req.Type != nil {
		a.Type = *req.Type
	}

	if req.Currency != nil {
		a.Currency = *req.Currency
	}

	if err := a.Validate(); err != nil {
		return nil, fmt.Errorf("invalid asset: %w", err)
	}

	now := s.clock.Now()
	a.UpdatedAt = &now
	updated, err := s.repo.Update(ctx, *a)
	if err != nil {
		return nil, fmt.Errorf("failed to update asset: %w", err)
	}
	return updated, nil
}

func (s *Service) Delete(ctx context.Context, ID string) error {
	err := s.repo.Delete(ctx, ID)
	if err != nil {
		return fmt.Errorf("failed to delete asset: %w", err)
	}
	return nil
}

func (s *Service) GetNetWorth(ctx context.Context) (*NetWorth, error) {
	assets, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list assets: %w", err)
	}

	rate, err := s.provider.LastSell(ctx)
	if err != nil {
		defaultRate, err := s.userRepo.Get(ctx, "default_rate")
		if err != nil {
			return nil, fmt.Errorf("unable to get exchange rate from user settings or provider: %w", err)
		}

		strRate := defaultRate.(string)
		rate, err = strconv.ParseFloat(strRate, 64)
		if err != nil {
			return nil, fmt.Errorf("unable to parse exchange rate: %w", err)
		}
	}

	nw := calcuateNetWorth(s.clock, assets, rate)
	nw.Assets = assets
	return nw, nil
}
