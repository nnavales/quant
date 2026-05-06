package users

import (
	"context"
	"database/sql"
	"time"

	"github.com/nnavales/quant/api/apperrors"
)

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{
		db: db,
	}
}

func (r *Repo) Update(ctx context.Context, key string, value any) error {
	now := time.Now()

	result, err := r.db.ExecContext(ctx, QueryUpdate, value, now, key)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *Repo) UpdateTx(ctx context.Context, updates map[string]any) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now()
	for key, value := range updates {
		_, err := tx.ExecContext(ctx, QueryUpdate, value, now, key)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *Repo) Get(ctx context.Context, key string) (any, error) {
	var value any
	err := r.db.QueryRowContext(ctx, QueryGet, key).Scan(&value)
	if err == sql.ErrNoRows {
		return nil, apperrors.ErrNotFound
	}
	return value, err
}

func (r *Repo) List(ctx context.Context) (Config, error) {
	rows, err := r.db.QueryContext(ctx, QueryList)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	config := NewConfig()
	for rows.Next() {
		var key string
		var value any
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		config[key] = value
	}

	return config, nil
}

func (r *Repo) InsertIfNotExists(ctx context.Context, m map[string]any, now time.Time) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for key, value := range m {
		_, err := tx.ExecContext(ctx, QueryInsertIfNotExists, key, value, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
