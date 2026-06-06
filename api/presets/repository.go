package presets

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

func (r *SQLiteRepo) CreatePreset(ctx context.Context, p Preset) (*Preset, error) {
	_, err := r.db.ExecContext(ctx, QueryCreatePreset,
		p.ID,
		p.Name,
		p.Description,
		p.Type,
		p.Frequency,
		p.CategoryID,
		p.SubcategoryID,
		p.ChannelID,
		p.AccountID,
		p.IsPaid,
		p.Currency,
		p.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepo) CreatePresetTx(ctx context.Context, tx *sql.Tx, p Preset) (*Preset, error) {
	_, err := tx.ExecContext(ctx, QueryCreatePreset,
		p.ID,
		p.Name,
		p.Description,
		p.Type,
		p.Frequency,
		p.CategoryID,
		p.SubcategoryID,
		p.ChannelID,
		p.AccountID,
		p.IsPaid,
		p.Currency,
		p.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepo) GetPresetByID(ctx context.Context, id string) (*Preset, error) {
	var p Preset
	err := r.db.QueryRowContext(ctx, QueryGetPresetByID, id).Scan(
		&p.ID,
		&p.Name,
		&p.Description,
		&p.Type,
		&p.Frequency,
		&p.CategoryID,
		&p.SubcategoryID,
		&p.ChannelID,
		&p.AccountID,
		&p.IsPaid,
		&p.Currency,
		&p.CreatedAt,
		&p.UpdatedAt,
		&p.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepo) GetPresetByName(ctx context.Context, name string) (*Preset, error) {
	var p Preset
	err := r.db.QueryRowContext(ctx, QueryGetPresetByName, name).Scan(
		&p.ID,
		&p.Name,
		&p.Description,
		&p.Type,
		&p.Frequency,
		&p.CategoryID,
		&p.SubcategoryID,
		&p.ChannelID,
		&p.AccountID,
		&p.IsPaid,
		&p.Currency,
		&p.CreatedAt,
		&p.UpdatedAt,
		&p.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepo) ListPresets(ctx context.Context, filter Filter) ([]Preset, error) {
	var rows *sql.Rows
	var err error

	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedPresets)
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListPresets)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var presets []Preset
	for rows.Next() {
		var p Preset
		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Type,
			&p.Frequency,
			&p.CategoryID,
			&p.SubcategoryID,
			&p.ChannelID,
			&p.AccountID,
			&p.IsPaid,
			&p.Currency,
			&p.CreatedAt,
			&p.UpdatedAt,
			&p.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		presets = append(presets, p)
	}
	return presets, rows.Err()
}

func (r *SQLiteRepo) UpdatePreset(ctx context.Context, p Preset) (*Preset, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdatePreset,
		p.Name,
		p.Description,
		p.Type,
		p.Frequency,
		p.CategoryID,
		p.SubcategoryID,
		p.ChannelID,
		p.AccountID,
		p.IsPaid,
		p.Currency,
		p.UpdatedAt,
		p.DeletedAt,
		p.ID,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepo) DeletePreset(ctx context.Context, id string, now time.Time) error {
	result, err := r.db.ExecContext(ctx, QueryDeletePreset, now, id)
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

func (r *SQLiteRepo) RestorePreset(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryRestorePreset, id)
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
