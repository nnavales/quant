package channels

import (
	"context"
	"fmt"

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

func (s *Service) CreateChannel(ctx context.Context, req ChannelReq) (*Channel, error) {
	if req.Name == nil {
		return nil, fmt.Errorf("name is required: %w", ErrInvalidField)
	}

	now := s.clock.Now()
	c := NewChannel(now, *req.Name)

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid channel: %w", err)
	}

	created, err := s.repo.CreateChannel(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to create channel: %w", err)
	}
	return created, nil
}

func (s *Service) GetChannel(ctx context.Context, id string) (*Channel, error) {
	c, err := s.repo.GetChannelByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel: %w", err)
	}
	return c, nil
}

func (s *Service) ListChannels(ctx context.Context, filter Filter) ([]Channel, error) {
	channels, err := s.repo.ListChannels(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list channels: %w", err)
	}
	return channels, nil
}

func (s *Service) ListChannelsWithAccounts(ctx context.Context, filter Filter) ([]ChannelWithAccounts, error) {
	channels, err := s.repo.ListChannelsWithAccounts(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list channels with accounts: %w", err)
	}
	return channels, nil
}

func (s *Service) UpdateChannel(ctx context.Context, id string, req ChannelReq) (*Channel, error) {
	c, err := s.repo.GetChannelByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel for update: %w", err)
	}

	now := s.clock.Now()
	c.Touch(now)

	if req.Name != nil {
		c.Name = *req.Name
	}
	if req.IsDeleted != nil {
		c.SetDeleted(now, *req.IsDeleted)
	}

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid channel: %w", err)
	}

	updated, err := s.repo.UpdateChannel(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to update channel: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteChannel(ctx context.Context, id string) error {
	err := s.repo.DeleteChannel(ctx, id, s.clock.Now())
	if err != nil {
		return fmt.Errorf("failed to delete channel: %w", err)
	}
	return nil
}

func (s *Service) CreateAccount(ctx context.Context, req AccountReq) (*Account, error) {
	if req.ChannelID == nil || req.Name == nil || req.Instrument == nil {
		return nil, fmt.Errorf("channel_id, name, and instrument are required: %w", ErrInvalidField)
	}

	now := s.clock.Now()
	a := NewAccount(now, *req.ChannelID, *req.Name, *req.Instrument)

	if err := a.Validate(); err != nil {
		return nil, fmt.Errorf("invalid account: %w", err)
	}

	created, err := s.repo.CreateAccount(ctx, *a)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}
	return created, nil
}

func (s *Service) GetAccount(ctx context.Context, id string) (*Account, error) {
	a, err := s.repo.GetAccountByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	return a, nil
}

func (s *Service) ListAccounts(ctx context.Context, filter Filter) ([]Account, error) {
	accounts, err := s.repo.ListAccounts(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list accounts: %w", err)
	}
	return accounts, nil
}

func (s *Service) UpdateAccount(ctx context.Context, id string, req AccountReq) (*Account, error) {
	a, err := s.repo.GetAccountByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get account for update: %w", err)
	}

	now := s.clock.Now()
	a.Touch(now)

	if req.ChannelID != nil {
		a.ChannelID = *req.ChannelID
	}
	if req.Name != nil {
		a.Name = *req.Name
	}
	if req.Instrument != nil {
		a.Instrument = *req.Instrument
	}
	if req.IsDeleted != nil {
		a.SetDeleted(now, *req.IsDeleted)
	}

	if err := a.Validate(); err != nil {
		return nil, fmt.Errorf("invalid account: %w", err)
	}

	updated, err := s.repo.UpdateAccount(ctx, *a)
	if err != nil {
		return nil, fmt.Errorf("failed to update account: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteAccount(ctx context.Context, id string) error {
	err := s.repo.DeleteAccount(ctx, id, s.clock.Now())
	if err != nil {
		return fmt.Errorf("failed to delete account: %w", err)
	}
	return nil
}

func (s *Service) RestoreAccount(ctx context.Context, id string) error {
	err := s.repo.RestoreAccount(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to restore account: %w", err)
	}
	return nil
}

func (s *Service) RestoreChannel(ctx context.Context, id string) error {
	err := s.repo.RestoreChannel(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to restore channel: %w", err)
	}
	return nil
}

func (s *Service) HardDeleteAccount(ctx context.Context, id string) error {
	err := s.repo.HardDeleteAccount(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete account: %w", err)
	}
	return nil
}

func (s *Service) HardDeleteChannel(ctx context.Context, id string) error {
	err := s.repo.HardDeleteChannel(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete channel: %w", err)
	}
	return nil
}
