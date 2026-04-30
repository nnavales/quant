package finance

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/money"
	"github.com/nnavales/summit/api/transactions"
	"github.com/oklog/ulid/v2"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{
		db: db,
	}
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
		var account channels.Account
		err := tx.QueryRowContext(ctx, channels.QueryGetAccountByID, *entry.AccountID).Scan(
			&account.ID, &account.ChannelID, &account.Name, &account.Instrument, &account.CreatedAt, &account.UpdatedAt, &account.DeletedAt,
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
		var subcategory categories.Subcategory
		err := tx.QueryRowContext(ctx, categories.QueryGetSubcategoryByID, *entry.SubcategoryID).Scan(
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
		_, err := tx.ExecContext(ctx, installments.QueryCreateInstallmentGroup,
			agg.Group.ID,
			agg.Group.TotalInstallments,
			agg.Group.StartDate,
			agg.Group.CreatedAt,
			agg.Group.OriginalAmount,
			agg.Group.Description,
			agg.Group.Currency,
			agg.Group.IsCanceled,
		)
		if err != nil {
			return err
		}

		for _, i := range agg.Items {
			_, err = tx.ExecContext(ctx, transactions.QueryCreateTransaction,
				i.Transaction.ID,
				i.Transaction.Date,
				i.Transaction.Description,
				i.Transaction.Type,
				i.Transaction.Frequency,
				i.Transaction.InstallmentGroupID,
				i.Transaction.InstallmentNumber,
				i.Transaction.IsPaid,
				i.Transaction.CreatedAt,
			)
			if err != nil {
				return err
			}

			_, err := tx.ExecContext(ctx, entries.QueryCreateEntry,
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
		_, err = tx.ExecContext(ctx, transactions.QueryCreateTransaction,
			agg.Items[0].Transaction.ID,
			agg.Items[0].Transaction.Date,
			agg.Items[0].Transaction.Description,
			agg.Items[0].Transaction.Type,
			agg.Items[0].Transaction.Frequency,
			nil,
			nil,
			agg.Items[0].Transaction.IsPaid,
			agg.Items[0].Transaction.CreatedAt,
		)
		if err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, entries.QueryCreateEntry,
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

func (r *SQLiteRepo) ListTransactionsAggregate(ctx context.Context, filter *Filter) (*TransactionListResponse, error) {
	query, args := BuildListTransactionsQuery(filter)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var transactions []TransactionRowDTO
	for rows.Next() {
		var t TransactionRowDTO
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.IsPaid,
			&t.EntryID,
			&t.Amount,
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
			&t.InstallmentStartDate,
			&t.InstallmentGroupID,
			&t.IsCanceled,
			&t.OriginalAmount,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}

	countQuery, countArgs := buildCountQuery(filter)
	var totalCount int
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&totalCount); err != nil {
		return nil, err
	}

	return &TransactionListResponse{
		Data:       transactions,
		TotalCount: totalCount,
	}, rows.Err()
}

func (r *SQLiteRepo) GetTransactionAggregate(ctx context.Context, id string) (*TransactionRowDTO, error) {
	var t TransactionRowDTO
	err := r.db.QueryRowContext(ctx, QueryGetTransactionDTOByID, id).Scan(
		&t.ID,
		&t.Date,
		&t.Description,
		&t.Type,
		&t.Frequency,
		&t.IsPaid,
		&t.EntryID,
		&t.Amount,
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
		&t.InstallmentStartDate,
		&t.InstallmentGroupID,
		&t.IsCanceled,
		&t.OriginalAmount,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &t, nil

}

func (r *SQLiteRepo) GetTransactionsByInstallmentGroup(ctx context.Context, groupID string) ([]TransactionRowDTO, error) {
	rows, err := r.db.QueryContext(ctx, QueryGetTransactionsByInstallmentGroup, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []TransactionRowDTO
	for rows.Next() {
		var t TransactionRowDTO
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.IsPaid,
			&t.EntryID,
			&t.Amount,
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
			&t.InstallmentStartDate,
			&t.InstallmentGroupID,
			&t.IsCanceled,
			&t.OriginalAmount,
		)
		if err != nil {
			return nil, err
		}
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
	var t transactions.Transaction
	err = tx.QueryRowContext(ctx, transactions.QueryGetTransactionByID, id).Scan(
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
			return ErrNotFound
		}
		return err
	}

	if t.InstallmentGroupID != nil {
		result, err := tx.ExecContext(ctx, installments.QueryDeleteInstallmentGroup, t.InstallmentGroupID)
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
		result, err := tx.ExecContext(ctx, transactions.QueryDeleteTransaction, t.ID)
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

	return tx.Commit()
}

func (r *SQLiteRepo) DeleteTransactionsByInstallmentGroup(ctx context.Context, groupID string, fromInstallment int) error {
	_, err := r.db.ExecContext(ctx, QueryDeleteTransactionsByInstallmentGroup, groupID, fromInstallment)
	if err != nil {
		return err
	}
	return nil
}

func (r *SQLiteRepo) CancelInstallments(ctx context.Context, groupID string, fromInstallment int, now time.Time) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(ctx, QueryGetTransactionsByInstallmentGroup, groupID, fromInstallment)
	if err != nil {
		return err
	}
	var trans []TransactionRowDTO
	for rows.Next() {
		var t TransactionRowDTO
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.IsPaid,
			&t.EntryID,
			&t.Amount,
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
			&t.InstallmentStartDate,
			&t.InstallmentGroupID,
			&t.IsCanceled,
			&t.OriginalAmount,
		)
		if err != nil {
			rows.Close()
			return err
		}

		trans = append(trans, t)
	}
	rows.Close()

	if len(trans) == 0 {
		return ErrNotFound
	}

	base := trans[0]

	var canceledAmount money.Money
	for _, t := range trans {
		if *t.InstallmentNumber >= fromInstallment {
			canceledAmount = canceledAmount.Add(t.Amount)
		}
	}

	newTxID := ulid.Make().String()
	newEntryID := ulid.Make().String()

	_, err = tx.ExecContext(ctx, transactions.QueryCreateTransaction,
		newTxID,
		base.Date,
		base.Description,
		base.Type,
		base.Frequency,
		base.InstallmentGroupID,
		nil,
		true,
		now,
	)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, entries.QueryCreateEntry,
		newEntryID,
		newTxID,
		base.ChannelID,
		base.AccountID,
		canceledAmount,
		base.Currency,
		base.ExchangeRate,
		base.CategoryID,
		base.SubcategoryID,
		now,
	)
	if err != nil {
		return err
	}

	for _, t := range trans {
		if *t.InstallmentNumber >= fromInstallment {
			_, err := tx.ExecContext(ctx, transactions.QueryDeleteTransaction, t.ID)
			if err != nil {
				return err
			}
		} else {
			_, err := tx.ExecContext(ctx, transactions.QueryMarkAsPaid,
				now,
				t.ID,
			)
			if err != nil {
				return err
			}
		}
	}

	_, err = tx.ExecContext(ctx, installments.QuerySetCancelled, now, true, base.InstallmentGroupID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// Update Transacction receives two parameters ID:String to find the correct resources to update
// agg:TransactionAggregate which has all the updated fields to recalculate the transacction
// agg containts Installment Group as a posibility and Items.
// Item constains Transaction and the Entity for the transacction.
// In case of installments it should contain more than one item on the slice otherwise it should only contain one item.
func (r *SQLiteRepo) UpdateTransactionAggregate(ctx context.Context, id string, agg TransactionAggregate) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if len(agg.Items) == 0 {
		return fmt.Errorf("at least one item is required: %w", ErrInvalidField)
	}

	oldTx, err := getTransactionByID(ctx, tx, id)
	if err != nil {
		return err
	}

	type item struct {
		Transaction transactions.Transaction
		Entry       entries.Entry
	}
	var oldItems []item

	if oldTx.InstallmentGroupID != nil {
		oldTxs, err := listTransactionsByInstallmentGroupID(ctx, tx, *oldTx.InstallmentGroupID)
		if err != nil {
			return err
		}
		for _, t := range oldTxs {
			e, err := getEntryByTransactionID(ctx, tx, t.ID)
			if err != nil {
				return err
			}
			oldItems = append(oldItems, item{Transaction: t, Entry: *e})
		}
	} else {
		e, err := getEntryByTransactionID(ctx, tx, oldTx.ID)
		if err != nil {
			return err
		}
		oldItems = append(oldItems, item{Transaction: *oldTx, Entry: *e})
	}

	if len(oldItems) == 0 {
		return fmt.Errorf("not found old items for the transacction you want to update")
	}

	oldGroupID := oldTx.InstallmentGroupID
	newGroup := agg.Group
	newItems := agg.Items

	var finalGroupID *string
	shouldDeleteGroup := false

	switch {
	case oldGroupID != nil && newGroup != nil:
		newGroup.ID = *oldGroupID
		if err := updateInstallmentGroup(ctx, tx, newGroup); err != nil {
			return mapDBError(err)
		}
		finalGroupID = &newGroup.ID

	case oldGroupID != nil && newGroup == nil:
		finalGroupID = nil
		shouldDeleteGroup = true

	case oldGroupID == nil && newGroup != nil:
		if err := createInstallmentGroup(ctx, tx, newGroup); err != nil {
			return mapDBError(err)
		}
		finalGroupID = &newGroup.ID
	}

	minItems := len(oldItems)
	if len(newItems) < minItems {
		minItems = len(newItems)
	}

	for i := 0; i < minItems; i++ {
		newItems[i].Transaction.ID = oldItems[i].Transaction.ID
		newItems[i].Entry.ID = oldItems[i].Entry.ID
		newItems[i].Entry.TransactionID = oldItems[i].Transaction.ID
		newItems[i].Transaction.InstallmentGroupID = finalGroupID

		if err := updateTransaction(ctx, tx, &newItems[i].Transaction); err != nil {
			return mapDBError(err)
		}
		if err := updateEntry(ctx, tx, &newItems[i].Entry); err != nil {
			return mapDBError(err)
		}
	}

	if len(oldItems) > len(newItems) {
		for i := len(newItems); i < len(oldItems); i++ {
			if err := deleteEntry(ctx, tx, oldItems[i].Entry.ID); err != nil {
				return mapDBError(err)
			}
			if err := deleteTransaction(ctx, tx, oldItems[i].Transaction.ID); err != nil {
				return mapDBError(err)
			}
		}
	}

	if len(newItems) > len(oldItems) {
		for i := len(oldItems); i < len(newItems); i++ {
			newItems[i].Transaction.InstallmentGroupID = finalGroupID

			if err := createTransaction(ctx, tx, &newItems[i].Transaction); err != nil {
				return mapDBError(err)
			}

			newItems[i].Entry.TransactionID = newItems[i].Transaction.ID

			if err := createEntry(ctx, tx, &newItems[i].Entry); err != nil {
				return mapDBError(err)
			}
		}
	}

	if shouldDeleteGroup {
		if err := deleteInstallmentGroup(ctx, tx, *oldGroupID); err != nil && err != ErrNotFound {
			return mapDBError(err)
		}
	}

	return tx.Commit()
}

func (r *SQLiteRepo) ListHistoricalEntries(ctx context.Context, filter *Filter) (*HistoricalListResponse, error) {
	query, args := BuildListHistoricalEntriesQuery(filter)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var histEntry []HistoricalRowDTO
	for rows.Next() {
		var h HistoricalRowDTO
		err := rows.Scan(
			&h.Month,
			&h.ExchangeRate,
			&h.Income,
			&h.IncomeFixed,
			&h.IncomeVariable,
			&h.Expense,
			&h.ExpenseFixed,
			&h.ExpenseVariable,
			&h.Savings,
			&h.Source,
		)
		if err != nil {
			return nil, err
		}
		histEntry = append(histEntry, h)
	}

	countQuery, countArgs := buildHistoricalCountQuery(filter)
	var totalCount int
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&totalCount); err != nil {
		return nil, err
	}

	return &HistoricalListResponse{
		Data:       histEntry,
		TotalCount: totalCount,
	}, rows.Err()
}

func (r *SQLiteRepo) BulkCreateTransactionAggregate(ctx context.Context, txs []TransactionAggregate) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}

	defer tx.Rollback()

	if len(txs) == 0 {
		return fmt.Errorf("at least one transaction is required: %w", ErrInvalidField)
	}

	for _, agg := range txs {
		if len(agg.Items) == 0 {
			return fmt.Errorf("at least one item is required: %w", ErrInvalidField)
		}

		if agg.Group != nil {
			_, err := tx.ExecContext(ctx, installments.QueryCreateInstallmentGroup,
				agg.Group.ID,
				agg.Group.TotalInstallments,
				agg.Group.StartDate,
				agg.Group.CreatedAt,
				agg.Group.OriginalAmount,
				agg.Group.Description,
				agg.Group.Currency,
				agg.Group.IsCanceled,
			)
			if err != nil {
				return err
			}

			for _, i := range agg.Items {
				_, err = tx.ExecContext(ctx, transactions.QueryCreateTransaction,
					i.Transaction.ID,
					i.Transaction.Date,
					i.Transaction.Description,
					i.Transaction.Type,
					i.Transaction.Frequency,
					i.Transaction.InstallmentGroupID,
					i.Transaction.InstallmentNumber,
					i.Transaction.IsPaid,
					i.Transaction.CreatedAt,
				)
				if err != nil {
					return err
				}

				_, err := tx.ExecContext(ctx, entries.QueryCreateEntry,
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
			_, err = tx.ExecContext(ctx, transactions.QueryCreateTransaction,
				agg.Items[0].Transaction.ID,
				agg.Items[0].Transaction.Date,
				agg.Items[0].Transaction.Description,
				agg.Items[0].Transaction.Type,
				agg.Items[0].Transaction.Frequency,
				nil,
				nil,
				agg.Items[0].Transaction.IsPaid,
				agg.Items[0].Transaction.CreatedAt,
			)
			if err != nil {
				return err
			}

			_, err := tx.ExecContext(ctx, entries.QueryCreateEntry,
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
	}

	return tx.Commit()
}

func listTransactionsByInstallmentGroupID(ctx context.Context, tx *sql.Tx, id string) ([]transactions.Transaction, error) {
	rows, err := tx.QueryContext(ctx, transactions.QueryListTransactionsByInstallmentGroupID, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []transactions.Transaction
	for rows.Next() {
		var t transactions.Transaction
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
		txs = append(txs, t)
	}
	return txs, rows.Err()
}

func getEntryByTransactionID(ctx context.Context, tx *sql.Tx, id string) (*entries.Entry, error) {
	row := tx.QueryRowContext(ctx, entries.QueryGetEntryByTransacctionID, id)
	var e entries.Entry
	err := row.Scan(
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

	return &e, nil
}

func getInstallmentGroupByID(ctx context.Context, tx *sql.Tx, id string) (*installments.InstallmentGroup, error) {
	var ig installments.InstallmentGroup

	err := tx.QueryRowContext(ctx, installments.QueryGetInstallmentGroupByID, id).Scan(
		&ig.ID,
		&ig.TotalInstallments,
		&ig.StartDate,
		&ig.CreatedAt,
		&ig.UpdatedAt,
		&ig.DeletedAt,
		&ig.OriginalAmount,
		&ig.Description,
		&ig.Currency,
		&ig.IsCanceled,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &ig, nil
}

func updateInstallmentGroup(ctx context.Context, tx *sql.Tx, ig *installments.InstallmentGroup) error {
	_, err := tx.ExecContext(ctx, installments.QueryUpdateInstallmentGroup,
		ig.TotalInstallments,
		ig.StartDate,
		ig.UpdatedAt,
		ig.DeletedAt,
		ig.OriginalAmount,
		ig.Description,
		ig.Currency,
		ig.IsCanceled,
		ig.ID,
	)
	if err != nil {
		return err
	}
	return nil
}

func deleteInstallmentGroup(ctx context.Context, tx *sql.Tx, id string) error {
	result, err := tx.ExecContext(ctx, installments.QueryDeleteInstallmentGroup, id)
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

func getTransactionByID(ctx context.Context, tx *sql.Tx, id string) (*transactions.Transaction, error) {
	var t transactions.Transaction
	err := tx.QueryRowContext(ctx, transactions.QueryGetTransactionByID, id).Scan(
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
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

func updateTransaction(ctx context.Context, tx *sql.Tx, t *transactions.Transaction) error {
	_, err := tx.ExecContext(ctx, transactions.QueryUpdateTransaction,
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
		return err
	}
	return nil
}

func deleteTransaction(ctx context.Context, tx *sql.Tx, id string) error {
	result, err := tx.ExecContext(ctx, transactions.QueryDeleteTransaction, id)
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

func updateEntry(ctx context.Context, tx *sql.Tx, e *entries.Entry) error {
	_, err := tx.ExecContext(ctx, entries.QueryUpdateEntry,
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
		return err
	}
	return nil
}

func deleteEntry(ctx context.Context, tx *sql.Tx, id string) error {
	result, err := tx.ExecContext(ctx, entries.QueryDeleteEntry, id)
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

func createInstallmentGroup(ctx context.Context, tx *sql.Tx, ig *installments.InstallmentGroup) error {
	_, err := tx.ExecContext(ctx, installments.QueryCreateInstallmentGroup,
		ig.ID,
		ig.TotalInstallments,
		ig.StartDate,
		ig.CreatedAt,
		ig.OriginalAmount,
		ig.Description,
		ig.Currency,
		ig.IsCanceled,
	)
	if err != nil {
		return err
	}
	return nil
}

func createTransaction(ctx context.Context, tx *sql.Tx, t *transactions.Transaction) error {
	_, err := tx.ExecContext(ctx, transactions.QueryCreateTransaction,
		t.ID,
		t.Date,
		t.Description,
		t.Type,
		t.Frequency,
		t.InstallmentGroupID,
		t.InstallmentNumber,
		t.IsPaid,
		t.CreatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}

func createEntry(ctx context.Context, tx *sql.Tx, e *entries.Entry) error {
	_, err := tx.ExecContext(ctx, entries.QueryCreateEntry,
		e.ID,
		e.TransactionID,
		e.ChannelID,
		e.AccountID,
		e.Amount,
		e.Currency,
		e.ExchangeRate,
		e.CategoryID,
		e.SubcategoryID,
		e.CreatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}

func mapDBError(err error) error {
	if err == nil {
		return nil
	}

	if strings.Contains(err.Error(), "FOREIGN KEY constraint failed") {
		return fmt.Errorf("invalid reference: %w", ErrInvalidField)
	}

	if strings.Contains(err.Error(), "UNIQUE constraint failed") {
		return fmt.Errorf("duplicate value: %w", ErrAlreadyExists)
	}

	return err
}

func (r *SQLiteRepo) ListTransactionsAggRaw(ctx context.Context) ([]TransactionRowDTO, error) {
	rows, err := r.db.QueryContext(ctx, baseListTransactionsDTO)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var transactions []TransactionRowDTO
	for rows.Next() {
		var t TransactionRowDTO
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.IsPaid,
			&t.EntryID,
			&t.Amount,
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
			&t.InstallmentStartDate,
			&t.InstallmentGroupID,
			&t.IsCanceled,
			&t.OriginalAmount,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}

	return transactions, rows.Err()
}

func (r *SQLiteRepo) ListHistoricalEntriesRaw(ctx context.Context) ([]HistoricalRowDTO, error) {
	rows, err := r.db.QueryContext(ctx, baseListHistoricalDTO)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var histEntry []HistoricalRowDTO
	for rows.Next() {
		var h HistoricalRowDTO
		err := rows.Scan(
			&h.Month,
			&h.ExchangeRate,
			&h.Income,
			&h.IncomeFixed,
			&h.IncomeVariable,
			&h.Expense,
			&h.ExpenseFixed,
			&h.ExpenseVariable,
			&h.Savings,
			&h.Source,
		)
		if err != nil {
			return nil, err
		}
		histEntry = append(histEntry, h)
	}

	return histEntry, rows.Err()
}
