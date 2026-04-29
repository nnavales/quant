package installments

import (
	"context"
	"database/sql"

	"github.com/nnavales/summit/api/apperrors"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) CreateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateInstallmentGroup,
		ig.ID,
		ig.TotalInstallments,
		ig.StartDate,
		ig.CreatedAt,
		ig.OriginalAmount,
		ig.Description,
		ig.Currency,
		ig.IsCanceled,
	)
	if err != nil {
		return nil, err
	}
	return &ig, nil
}

func (r *SQLiteRepo) GetInstallmentGroupByID(ctx context.Context, id string) (*InstallmentGroup, error) {
	var ig InstallmentGroup

	err := r.db.QueryRowContext(ctx, QueryGetInstallmentGroupByID, id).Scan(
		&ig.ID,
		&ig.TotalInstallments,
		&ig.StartDate,
		&ig.CreatedAt,
		&ig.UpdatedAt,
		&ig.DeletedAt,
		&ig.OriginalAmount,
		&ig.Description,
		&ig.Currency,
		&ig.IsCanceled,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &ig, nil
}

func (r *SQLiteRepo) ListInstallmentGroups(ctx context.Context) ([]InstallmentGroup, error) {
	rows, err := r.db.QueryContext(ctx, QueryListInstallmentGroups)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []InstallmentGroup
	for rows.Next() {
		var ig InstallmentGroup

		err := rows.Scan(
			&ig.ID,
			&ig.TotalInstallments,
			&ig.StartDate,
			&ig.CreatedAt,
			&ig.UpdatedAt,
			&ig.DeletedAt,
			&ig.OriginalAmount,
			&ig.Description,
			&ig.Currency,
			&ig.IsCanceled,
		)
		if err != nil {
			return nil, err
		}

		groups = append(groups, ig)
	}
	return groups, rows.Err()
}

func (r *SQLiteRepo) UpdateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateInstallmentGroup,
		ig.TotalInstallments,
		ig.StartDate,
		ig.UpdatedAt,
		ig.DeletedAt,
		ig.OriginalAmount,
		ig.Description,
		ig.Currency,
		ig.IsCanceled,
		ig.ID,
	)
	if err != nil {
		return nil, err
	}
	return &ig, nil
}

func (r *SQLiteRepo) DeleteInstallmentGroup(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteInstallmentGroup, id)
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
