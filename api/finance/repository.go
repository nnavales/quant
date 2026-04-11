package finance

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/transactions"
	"github.com/oklog/ulid/v2"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
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
		var amountCents int64
		var originalAmountCents sql.NullInt64
		err := rows.Scan(
			&t.ID,
			&t.Date,
			&t.Description,
			&t.Type,
			&t.Frequency,
			&t.IsPaid,
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
			&t.InstallmentStartDate,
			&t.InstallmentGroupID,
			&t.IsCanceled,
			&originalAmountCents,
		)
		if err != nil {
			return nil, err
		}
		t.Amount = entries.FormatAmount(amountCents)
		if originalAmountCents.Valid {
			originalAmount := entries.FormatAmount(originalAmountCents.Int64)
			t.OriginalAmount = &originalAmount
		}
		transactions = append(transactions, t)
	}

	countQuery := buildCountQuery(filter)
	var totalCount int
	if err := r.db.QueryRowContext(ctx, countQuery).Scan(&totalCount); err != nil {
		return nil, err
	}

	return &TransactionListResponse{
		Data:       transactions,
		TotalCount: totalCount,
	}, rows.Err()
}

func (r *SQLiteRepo) GetTransactionAggregate(ctx context.Context, id string) (*TransactionRowDTO, error) {
	var t TransactionRowDTO
	var amountCents int64
	var originalAmountCents sql.NullInt64
	err := r.db.QueryRowContext(ctx, QueryGetTransactionDTOByID, id).Scan(
		&t.ID,
		&t.Date,
		&t.Description,
		&t.Type,
		&t.Frequency,
		&t.EntryID,
		&t.IsPaid,
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
		&t.InstallmentStartDate,
		&t.InstallmentGroupID,
		&t.IsCanceled,
		&originalAmountCents,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	t.Amount = entries.FormatAmount(amountCents)
	if originalAmountCents.Valid {
		originalAmount := entries.FormatAmount(originalAmountCents.Int64)
		t.OriginalAmount = &originalAmount
	}

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
			&t.IsPaid,
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
			&t.InstallmentStartDate,
			&t.InstallmentGroupID,
			&t.IsCanceled,
			&t.OriginalAmount,
		)
		if err != nil {
			return nil, err
		}
		t.Amount = entries.FormatAmount(amountCents)
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

	var canceledAmount int64
	for _, t := range trans {
		if *t.InstallmentNumber >= fromInstallment {
			v, err := strconv.Atoi(t.Amount)
			if err != nil {
				return err
			}
			canceledAmount += int64(v)
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

func (r *SQLiteRepo) UpdateTransactionAggregate(ctx context.Context, id string, agg TransactionAggregate) error {
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

	if len(agg.Items) == 0 {
		return fmt.Errorf("at least one item is required: %w", ErrInvalidField)
	}

	entry := agg.Items[0].Entry

	if entry.AccountID != nil && *entry.AccountID != "" {
		var account channels.Account
		err := tx.QueryRowContext(ctx, channels.QueryGetAccountByID, *entry.AccountID).Scan(
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

	if t.InstallmentGroupID != nil {
		_, err = tx.ExecContext(ctx, installments.QueryDeleteInstallmentGroup, *t.InstallmentGroupID)
	} else {
		_, err = tx.ExecContext(ctx, transactions.QueryDeleteTransaction, t.ID)
	}
	if err != nil {
		return err
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

			_, err = tx.ExecContext(ctx, entries.QueryCreateEntry,
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
		_, err = tx.ExecContext(ctx, transactions.QueryCreateTransaction,
			i.Transaction.ID,
			i.Transaction.Date,
			i.Transaction.Description,
			i.Transaction.Type,
			i.Transaction.Frequency,
			nil,
			nil,
			i.Transaction.IsPaid,
			i.Transaction.CreatedAt,
		)
		if err != nil {
			return err
		}

		_, err = tx.ExecContext(ctx, entries.QueryCreateEntry,
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
		var incomeCents sql.NullInt64
		var incomeFixedCents sql.NullInt64
		var incomeVariableCents sql.NullInt64
		var expenseCents sql.NullInt64
		var expenseFixedCents sql.NullInt64
		var expenseVariableCents sql.NullInt64
		var savings sql.NullInt64
		err := rows.Scan(
			&h.Month,
			&h.ExchangeRate,
			&incomeCents,
			&incomeFixedCents,
			&incomeVariableCents,
			&expenseCents,
			&expenseFixedCents,
			&expenseVariableCents,
			&savings,
			&h.Source,
		)
		if err != nil {
			return nil, err
		}
		if incomeCents.Valid {
			h.Income = entries.FormatAmount(incomeCents.Int64)
		}
		if incomeFixedCents.Valid {
			h.IncomeFixed = entries.FormatAmount(incomeFixedCents.Int64)
		}
		if incomeVariableCents.Valid {
			h.IncomeVariable = entries.FormatAmount(incomeVariableCents.Int64)
		}
		if expenseCents.Valid {
			h.Expense = entries.FormatAmount(expenseCents.Int64)
		}
		if expenseFixedCents.Valid {
			h.ExpenseFixed = entries.FormatAmount(expenseFixedCents.Int64)
		}
		if expenseVariableCents.Valid {
			h.ExpenseVariable = entries.FormatAmount(expenseVariableCents.Int64)
		}
		if savings.Valid {
			h.Savings = entries.FormatAmount(savings.Int64)
		}
		histEntry = append(histEntry, h)
	}

	countQuery := buildHistoricalCountQuery(filter)
	var totalCount int
	if err := r.db.QueryRowContext(ctx, countQuery).Scan(&totalCount); err != nil {
		return nil, err
	}

	return &HistoricalListResponse{
		Data:       histEntry,
		TotalCount: totalCount,
	}, rows.Err()
}
