package presets

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

func (s *Service) CreatePreset(ctx context.Context, req PresetReq) (*Preset, error) {
	if req.Name == nil {
		return nil, fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if req.Type == nil {
		return nil, fmt.Errorf("type is required: %w", ErrInvalidField)
	}

	now := s.clock.Now()
	p := NewPreset(now, *req.Name, *req.Type)

	if req.Description != nil {
		p.Description = req.Description
	}
	if req.Frequency != nil {
		p.Frequency = req.Frequency
	}
	if req.CategoryID != nil {
		p.CategoryID = req.CategoryID
	}
	if req.SubcategoryID != nil {
		p.SubcategoryID = req.SubcategoryID
	}
	if req.ChannelID != nil {
		p.ChannelID = req.ChannelID
	}
	if req.AccountID != nil {
		p.AccountID = req.AccountID
	}
	if req.IsPaid != nil {
		p.IsPaid = req.IsPaid
	}
	if req.Currency != nil {
		p.Currency = req.Currency
	}

	if err := p.Validate(); err != nil {
		return nil, fmt.Errorf("invalid preset: %w", err)
	}

	created, err := s.repo.CreatePreset(ctx, *p)
	if err != nil {
		return nil, fmt.Errorf("failed to create preset: %w", err)
	}
	return created, nil
}

func (s *Service) GetPreset(ctx context.Context, id string) (*Preset, error) {
	p, err := s.repo.GetPresetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get preset: %w", err)
	}
	return p, nil
}

func (s *Service) ListPresets(ctx context.Context, filter Filter) ([]Preset, error) {
	presets, err := s.repo.ListPresets(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list presets: %w", err)
	}
	return presets, nil
}

func (s *Service) UpdatePreset(ctx context.Context, id string, req PresetReq) (*Preset, error) {
	p, err := s.repo.GetPresetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get preset for update: %w", err)
	}

	now := s.clock.Now()
	p.Touch(now)

	if req.Name != nil {
		p.Name = *req.Name
	}
	if req.Description != nil {
		p.Description = req.Description
	}
	if req.Type != nil {
		p.Type = *req.Type
	}
	if req.Frequency != nil {
		p.Frequency = req.Frequency
	}
	if req.CategoryID != nil {
		p.CategoryID = req.CategoryID
	}
	if req.SubcategoryID != nil {
		p.SubcategoryID = req.SubcategoryID
	}
	if req.ChannelID != nil {
		p.ChannelID = req.ChannelID
	}
	if req.AccountID != nil {
		p.AccountID = req.AccountID
	}
	if req.IsPaid != nil {
		p.IsPaid = req.IsPaid
	}
	if req.Currency != nil {
		p.Currency = req.Currency
	}
	if req.IsDeleted != nil {
		p.SetDeleted(now, *req.IsDeleted)
	}

	if err := p.Validate(); err != nil {
		return nil, fmt.Errorf("invalid preset: %w", err)
	}

	updated, err := s.repo.UpdatePreset(ctx, *p)
	if err != nil {
		return nil, fmt.Errorf("failed to update preset: %w", err)
	}
	return updated, nil
}

func (s *Service) DeletePreset(ctx context.Context, id string) error {
	err := s.repo.DeletePreset(ctx, id, s.clock.Now())
	if err != nil {
		return fmt.Errorf("failed to delete preset: %w", err)
	}
	return nil
}

func (s *Service) RestorePreset(ctx context.Context, id string) error {
	err := s.repo.RestorePreset(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to restore preset: %w", err)
	}
	return nil
}
