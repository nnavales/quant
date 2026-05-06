package entries

import (
	"context"
	"database/sql"

	"github.com/nnavales/quant/api/apperrors"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) GetEntryByID(ctx context.Context, id string) (*Entry, error) {
	var e Entry
	err := r.db.QueryRowContext(ctx, QueryGetEntryByID, id).Scan(
		&e.ID,
		&e.TransactionID,
		&e.ChannelID,
		&e.AccountID,
		&e.Amount,
		&e.Currency,
		&e.ExchangeRate,
		&e.CategoryID,
		&e.SubcategoryID,
		&e.CreatedAt,
		&e.UpdatedAt,
		&e.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}
	return &e, nil
}

func (r *SQLiteRepo) ListEntries(ctx context.Context) ([]Entry, error) {
	rows, err := r.db.QueryContext(ctx, QueryListEntries)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []Entry
	for rows.Next() {
		var e Entry
		err := rows.Scan(
			&e.ID,
			&e.TransactionID,
			&e.ChannelID,
			&e.AccountID,
			&e.Amount,
			&e.Currency,
			&e.ExchangeRate,
			&e.CategoryID,
			&e.SubcategoryID,
			&e.CreatedAt,
			&e.UpdatedAt,
			&e.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (r *SQLiteRepo) UpdateEntry(ctx context.Context, e Entry) (*Entry, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateEntry,
		e.TransactionID,
		e.ChannelID,
		e.AccountID,
		e.Amount,
		e.Currency,
		e.ExchangeRate,
		e.CategoryID,
		e.SubcategoryID,
		e.UpdatedAt,
		e.DeletedAt,
		e.ID,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *SQLiteRepo) DeleteEntry(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteEntry, id)
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
