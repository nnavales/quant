package planning

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/nnavales/quant/api/timeutils"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) CreateInput(ctx context.Context, i PlanningInput) (*PlanningInput, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateInput,
		i.ID,
		i.Month,
		i.Description,
		i.Type,
		i.Amount,
		i.Currency,
		i.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &i, nil
}

func (r *SQLiteRepo) GetInput(ctx context.Context, id string) (*PlanningInput, error) {
	var i PlanningInput
	err := r.db.QueryRowContext(ctx, QueryGetInputByID, id).Scan(
		&i.ID,
		&i.Month,
		&i.Description,
		&i.Type,
		&i.Amount,
		&i.Currency,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}
	return &i, nil
}

func (r *SQLiteRepo) ListInputs(ctx context.Context) ([]PlanningInput, error) {
	rows, err := r.db.QueryContext(ctx, QueryListInputs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var inputs []PlanningInput
	for rows.Next() {
		var i PlanningInput
		err := rows.Scan(
			&i.ID,
			&i.Month,
			&i.Description,
			&i.Type,
			&i.Amount,
			&i.Currency,
			&i.CreatedAt,
			&i.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		inputs = append(inputs, i)
	}
	return inputs, rows.Err()
}

func (r *SQLiteRepo) UpdateInput(ctx context.Context, i PlanningInput, now time.Time) (*PlanningInput, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateInput,
		i.Month,
		i.Description,
		i.Type,
		i.Amount,
		i.Currency,
		now,
		i.ID,
	)
	if err != nil {
		return nil, err
	}
	i.UpdatedAt = &now
	return &i, nil
}

func (r *SQLiteRepo) ListInputsByYear(ctx context.Context, year string) ([]PlanningInput, error) {
	rows, err := r.db.QueryContext(ctx, QueryListInputsByYear, year)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var inputs []PlanningInput
	for rows.Next() {
		var i PlanningInput
		err := rows.Scan(
			&i.ID,
			&i.Month,
			&i.Description,
			&i.Type,
			&i.Amount,
			&i.Currency,
			&i.CreatedAt,
			&i.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		inputs = append(inputs, i)
	}
	return inputs, rows.Err()
}

func (r *SQLiteRepo) DeleteInput(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteInput, id)
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

func (r *SQLiteRepo) GetRateByDate(ctx context.Context, date timeutils.YearMonth) (*ExchangeRateInput, error) {
	var i ExchangeRateInput
	err := r.db.QueryRowContext(ctx, QueryGetRateByDate, date).Scan(
		&i.Month,
		&i.Rate,
		&i.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}
	return &i, nil
}

func (r *SQLiteRepo) ListRatesByYear(ctx context.Context, year string) ([]ExchangeRateInput, error) {
	rows, err := r.db.QueryContext(ctx, QueryListRatesByYear, year)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rates []ExchangeRateInput
	for rows.Next() {
		var i ExchangeRateInput
		err := rows.Scan(
			&i.Month,
			&i.Rate,
			&i.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		rates = append(rates, i)
	}
	return rates, rows.Err()
}

func (r *SQLiteRepo) CreateRate(ctx context.Context, i ExchangeRateInput) (*ExchangeRateInput, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateRate,
		i.Month,
		i.Rate,
		i.UpdatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &i, nil
}

func (r *SQLiteRepo) UpdateRate(ctx context.Context, i ExchangeRateInput, now time.Time) (*ExchangeRateInput, error) {
	result, err := r.db.ExecContext(ctx, QueryUpdateRate,
		i.Rate,
		now,
		i.Month,
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
	i.UpdatedAt = &now
	return &i, nil
}

func (r *SQLiteRepo) DeleteRate(ctx context.Context, date timeutils.YearMonth) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteRate, date)
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
