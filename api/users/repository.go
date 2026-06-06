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

func (r *Repo) Update(ctx context.Context, key, value string) error {
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

func (r *Repo) Get(ctx context.Context, key string) (string, error) {
	var value string
	err := r.db.QueryRowContext(ctx, QueryGet, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", apperrors.ErrNotFound
	}
	return value, err
}

func (r *Repo) List(ctx context.Context) (UserConfig, error) {
	rows, err := r.db.QueryContext(ctx, QueryList)
	if err != nil {
		return UserConfig{}, err
	}
	defer rows.Close()

	config := UserConfig{}
	for rows.Next() {
		var key string
		var value string
		if err := rows.Scan(&key, &value); err != nil {
			return UserConfig{}, err
		}
		if err := config.Apply(key, value); err != nil {
			return UserConfig{}, err
		}
	}

	return config, nil
}

func (r *Repo) InsertIfNotExists(ctx context.Context, cfg UserConfig, now time.Time) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	type kv struct {
		key   Key
		value string
	}

	pairs := []kv{
		{KeyDollarSource, cfg.DollarSource},
		{KeyUsername, cfg.Username},
		{KeyTimezone, cfg.Timezone},
		{KeyDateFormat, string(cfg.DateFormat)},
		{KeyDefaultRate, cfg.DefaultRate},
		{KeyTheme, cfg.Theme},
	}

	for _, p := range pairs {
		_, err := tx.ExecContext(ctx, QueryInsertIfNotExists, p.key, p.value, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
