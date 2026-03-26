package finance

import (
	"context"
	"database/sql"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) CreateTransaction(ctx context.Context, t Transaction) (*Transaction, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateTransaction,
		t.ID,
		t.Date,
		t.Description,
		t.Type,
		t.Frequency,
		t.InstallmentGroupID,
		t.InstallmentNumber,
		t.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
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
		&t.CreatedAt,
		&t.UpdatedAt,
		&t.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
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
		return ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) CreateEntry(ctx context.Context, e Entry) (*Entry, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateEntry,
		e.ID,
		e.TransactionID,
		e.AccountID,
		e.AmountARS,
		e.AmountUSD,
		e.ExchangeRate,
		e.CategoryID,
		e.SubcategoryID,
		e.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *SQLiteRepo) GetEntryByID(ctx context.Context, id string) (*Entry, error) {
	var e Entry

	err := r.db.QueryRowContext(ctx, QueryGetEntryByID, id).Scan(
		&e.ID,
		&e.TransactionID,
		&e.AccountID,
		&e.AmountARS,
		&e.AmountUSD,
		&e.ExchangeRate,
		&e.CategoryID,
		&e.SubcategoryID,
		&e.CreatedAt,
		&e.UpdatedAt,
		&e.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
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
			&e.AccountID,
			&e.AmountARS,
			&e.AmountUSD,
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
		e.AccountID,
		e.AmountARS,
		e.AmountUSD,
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
		return ErrNotFound
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
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &c, nil
}

func (r *SQLiteRepo) ListChannels(ctx context.Context) ([]Channel, error) {
	rows, err := r.db.QueryContext(ctx, QueryListChannels)
	if err != nil {
		return nil, err
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

func (r *SQLiteRepo) DeleteChannel(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteChannel, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) CreateAccount(ctx context.Context, a Account) (*Account, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateAccount,
		a.ID,
		a.ChannelID,
		a.Name,
		a.Instrument,
		a.LastFour,
		a.CreatedAt,
	)
	if err != nil {
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
		&a.LastFour,
		&a.CreatedAt,
		&a.UpdatedAt,
		&a.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &a, nil
}

func (r *SQLiteRepo) ListAccounts(ctx context.Context) ([]Account, error) {
	rows, err := r.db.QueryContext(ctx, QueryListAccounts)
	if err != nil {
		return nil, err
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
			&a.LastFour,
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
		a.LastFour,
		a.UpdatedAt,
		a.DeletedAt,
		a.ID,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *SQLiteRepo) DeleteAccount(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteAccount, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) CreateCategory(ctx context.Context, c Category) (*Category, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateCategory,
		c.ID,
		c.Name,
		c.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SQLiteRepo) GetCategoryByID(ctx context.Context, id string) (*Category, error) {
	var c Category

	err := r.db.QueryRowContext(ctx, QueryGetCategoryByID, id).Scan(
		&c.ID,
		&c.Name,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &c, nil
}

func (r *SQLiteRepo) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := r.db.QueryContext(ctx, QueryListCategories)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category

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

		categories = append(categories, c)
	}
	return categories, rows.Err()
}

func (r *SQLiteRepo) UpdateCategory(ctx context.Context, c Category) (*Category, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateCategory,
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

func (r *SQLiteRepo) DeleteCategory(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteCategory, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) CreateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateSubcategory,
		s.ID,
		s.CategoryID,
		s.Name,
		s.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SQLiteRepo) GetSubcategoryByID(ctx context.Context, id string) (*Subcategory, error) {
	var s Subcategory

	err := r.db.QueryRowContext(ctx, QueryGetSubcategoryByID, id).Scan(
		&s.ID,
		&s.CategoryID,
		&s.Name,
		&s.CreatedAt,
		&s.UpdatedAt,
		&s.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &s, nil
}

func (r *SQLiteRepo) ListSubcategories(ctx context.Context) ([]Subcategory, error) {
	rows, err := r.db.QueryContext(ctx, QueryListSubcategories)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subcategories []Subcategory
	for rows.Next() {
		var s Subcategory

		err := rows.Scan(
			&s.ID,
			&s.CategoryID,
			&s.Name,
			&s.CreatedAt,
			&s.UpdatedAt,
			&s.DeletedAt,
		)
		if err != nil {
			return nil, err
		}

		subcategories = append(subcategories, s)
	}
	return subcategories, rows.Err()
}

func (r *SQLiteRepo) UpdateSubcategory(ctx context.Context, s Subcategory) (*Subcategory, error) {
	_, err := r.db.ExecContext(ctx, QueryUpdateSubcategory,
		s.CategoryID,
		s.Name,
		s.UpdatedAt,
		s.DeletedAt,
		s.ID,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SQLiteRepo) DeleteSubcategory(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, QueryDeleteSubcategory, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SQLiteRepo) CreateInstallmentGroup(ctx context.Context, ig InstallmentGroup) (*InstallmentGroup, error) {
	_, err := r.db.ExecContext(ctx, QueryCreateInstallmentGroup,
		ig.ID,
		ig.TotalInstallments,
		ig.StartDate,
		ig.CreatedAt,
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
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
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
		return ErrNotFound
	}
	return nil
}
