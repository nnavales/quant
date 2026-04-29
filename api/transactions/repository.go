package transactions

import (
	"context"
	"database/sql"

	"github.com/nnavales/summit/api/apperrors"
	"github.com/nnavales/summit/api/timeutils"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) GetTransactionByID(ctx context.Context, id string) (*Transaction, error) {
	var t Transaction
	err := r.db.QueryRowContext(ctx, QueryGetTransactionByID, id).Scan(
		&t.ID,
		&t.Date,
		&t.Description,
		&t.Type,
		&t.Frequency,
		&t.InstallmentGroupID,
		&t.InstallmentNumber,
		&t.IsPaid,
		&t.CreatedAt,
		&t.UpdatedAt,
		&t.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

func (r *SQLiteRepo) ListTransactions(ctx context.Context) ([]Transaction, error) {
	rows, err := r.db.QueryContext(ctx, QueryListTransactions)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var t Transaction
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.InstallmentGroupID,
			&t.InstallmentNumber,
			&t.IsPaid,
			&t.CreatedAt,
			&t.UpdatedAt,
			&t.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	return transactions, rows.Err()
}

func (r *SQLiteRepo) UpdateTransaction(ctx context.Context, t Transaction) (*Transaction, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateTransaction,
		t.Date,
		t.Description,
		t.Type,
		t.Frequency,
		t.InstallmentGroupID,
		t.InstallmentNumber,
		&t.IsPaid,
		t.UpdatedAt,
		t.DeletedAt,
		t.ID,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *SQLiteRepo) DeleteTransaction(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteTransaction, id)
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

func (r *SQLiteRepo) GetMinTransactionDate(ctx context.Context) (*timeutils.Date, error) {
	row := r.db.QueryRowContext(ctx, `
        SELECT MIN(date) 
        FROM transactions;
    `)

	var date sql.NullString
	if err := row.Scan(&date); err != nil {
		return nil, err
	}

	if !date.Valid {
		return nil, nil
	}

	parsedDate, err := timeutils.ParseDate(date.String)
	if err != nil {
		return nil, err
	}

	return &parsedDate, nil
}
