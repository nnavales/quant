package historical

import (
	"context"
	"database/sql"
	"strings"

	"github.com/nnavales/summit/api/apperrors"
	"github.com/nnavales/summit/api/timeutils"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) CreateHistoricalEntry(ctx context.Context, h HistoricalEntry) (*HistoricalEntry, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateHistoricalEntry,
		h.Date,
		h.ExchangeRate,
		h.IncomeUSD,
		h.IncomeFixedUSD,
		h.IncomeVariableUSD,
		h.ExpenseUSD,
		h.ExpenseFixedUSD,
		h.ExpenseVariableUSD,
		h.SavingsUSD,
		h.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &h, nil
}

func (r *SQLiteRepo) UpdateHistoricalEntry(ctx context.Context, h HistoricalEntry) (*HistoricalEntry, error) {
	result, err := r.db.ExecContext(ctx, QueryUpdateHistoricalEntry,
		h.ExchangeRate,
		h.IncomeUSD,
		h.IncomeFixedUSD,
		h.IncomeVariableUSD,
		h.ExpenseUSD,
		h.ExpenseFixedUSD,
		h.ExpenseVariableUSD,
		h.SavingsUSD,
		h.Date.String(),
	)
	if err != nil {
		return nil, err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, apperrors.ErrNotFound
	}

	return &h, nil
}

func (r *SQLiteRepo) ListHistoricalEntries(ctx context.Context, h HistoricalEntry) ([]*HistoricalEntry, error) {
	rows, err := r.db.QueryContext(ctx, QueryListHistoricalEntries)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*HistoricalEntry
	for rows.Next() {
		var e HistoricalEntry
		var dateStr string
		err := rows.Scan(
			&dateStr,
			&e.ExchangeRate,
			&e.IncomeUSD,
			&e.IncomeFixedUSD,
			&e.IncomeVariableUSD,
			&e.ExpenseUSD,
			&e.ExpenseFixedUSD,
			&e.ExpenseVariableUSD,
			&e.SavingsUSD,
			&e.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		e.Date, _ = timeutils.ParseDate(dateStr)
		entries = append(entries, &e)
	}

	return entries, rows.Err()
}

func (r *SQLiteRepo) GetHistoricalEntryByDate(ctx context.Context, date timeutils.Date) (*HistoricalEntry, error) {
	var e HistoricalEntry
	var dateStr string
	err := r.db.QueryRowContext(ctx, QueryGetHistoricalEntryByDate, date.String()).Scan(
		&dateStr,
		&e.ExchangeRate,
		&e.IncomeUSD,
		&e.IncomeFixedUSD,
		&e.IncomeVariableUSD,
		&e.ExpenseUSD,
		&e.ExpenseFixedUSD,
		&e.ExpenseVariableUSD,
		&e.SavingsUSD,
		&e.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	e.Date, _ = timeutils.ParseDate(dateStr)
	return &e, nil
}

func (r *SQLiteRepo) DeleteHistoricalEntry(ctx context.Context, h HistoricalEntry) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteHistoricalEntry, h.Date.String())
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

func (r *SQLiteRepo) BulkCreateHistoricalEntries(ctx context.Context, histEntries []HistoricalEntry) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer tx.Rollback()

	for _, h := range histEntries {
		_, err := tx.ExecContext(ctx, QueryCreateHistoricalEntry,
			h.Date,
			h.ExchangeRate,
			h.IncomeUSD,
			h.IncomeFixedUSD,
			h.IncomeVariableUSD,
			h.ExpenseUSD,
			h.ExpenseFixedUSD,
			h.ExpenseVariableUSD,
			h.SavingsUSD,
			h.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *SQLiteRepo) GetCutOff(ctx context.Context) (*timeutils.Date, error) {
	row := r.db.QueryRowContext(ctx, `
        SELECT MAX(date) 
        FROM historical_entries;
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
