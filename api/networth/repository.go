package networth

import (
	"context"
	"database/sql"
	"strings"

	"github.com/nnavales/summit/api/apperrors"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) Get(ctx context.Context, ID string) (*Asset, error) {
	row := r.db.QueryRowContext(ctx, QueryGetAssetByID, ID)
	var asset Asset
	err := row.Scan(
		&asset.ID,
		&asset.Name,
		&asset.Amount,
		&asset.Currency,
		&asset.Type,
		&asset.CreatedAt,
		&asset.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &asset, nil
}

func (r *SQLiteRepo) List(ctx context.Context) ([]Asset, error) {
	rows, err := r.db.QueryContext(ctx, QueryListAssets)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var assets []Asset

	for rows.Next() {
		var asset Asset
		err := rows.Scan(
			&asset.ID,
			&asset.Name,
			&asset.Amount,
			&asset.Currency,
			&asset.Type,
			&asset.CreatedAt,
			&asset.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		assets = append(assets, asset)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return assets, nil
}

func (r *SQLiteRepo) Create(ctx context.Context, a Asset) (*Asset, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateAsset, a.ID, a.Name, a.Amount, a.Currency, a.Type, a.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}

	return &a, nil
}

func (r *SQLiteRepo) Update(ctx context.Context, a Asset) (*Asset, error) {
	res, err := r.db.ExecContext(ctx, QueryUpdateAsset, a.Name, a.Amount, a.Currency, a.Type, a.UpdatedAt, a.ID)
	if err != nil {
		return nil, err
	}
	nRows, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}

	if nRows != 1 {
		return nil, apperrors.ErrNotFound
	}

	return &a, nil
}

func (r *SQLiteRepo) Delete(ctx context.Context, ID string) error {
	res, err := r.db.ExecContext(ctx, QueryDeleteAsset, ID)
	if err != nil {
		return err
	}
	nRows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if nRows != 1 {
		return apperrors.ErrNotFound
	}

	return nil
}
