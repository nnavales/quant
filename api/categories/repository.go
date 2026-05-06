package categories

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/nnavales/quant/api/apperrors"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) CreateCategory(ctx context.Context, c Category) (*Category, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateCategory,
		c.ID,
		c.Name,
		c.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &c, nil
}

func (r *SQLiteRepo) GetCategoryByID(ctx context.Context, id string) (*Category, error) {
	var c Category

	err := r.db.QueryRowContext(ctx, QueryGetCategoryByID, id).Scan(
		&c.ID,
		&c.Name,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &c, nil
}

func (r *SQLiteRepo) ListCategories(ctx context.Context, filter Filter) ([]Category, error) {
	var rows *sql.Rows
	var err error

	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedCategories)
		if err != nil {
			return nil, err
		}
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListCategories)
		if err != nil {
			return nil, err
		}
	}

	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.CreatedAt,
			&c.UpdatedAt,
			&c.DeletedAt,
		)
		if err != nil {
			return nil, err
		}

		categories = append(categories, c)
	}
	return categories, rows.Err()
}

func (r *SQLiteRepo) ListCategoriesWithSubcategories(ctx context.Context, filter Filter) ([]CategoryWithSubcategories, error) {
	var rows *sql.Rows
	var err error

	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedCategories)
		if err != nil {
			return nil, err
		}
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListCategoriesWithSubcategories)
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var result []CategoryWithSubcategories
	var lastID string

	for rows.Next() {
		var c Category
		var sID, sName *string
		var sCreatedAt, sUpdatedAt, sDeletedAt *time.Time

		err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.CreatedAt,
			&c.UpdatedAt,
			&c.DeletedAt,
			&sID,
			&sName,
			&sCreatedAt,
			&sUpdatedAt,
			&sDeletedAt,
		)
		if err != nil {
			return nil, err
		}

		if c.ID != lastID {
			result = append(result, CategoryWithSubcategories{
				Category:      c,
				Subcategories: []Subcategory{},
			})
			lastID = c.ID
		}

		if sID != nil {
			sub := Subcategory{
				ID:         *sID,
				CategoryID: c.ID,
				Name:       *sName,
				CreatedAt:  *sCreatedAt,
				UpdatedAt:  sUpdatedAt,
				DeletedAt:  sDeletedAt,
			}
			result[len(result)-1].Subcategories = append(result[len(result)-1].Subcategories, sub)
		}
	}
	return result, rows.Err()
}

func (r *SQLiteRepo) UpdateCategory(ctx context.Context, c Category) (*Category, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateCategory,
		c.Name,
		c.UpdatedAt,
		c.DeletedAt,
		c.ID,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SQLiteRepo) DeleteCategory(ctx context.Context, id string, now time.Time) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteCategory, now, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) CreateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateSubcategory,
		s.ID,
		s.CategoryID,
		s.Name,
		s.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &s, nil
}

func (r *SQLiteRepo) GetSubcategoryByID(ctx context.Context, id string) (*Subcategory, error) {
	var s Subcategory

	err := r.db.QueryRowContext(ctx, QueryGetSubcategoryByID, id).Scan(
		&s.ID,
		&s.CategoryID,
		&s.Name,
		&s.CreatedAt,
		&s.UpdatedAt,
		&s.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &s, nil
}

func (r *SQLiteRepo) ListSubcategories(ctx context.Context, filter Filter) ([]Subcategory, error) {
	var rows *sql.Rows
	var err error

	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedSubcategories)
		if err != nil {
			return nil, err
		}
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListSubcategories)
		if err != nil {
			return nil, err
		}
	}

	defer rows.Close()

	var subcategories []Subcategory
	for rows.Next() {
		var s Subcategory

		err := rows.Scan(
			&s.ID,
			&s.CategoryID,
			&s.Name,
			&s.CreatedAt,
			&s.UpdatedAt,
			&s.DeletedAt,
		)
		if err != nil {
			return nil, err
		}

		subcategories = append(subcategories, s)
	}
	return subcategories, rows.Err()
}

func (r *SQLiteRepo) UpdateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateSubcategory,
		s.CategoryID,
		s.Name,
		s.UpdatedAt,
		s.DeletedAt,
		s.ID,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SQLiteRepo) DeleteSubcategory(ctx context.Context, id string, now time.Time) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteSubcategory, now, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) RestoreCategory(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryRestoreCategory, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) RestoreSubcategory(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryRestoreSubcategory, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) GetCategoryByName(ctx context.Context, name string) (*Category, error) {
	var c Category

	err := r.db.QueryRowContext(ctx, QueryGetCategoryByName, name).Scan(
		&c.ID,
		&c.Name,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &c, nil
}

func (r *SQLiteRepo) GetSubcategoryByName(ctx context.Context, name string) (*Subcategory, error) {
	var s Subcategory

	err := r.db.QueryRowContext(ctx, QueryGetSubcategoryByName, name).Scan(
		&s.ID,
		&s.CategoryID,
		&s.Name,
		&s.CreatedAt,
		&s.UpdatedAt,
		&s.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &s, nil
}

func (r *SQLiteRepo) GetSubcategoryByCategoryAndName(ctx context.Context, categoryID, name string) (*Subcategory, error) {
	var s Subcategory

	err := r.db.QueryRowContext(ctx, QueryGetSubcategoryByCategoryAndName, categoryID, name).Scan(
		&s.ID,
		&s.CategoryID,
		&s.Name,
		&s.CreatedAt,
		&s.UpdatedAt,
		&s.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &s, nil
}

func (r *SQLiteRepo) HardDeleteCategory(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, QueryHardDeleteCategory, id)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected < 1 {
		return ErrNotFound
	}

	return nil
}

func (r SQLiteRepo) HardDeleteSubcategory(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, QueryHardDeleteSubcategory, id)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected < 1 {
		return ErrNotFound
	}

	return nil
}

func (r *SQLiteRepo) CreateCategoryTx(ctx context.Context, tx *sql.Tx, c Category) (*Category, error) {
	_, err := tx.ExecContext(ctx, QueryCreateCategory,
		c.ID,
		c.Name,
		c.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &c, nil
}

func (r *SQLiteRepo) GetCategoryByNameTx(ctx context.Context, tx *sql.Tx, name string) (*Category, error) {
	var c Category

	err := tx.QueryRowContext(ctx, QueryGetCategoryByName, name).Scan(
		&c.ID,
		&c.Name,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &c, nil
}

func (r *SQLiteRepo) CreateSubcategoryTx(ctx context.Context, tx *sql.Tx, s Subcategory) (*Subcategory, error) {
	_, err := tx.ExecContext(ctx, QueryCreateSubcategory,
		s.ID,
		s.CategoryID,
		s.Name,
		s.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &s, nil
}

func (r *SQLiteRepo) GetSubcategoryByCategoryAndNameTx(ctx context.Context, tx *sql.Tx, categoryID, name string) (*Subcategory, error) {
	var s Subcategory

	err := tx.QueryRowContext(ctx, QueryGetSubcategoryByCategoryAndName, categoryID, name).Scan(
		&s.ID,
		&s.CategoryID,
		&s.Name,
		&s.CreatedAt,
		&s.UpdatedAt,
		&s.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &s, nil
}
