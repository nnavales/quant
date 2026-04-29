package channels

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/nnavales/summit/api/apperrors"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) RestoreChannel(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryRestoreChannel, id)
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

func (r *SQLiteRepo) RestoreAccount(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryRestoreAccount, id)
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

func (r *SQLiteRepo) CreateChannel(ctx context.Context, c Channel) (*Channel, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateChannel,
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

func (r *SQLiteRepo) GetChannelByID(ctx context.Context, id string) (*Channel, error) {
	var c Channel

	err := r.db.QueryRowContext(ctx, QueryGetChannelByID, id).Scan(
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

func (r *SQLiteRepo) GetChannelByName(ctx context.Context, name string) (*Channel, error) {
	var c Channel

	err := r.db.QueryRowContext(ctx, QueryGetChannelByName, name).Scan(
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

func (r *SQLiteRepo) ListChannels(ctx context.Context, filter Filter) ([]Channel, error) {
	var rows *sql.Rows
	var err error
	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedChannels)
		if err != nil {
			return nil, err
		}
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListChannels)
		if err != nil {
			return nil, err
		}
	}

	defer rows.Close()

	var channels []Channel
	for rows.Next() {
		var c Channel

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

		channels = append(channels, c)
	}
	return channels, rows.Err()
}

func (r *SQLiteRepo) ListChannelsWithAccounts(ctx context.Context, filter Filter) ([]ChannelWithAccounts, error) {
	var rows *sql.Rows
	var err error
	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedChannelsWithAccounts)
		if err != nil {
			return nil, err
		}
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListChannelsWithAccounts)
		if err != nil {
			return nil, err
		}
	}

	var result []ChannelWithAccounts
	var lastID string

	for rows.Next() {
		var ch Channel
		var aID, aName, aInstrument *string
		var aCreatedAt, aUpdatedAt, aDeletedAt *time.Time

		err := rows.Scan(
			&ch.ID,
			&ch.Name,
			&ch.CreatedAt,
			&ch.UpdatedAt,
			&ch.DeletedAt,
			&aID,
			&aName,
			&aInstrument,
			&aCreatedAt,
			&aUpdatedAt,
			&aDeletedAt,
		)
		if err != nil {
			return nil, err
		}

		if ch.ID != lastID {
			result = append(result, ChannelWithAccounts{
				Channel: ch,
			})
			lastID = ch.ID
		}

		if aID != nil {
			acc := Account{
				ID:         *aID,
				ChannelID:  ch.ID,
				Name:       *aName,
				Instrument: *aInstrument,
				CreatedAt:  *aCreatedAt,
				UpdatedAt:  aUpdatedAt,
				DeletedAt:  aDeletedAt,
			}
			result[len(result)-1].Accounts = append(result[len(result)-1].Accounts, acc)
		}
	}
	return result, rows.Err()
}

func (r *SQLiteRepo) UpdateChannel(ctx context.Context, c Channel) (*Channel, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateChannel,
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

func (r *SQLiteRepo) DeleteChannel(ctx context.Context, id string, now time.Time) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteChannel, now, id)
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

func (r *SQLiteRepo) CreateAccount(ctx context.Context, a Account) (*Account, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateAccount,
		a.ID,
		a.ChannelID,
		a.Name,
		a.Instrument,
		a.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, apperrors.ErrDuplicate
		}
		return nil, err
	}
	return &a, nil
}

func (r *SQLiteRepo) GetAccountByID(ctx context.Context, id string) (*Account, error) {
	var a Account

	err := r.db.QueryRowContext(ctx, QueryGetAccountByID, id).Scan(
		&a.ID,
		&a.ChannelID,
		&a.Name,
		&a.Instrument,
		&a.CreatedAt,
		&a.UpdatedAt,
		&a.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &a, nil
}

func (r *SQLiteRepo) ListAccounts(ctx context.Context, filter Filter) ([]Account, error) {
	var rows *sql.Rows
	var err error
	if filter.Deleted {
		rows, err = r.db.QueryContext(ctx, QueryListDeletedAccounts)
		if err != nil {
			return nil, err
		}
	} else {
		rows, err = r.db.QueryContext(ctx, QueryListAccounts)
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var accounts []Account
	for rows.Next() {
		var a Account

		err := rows.Scan(
			&a.ID,
			&a.ChannelID,
			&a.Name,
			&a.Instrument,
			&a.CreatedAt,
			&a.UpdatedAt,
			&a.DeletedAt,
		)
		if err != nil {
			return nil, err
		}

		accounts = append(accounts, a)
	}
	return accounts, rows.Err()
}

func (r *SQLiteRepo) UpdateAccount(ctx context.Context, a Account) (*Account, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateAccount,
		a.ChannelID,
		a.Name,
		a.Instrument,
		a.UpdatedAt,
		a.DeletedAt,
		a.ID,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *SQLiteRepo) DeleteAccount(ctx context.Context, id string, now time.Time) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteAccount, now, id)
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

func (r *SQLiteRepo) GetAccountByName(ctx context.Context, name string) (*Account, error) {
	var a Account

	err := r.db.QueryRowContext(ctx, QueryGetAccountByName, name).Scan(
		&a.ID,
		&a.ChannelID,
		&a.Name,
		&a.Instrument,
		&a.CreatedAt,
		&a.UpdatedAt,
		&a.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, apperrors.ErrNotFound
		}
		return nil, err
	}

	return &a, nil

}

func (r *SQLiteRepo) HardDeleteAccount(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, QueryHardDeleteAccount, id)
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

func (r SQLiteRepo) HardDeleteChannel(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, QueryHardDeleteChannel, id)
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
