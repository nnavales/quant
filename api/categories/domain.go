package categories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/nnavales/summit/api/apperrors"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound     = apperrors.ErrNotFound
	ErrDuplicate    = apperrors.ErrDuplicate
	ErrInvalidField = apperrors.ErrInvalidInput
)

var _ = errors.New

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
	GetCategoryByName(ctx context.Context, name string) (*Category, error)
	ListCategories(ctx context.Context, filter Filter) ([]Category, error)
	ListCategoriesWithSubcategories(ctx context.Context, filter Filter) ([]CategoryWithSubcategories, error)
	UpdateCategory(ctx context.Context, c Category) (*Category, error)
	DeleteCategory(ctx context.Context, id string, now time.Time) error

	// must
	CreateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	GetSubcategoryByID(ctx context.Context, id string) (*Subcategory, error)
	GetSubcategoryByName(ctx context.Context, name string) (*Subcategory, error)
	GetSubcategoryByCategoryAndName(ctx context.Context, categoryID, name string) (*Subcategory, error)
	ListSubcategories(ctx context.Context, filter Filter) ([]Subcategory, error)
	UpdateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error)
	DeleteSubcategory(ctx context.Context, id string, now time.Time) error

	RestoreCategory(ctx context.Context, id string) error
	RestoreSubcategory(ctx context.Context, id string) error

	HardDeleteCategory(ctx context.Context, id string) error
	HardDeleteSubcategory(ctx context.Context, id string) error

	// Tx variants for bulk import
	CreateCategoryTx(ctx context.Context, tx *sql.Tx, c Category) (*Category, error)
	GetCategoryByNameTx(ctx context.Context, tx *sql.Tx, name string) (*Category, error)
	CreateSubcategoryTx(ctx context.Context, tx *sql.Tx, s Subcategory) (*Subcategory, error)
	GetSubcategoryByCategoryAndNameTx(ctx context.Context, tx *sql.Tx, categoryID, name string) (*Subcategory, error)
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
