package categories

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

func (s *Service) CreateCategory(ctx context.Context, req CategoryReq) (*Category, error) {
	if req.Name == nil {
		return nil, fmt.Errorf("name is required")
	}

	now := s.clock.Now()
	c := NewCategory(now, *req.Name)

	if err := c.Validate(); err != nil {
		return nil, fmt.Errorf("invalid category: %w", err)
	}

	created, err := s.repo.CreateCategory(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}
	return created, nil
}

func (s *Service) GetCategory(ctx context.Context, id string) (*Category, error) {
	c, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	return c, nil
}

func (s *Service) ListCategories(ctx context.Context, filter Filter) ([]Category, error) {
	categories, err := s.repo.ListCategories(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	return categories, nil
}

func (s *Service) ListCategoriesWithSubcategories(ctx context.Context, filter Filter) ([]CategoryWithSubcategories, error) {
	categories, err := s.repo.ListCategoriesWithSubcategories(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories with subcategories: %w", err)
	}
	return categories, nil
}

func (s *Service) UpdateCategory(ctx context.Context, id string, req CategoryReq) (*Category, error) {
	c, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get category for update: %w", err)
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
		return nil, fmt.Errorf("invalid category: %w", err)
	}

	updated, err := s.repo.UpdateCategory(ctx, *c)
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteCategory(ctx context.Context, id string) error {
	err := s.repo.DeleteCategory(ctx, id, s.clock.Now())
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

func (s *Service) CreateSubcategory(ctx context.Context, req SubcategoryReq) (*Subcategory, error) {
	if req.CategoryID == nil || req.Name == nil {
		return nil, fmt.Errorf("category_id and name are required")
	}

	now := s.clock.Now()
	sd := NewSubcategory(now, *req.CategoryID, *req.Name)

	if err := sd.Validate(); err != nil {
		return nil, fmt.Errorf("invalid subcategory: %w", err)
	}

	created, err := s.repo.CreateSubcategory(ctx, *sd)
	if err != nil {
		return nil, fmt.Errorf("failed to create subcategory: %w", err)
	}
	return created, nil
}

func (s *Service) GetSubcategory(ctx context.Context, id string) (*Subcategory, error) {
	sd, err := s.repo.GetSubcategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get subcategory: %w", err)
	}
	return sd, nil
}

func (s *Service) ListSubcategories(ctx context.Context, filter Filter) ([]Subcategory, error) {
	subcategories, err := s.repo.ListSubcategories(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list subcategories: %w", err)
	}
	return subcategories, nil
}

func (s *Service) UpdateSubcategory(ctx context.Context, id string, req SubcategoryReq) (*Subcategory, error) {
	sd, err := s.repo.GetSubcategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get subcategory for update: %w", err)
	}

	now := s.clock.Now()
	sd.Touch(now)

	if req.CategoryID != nil {
		sd.CategoryID = *req.CategoryID
	}
	if req.Name != nil {
		sd.Name = *req.Name
	}
	if req.IsDeleted != nil {
		sd.SetDeleted(now, *req.IsDeleted)
	}

	if err := sd.Validate(); err != nil {
		return nil, fmt.Errorf("invalid subcategory: %w", err)
	}

	updated, err := s.repo.UpdateSubcategory(ctx, *sd)
	if err != nil {
		return nil, fmt.Errorf("failed to update subcategory: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteSubcategory(ctx context.Context, id string) error {
	err := s.repo.DeleteSubcategory(ctx, id, s.clock.Now())
	if err != nil {
		return fmt.Errorf("failed to delete subcategory: %w", err)
	}
	return nil
}

func (s *Service) RestoreCategory(ctx context.Context, id string) error {
	err := s.repo.RestoreCategory(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to restore category: %w", err)
	}
	return nil
}

func (s *Service) RestoreSubcategory(ctx context.Context, id string) error {
	err := s.repo.RestoreSubcategory(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to restore subcategory: %w", err)
	}
	return nil
}
