package finance

import (
	"context"
	"database/sql"
	"fmt"
	"time"
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

func (r *SQLiteRepo) ListChannelsWithAccounts(ctx context.Context) ([]ChannelWithAccounts, error) {
	rows, err := r.db.QueryContext(ctx, QueryListChannelsWithAccounts)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ChannelWithAccounts
	var lastID string

	for rows.Next() {
		var ch Channel
		var aID, aName, aInstrument, aLastFour *string
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
			&aLastFour,
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
				LastFour:   aLastFour,
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

func (r *SQLiteRepo) ListCategoriesWithSubcategories(ctx context.Context) ([]CategoryWithSubcategories, error) {
	rows, err := r.db.QueryContext(ctx, QueryListCategoriesWithSubcategories)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []CategoryWithSubcategories
	var lastID string

	for rows.Next() {
		var c Category
		var sID, sName *string
		var sCreatedAt, sUpdatedAt, sDeletedAt *time.Time

		err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.CreatedAt,
			&c.UpdatedAt,
			&c.DeletedAt,
			&sID,
			&sName,
			&sCreatedAt,
			&sUpdatedAt,
			&sDeletedAt,
		)
		if err != nil {
			return nil, err
		}

		if c.ID != lastID {
			result = append(result, CategoryWithSubcategories{
				Category:      c,
				Subcategories: []Subcategory{},
			})
			lastID = c.ID
		}

		if sID != nil {
			sub := Subcategory{
				ID:         *sID,
				CategoryID: c.ID,
				Name:       *sName,
				CreatedAt:  *sCreatedAt,
				UpdatedAt:  sUpdatedAt,
				DeletedAt:  sDeletedAt,
			}
			result[len(result)-1].Subcategories = append(result[len(result)-1].Subcategories, sub)
		}
	}
	return result, rows.Err()
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

func (r *SQLiteRepo) CreateTransactionAggregate(ctx context.Context, agg TransactionAggregate) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}

	defer tx.Rollback()

	if len(agg.Items) == 0 {
		return fmt.Errorf("at least one item is required: %w", ErrInvalidField)
	}

	entry := agg.Items[0].Entry

	if entry.AccountID != nil && *entry.AccountID != "" {
		var account Account
		err := tx.QueryRowContext(ctx, QueryGetAccountByID, *entry.AccountID).Scan(
			&account.ID, &account.ChannelID, &account.Name, &account.Instrument, &account.LastFour, &account.CreatedAt, &account.UpdatedAt, &account.DeletedAt,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("account not found: %w", ErrNotFound)
			}
			return err
		}
		if account.ChannelID != entry.ChannelID && entry.ChannelID != "" {
			return fmt.Errorf("account does not belong to channel: %w", ErrInvalidField)
		}
	}

	if entry.SubcategoryID != nil && *entry.SubcategoryID != "" {
		var subcategory Subcategory
		err := tx.QueryRowContext(ctx, QueryGetSubcategoryByID, *entry.SubcategoryID).Scan(
			&subcategory.ID, &subcategory.CategoryID, &subcategory.Name, &subcategory.CreatedAt, &subcategory.UpdatedAt, &subcategory.DeletedAt,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("subcategory not found: %w", ErrNotFound)
			}
			return err
		}
		if entry.CategoryID != nil && *entry.CategoryID != "" {
			if subcategory.CategoryID != *entry.CategoryID {
				return fmt.Errorf("subcategory does not belong to category: %w", ErrInvalidField)
			}
		}
	}

	if agg.Group != nil {
		_, err := tx.ExecContext(ctx, QueryCreateInstallmentGroup,
			agg.Group.ID,
			agg.Group.TotalInstallments,
			agg.Group.StartDate,
			agg.Group.CreatedAt,
		)
		if err != nil {
			return err
		}

		for _, i := range agg.Items {
			_, err = tx.ExecContext(ctx, QueryCreateTransaction,
				i.Transaction.ID,
				i.Transaction.Date,
				i.Transaction.Description,
				i.Transaction.Type,
				i.Transaction.Frequency,
				i.Transaction.InstallmentGroupID,
				i.Transaction.InstallmentNumber,
				i.Transaction.CreatedAt,
			)
			if err != nil {
				return err
			}

			_, err := tx.ExecContext(ctx, QueryCreateEntry,
				i.Entry.ID,
				i.Entry.TransactionID,
				i.Entry.ChannelID,
				i.Entry.AccountID,
				i.Entry.Amount,
				i.Entry.Currency,
				i.Entry.ExchangeRate,
				i.Entry.CategoryID,
				i.Entry.SubcategoryID,
				i.Entry.CreatedAt,
			)
			if err != nil {
				return err
			}
		}

	} else {
		_, err = tx.ExecContext(ctx, QueryCreateTransaction,
			agg.Items[0].Transaction.ID,
			agg.Items[0].Transaction.Date,
			agg.Items[0].Transaction.Description,
			agg.Items[0].Transaction.Type,
			agg.Items[0].Transaction.Frequency,
			nil,
			nil,
			agg.Items[0].Transaction.CreatedAt,
		)
		if err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, QueryCreateEntry,
			agg.Items[0].Entry.ID,
			agg.Items[0].Entry.TransactionID,
			agg.Items[0].Entry.ChannelID,
			agg.Items[0].Entry.AccountID,
			agg.Items[0].Entry.Amount,
			agg.Items[0].Entry.Currency,
			agg.Items[0].Entry.ExchangeRate,
			agg.Items[0].Entry.CategoryID,
			agg.Items[0].Entry.SubcategoryID,
			agg.Items[0].Entry.CreatedAt,
		)
		if err != nil {
			return err
		}

	}

	return tx.Commit()
}

func (r *SQLiteRepo) ListTransactionsAggregate(ctx context.Context, filter *Filter) ([]TransactionRowDTO, error) {
	query := BuildListTransactionsQuery(filter)
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var transactions []TransactionRowDTO
	for rows.Next() {
		var t TransactionRowDTO
		var amountCents int64
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.EntryID,
			&amountCents,
			&t.Currency,
			&t.ExchangeRate,
			&t.CategoryID,
			&t.SubcategoryID,
			&t.ChannelID,
			&t.AccountID,
			&t.CategoryName,
			&t.SubcategoryName,
			&t.AccountName,
			&t.ChannelName,
			&t.InstallmentNumber,
			&t.TotalInstallments,
			&t.InstallmentGroupID,
		)
		if err != nil {
			return nil, err
		}
		t.Amount = FormatAmount(amountCents)
		transactions = append(transactions, t)
	}
	return transactions, rows.Err()
}

func (r *SQLiteRepo) GetTransactionAggregate(ctx context.Context, id string) (*TransactionRowDTO, error) {
	var t TransactionRowDTO
	var amountCents int64
	err := r.db.QueryRowContext(ctx, QueryGetTransactionDTOByID, id).Scan(
		&t.ID,
		&t.Date,
		&t.Description,
		&t.Type,
		&t.Frequency,
		&t.EntryID,
		&amountCents,
		&t.Currency,
		&t.ExchangeRate,
		&t.CategoryID,
		&t.SubcategoryID,
		&t.ChannelID,
		&t.AccountID,
		&t.CategoryName,
		&t.SubcategoryName,
		&t.AccountName,
		&t.ChannelName,
		&t.InstallmentNumber,
		&t.TotalInstallments,
		&t.InstallmentGroupID,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	t.Amount = FormatAmount(amountCents)

	return &t, nil

}

func (r *SQLiteRepo) GetTransactionsByInstallmentGroup(ctx context.Context, groupID string, fromInstallment int) ([]TransactionRowDTO, error) {
	rows, err := r.db.QueryContext(ctx, QueryGetTransactionsByInstallmentGroup, groupID, fromInstallment)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []TransactionRowDTO
	for rows.Next() {
		var t TransactionRowDTO
		var amountCents int64
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.EntryID,
			&amountCents,
			&t.Currency,
			&t.ExchangeRate,
			&t.CategoryID,
			&t.SubcategoryID,
			&t.ChannelID,
			&t.AccountID,
			&t.CategoryName,
			&t.SubcategoryName,
			&t.AccountName,
			&t.ChannelName,
			&t.InstallmentNumber,
			&t.TotalInstallments,
			&t.InstallmentGroupID,
		)
		if err != nil {
			return nil, err
		}
		t.Amount = FormatAmount(amountCents)
		transactions = append(transactions, t)
	}
	return transactions, rows.Err()
}

func (r *SQLiteRepo) DeleteTransactionAggregate(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer tx.Rollback()
	var t Transaction
	err = tx.QueryRowContext(ctx, QueryGetTransactionByID, id).Scan(
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
			return ErrNotFound
		}
		return err
	}

	if t.InstallmentGroupID != nil {
		result, err := tx.ExecContext(ctx, QueryDeleteInstallmentGroup, t.InstallmentGroupID)
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
	} else {
		result, err := tx.ExecContext(ctx, QueryDeleteTransaction, t.ID)
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
	}
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *SQLiteRepo) DeleteTransactionsByInstallmentGroup(ctx context.Context, groupID string, fromInstallment int) error {
	_, err := r.db.ExecContext(ctx, QueryDeleteTransactionsByInstallmentGroup, groupID, fromInstallment)
	if err != nil {
		return err
	}
	return nil
}

func (r *SQLiteRepo) CancelInstallments(ctx context.Context, agg TransactionAggregate, groupID string, fromInstallment int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(ctx, QueryGetTransactionsByInstallmentGroup, groupID, fromInstallment)
	if err != nil {
		return err
	}

	var txIDs []string
	var totalAmount int64
	for rows.Next() {
		var t TransactionRowDTO
		var amountCents int64
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.EntryID,
			&amountCents,
			&t.Currency,
			&t.ExchangeRate,
			&t.CategoryID,
			&t.SubcategoryID,
			&t.ChannelID,
			&t.AccountID,
			&t.CategoryName,
			&t.SubcategoryName,
			&t.AccountName,
			&t.ChannelName,
			&t.InstallmentNumber,
			&t.TotalInstallments,
			&t.InstallmentGroupID,
		)
		if err != nil {
			rows.Close()
			return err
		}
		txIDs = append(txIDs, t.ID)
		txIDs = append(txIDs, t.EntryID)
		totalAmount += amountCents
	}
	rows.Close()

	if len(txIDs) == 0 {
		return ErrNotFound
	}

	for _, item := range agg.Items {
		_, err = tx.ExecContext(ctx, QueryCreateTransaction,
			item.Transaction.ID,
			item.Transaction.Date,
			item.Transaction.Description,
			item.Transaction.Type,
			item.Transaction.Frequency,
			item.Transaction.InstallmentGroupID,
			item.Transaction.InstallmentNumber,
			item.Transaction.CreatedAt,
		)
		if err != nil {
			return err
		}

		_, err = tx.ExecContext(ctx, QueryCreateEntry,
			item.Entry.ID,
			item.Entry.TransactionID,
			item.Entry.ChannelID,
			item.Entry.AccountID,
			totalAmount,
			item.Entry.Currency,
			item.Entry.ExchangeRate,
			item.Entry.CategoryID,
			item.Entry.SubcategoryID,
			item.Entry.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	for i := 0; i < len(txIDs); i += 2 {
		_, err = tx.ExecContext(ctx, QueryDeleteTransaction, txIDs[i])
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *SQLiteRepo) UpdateTransactionAggregate(ctx context.Context, id string, agg TransactionAggregate) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var t Transaction
	err = tx.QueryRowContext(ctx, QueryGetTransactionByID, id).Scan(
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
			return ErrNotFound
		}
		return err
	}

	if len(agg.Items) == 0 {
		return fmt.Errorf("at least one item is required: %w", ErrInvalidField)
	}

	entry := agg.Items[0].Entry

	if entry.AccountID != nil && *entry.AccountID != "" {
		var account Account
		err := tx.QueryRowContext(ctx, QueryGetAccountByID, *entry.AccountID).Scan(
			&account.ID, &account.ChannelID, &account.Name, &account.Instrument, &account.LastFour, &account.CreatedAt, &account.UpdatedAt, &account.DeletedAt,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("account not found: %w", ErrNotFound)
			}
			return err
		}
		if account.ChannelID != entry.ChannelID && entry.ChannelID != "" {
			return fmt.Errorf("account does not belong to channel: %w", ErrInvalidField)
		}
	}

	if entry.SubcategoryID != nil && *entry.SubcategoryID != "" {
		var subcategory Subcategory
		err := tx.QueryRowContext(ctx, QueryGetSubcategoryByID, *entry.SubcategoryID).Scan(
			&subcategory.ID, &subcategory.CategoryID, &subcategory.Name, &subcategory.CreatedAt, &subcategory.UpdatedAt, &subcategory.DeletedAt,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("subcategory not found: %w", ErrNotFound)
			}
			return err
		}
		if entry.CategoryID != nil && *entry.CategoryID != "" {
			if subcategory.CategoryID != *entry.CategoryID {
				return fmt.Errorf("subcategory does not belong to category: %w", ErrInvalidField)
			}
		}
	}

	if t.InstallmentGroupID != nil {
		_, err = tx.ExecContext(ctx, QueryDeleteInstallmentGroup, *t.InstallmentGroupID)
	} else {
		_, err = tx.ExecContext(ctx, QueryDeleteTransaction, t.ID)
	}
	if err != nil {
		return err
	}

	if agg.Group != nil {
		_, err := tx.ExecContext(ctx, QueryCreateInstallmentGroup,
			agg.Group.ID,
			agg.Group.TotalInstallments,
			agg.Group.StartDate,
			agg.Group.CreatedAt,
		)
		if err != nil {
			return err
		}

		for _, i := range agg.Items {
			_, err = tx.ExecContext(ctx, QueryCreateTransaction,
				i.Transaction.ID,
				i.Transaction.Date,
				i.Transaction.Description,
				i.Transaction.Type,
				i.Transaction.Frequency,
				i.Transaction.InstallmentGroupID,
				i.Transaction.InstallmentNumber,
				i.Transaction.CreatedAt,
			)
			if err != nil {
				return err
			}

			_, err = tx.ExecContext(ctx, QueryCreateEntry,
				i.Entry.ID,
				i.Transaction.ID,
				i.Entry.ChannelID,
				i.Entry.AccountID,
				i.Entry.Amount,
				i.Entry.Currency,
				i.Entry.ExchangeRate,
				i.Entry.CategoryID,
				i.Entry.SubcategoryID,
				i.Entry.CreatedAt,
			)
			if err != nil {
				return err
			}
		}

	} else {
		i := agg.Items[0]
		_, err = tx.ExecContext(ctx, QueryCreateTransaction,
			i.Transaction.ID,
			i.Transaction.Date,
			i.Transaction.Description,
			i.Transaction.Type,
			i.Transaction.Frequency,
			nil,
			nil,
			i.Transaction.CreatedAt,
		)
		if err != nil {
			return err
		}

		_, err = tx.ExecContext(ctx, QueryCreateEntry,
			i.Entry.ID,
			i.Transaction.ID,
			i.Entry.ChannelID,
			i.Entry.AccountID,
			i.Entry.Amount,
			i.Entry.Currency,
			i.Entry.ExchangeRate,
			i.Entry.CategoryID,
			i.Entry.SubcategoryID,
			i.Entry.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
