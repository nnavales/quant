package categories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound  = errors.New("resource not found")
	ErrDuplicate = errors.New("resource already exists")
)

type Category struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type Subcategory struct {
	ID         string     `json:"id"`
	CategoryID string     `json:"category_id"`
	Name       string     `json:"name"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
}

type Filter struct {
	Deleted bool
}

// Repository
type Repository interface {
	// must
	CreateCategory(ctx context.Context, c Category) (*Category, error)
	GetCategoryByID(ctx context.Context, id string) (*Category, error)
	ListCategories(ctx context.Context, filter Filter) ([]Category, error)
	ListCategoriesWithSubcategories(ctx context.Context, filter Filter) ([]CategoryWithSubcategories, error)
	UpdateCategory(ctx context.Context, c Category) (*Category, error)
	DeleteCategory(ctx context.Context, id string, now time.Time) error

	// must
	CreateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	GetSubcategoryByID(ctx context.Context, id string) (*Subcategory, error)
	ListSubcategories(ctx context.Context, filter Filter) ([]Subcategory, error)
	UpdateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	DeleteSubcategory(ctx context.Context, id string, now time.Time) error

	RestoreCategory(ctx context.Context, id string) error
	RestoreSubcategory(ctx context.Context, id string) error
}

type CategoryReq struct {
	ID        *string `json:"id"`
	Name      *string `json:"name"`
	IsDeleted *bool   `json:"is_deleted"`
}

type SubcategoryReq struct {
	ID         *string `json:"id"`
	CategoryID *string `json:"category_id"`
	Name       *string `json:"name"`
	IsDeleted  *bool   `json:"is_deleted"`
}

type CategoryWithSubcategories struct {
	Category      Category      `json:"category"`
	Subcategories []Subcategory `json:"subcategories"`
}

func NewCategory(now time.Time, name string) *Category {
	id := ulid.Make().String()
	return &Category{
		ID:        id,
		Name:      name,
		CreatedAt: now,
	}
}

func NewSubcategory(now time.Time, categoryID, name string) *Subcategory {
	id := ulid.Make().String()
	return &Subcategory{
		ID:         id,
		CategoryID: categoryID,
		Name:       name,
		CreatedAt:  now,
	}
}

func (c *Category) Touch(now time.Time) {
	c.UpdatedAt = &now
}

func (c *Category) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		c.DeletedAt = &now
	} else {
		c.DeletedAt = nil
	}
}

func (s *Subcategory) Touch(now time.Time) {
	s.UpdatedAt = &now
}

func (s *Subcategory) SetDeleted(now time.Time, isDeleted bool) {
	if isDeleted {
		s.DeletedAt = &now
	} else {
		s.DeletedAt = nil
	}
}

// Validations
var ErrInvalidField = errors.New("invalid field")

func (c *Category) Validate() error {
	if c.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if c.Name == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if len(c.Name) > 100 {
		return fmt.Errorf("name is invalid: %w", ErrInvalidField)
	}

	return nil
}

func (s *Subcategory) Validate() error {
	if s.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if s.CategoryID == "" {
		return fmt.Errorf("category_id is required: %w", ErrInvalidField)
	}
	if s.Name == "" {
		return fmt.Errorf("name is required: %w", ErrInvalidField)
	}
	if len(s.Name) > 100 {
		return fmt.Errorf("name is invalid: %w", ErrInvalidField)
	}

	return nil
}
