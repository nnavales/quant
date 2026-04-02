package finance

import (
	"fmt"
	"strings"
)

const (
	QueryCreateTransaction = `
		INSERT INTO transactions (id, date, description, type, frequency, installment_group_id, installment_number, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetTransactionByID = `
		SELECT id, date, description, type, frequency, installment_group_id, installment_number, created_at, updated_at, deleted_at
		FROM transactions WHERE id = ?
	`
	QueryListTransactions = `
		SELECT id, date, description, type, frequency, installment_group_id, installment_number, created_at, updated_at, deleted_at
		FROM transactions
	`
	QueryUpdateTransaction = `
		UPDATE transactions SET date = ?, description = ?, type = ?, frequency = ?, installment_group_id = ?, installment_number = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteTransaction = `
		DELETE FROM transactions WHERE id = ?
	`

	QueryDeleteTransactionsByInstallmentGroup = `
		DELETE FROM transactions 
		WHERE installment_group_id = ? 
		AND installment_number >= ?
	`

	QueryCreateEntry = `
		INSERT INTO entries (id, transaction_id, channel_id, account_id, amount, currency, is_paid, exchange_rate, category_id, subcategory_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetEntryByID = `
		SELECT id, transaction_id, channel_id, account_id, amount, currency, is_paid, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries WHERE id = ?
	`
	QueryListEntries = `
		SELECT id, transaction_id, channel_id, account_id, amount, currency, is_paid, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries
	`
	QueryUpdateEntry = `
		UPDATE entries SET transaction_id = ?, channel_id = ?, account_id = ?, amount = ?, currency = ?, is_paid = ?, exchange_rate = ?, category_id = ?, subcategory_id = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteEntry = `
		DELETE FROM entries WHERE id = ?
	`

	QueryCreateChannel = `
		INSERT INTO channels (id, name, created_at)
		VALUES (?, ?, ?)
	`
	QueryGetChannelByID = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM channels WHERE id = ?
	`
	QueryListChannels = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM channels
	`
	QueryUpdateChannel = `
		UPDATE channels SET name = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteChannel = `
		DELETE FROM channels WHERE id = ?
	`

	QueryListChannelsWithAccounts = `
		SELECT ch.id, ch.name, ch.created_at, ch.updated_at, ch.deleted_at,
		       a.id, a.name, a.instrument, a.last_four, a.created_at, a.updated_at, a.deleted_at
		FROM channels ch
		LEFT JOIN accounts a ON a.channel_id = ch.id AND a.deleted_at IS NULL
		WHERE ch.deleted_at IS NULL
		ORDER BY ch.name, a.name
	`

	QueryCreateAccount = `
		INSERT INTO accounts (id, channel_id, name, instrument, last_four, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	QueryGetAccountByID = `
		SELECT id, channel_id, name, instrument, last_four, created_at, updated_at, deleted_at
		FROM accounts WHERE id = ?
	`
	QueryListAccounts = `
		SELECT id, channel_id, name, instrument, last_four, created_at, updated_at, deleted_at
		FROM accounts
	`
	QueryUpdateAccount = `
		UPDATE accounts SET channel_id = ?, name = ?, instrument = ?, last_four = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteAccount = `
		DELETE FROM accounts WHERE id = ?
	`

	QueryCreateCategory = `
		INSERT INTO categories (id, name, created_at)
		VALUES (?, ?, ?)
	`
	QueryGetCategoryByID = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM categories WHERE id = ?
	`
	QueryListCategories = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM categories
	`
	QueryUpdateCategory = `
		UPDATE categories SET name = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteCategory = `
		DELETE FROM categories WHERE id = ?
	`

	QueryCreateSubcategory = `
		INSERT INTO subcategories (id, category_id, name, created_at)
		VALUES (?, ?, ?, ?)
	`
	QueryGetSubcategoryByID = `
		SELECT id, category_id, name, created_at, updated_at, deleted_at
		FROM subcategories WHERE id = ?
	`
	QueryListSubcategories = `
		SELECT id, category_id, name, created_at, updated_at, deleted_at
		FROM subcategories
	`
	QueryUpdateSubcategory = `
		UPDATE subcategories SET category_id = ?, name = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteSubcategory = `
		DELETE FROM subcategories WHERE id = ?
	`

	QueryListCategoriesWithSubcategories = `
		SELECT c.id, c.name, c.created_at, c.updated_at, c.deleted_at,
		       s.id, s.name, s.created_at, s.updated_at, s.deleted_at
		FROM categories c
		LEFT JOIN subcategories s ON s.category_id = c.id AND s.deleted_at IS NULL
		WHERE c.deleted_at IS NULL
		ORDER BY c.name, s.name
	`

	QueryCreateInstallmentGroup = `
		INSERT INTO installment_groups (id, total_installments, start_date, created_at)
		VALUES (?, ?, ?, ?)
	`
	QueryGetInstallmentGroupByID = `
		SELECT id, total_installments, start_date, created_at, updated_at, deleted_at
		FROM installment_groups WHERE id = ?
	`
	QueryListInstallmentGroups = `
		SELECT id, total_installments, start_date, created_at, updated_at, deleted_at
		FROM installment_groups
	`
	QueryUpdateInstallmentGroup = `
		UPDATE installment_groups SET total_installments = ?, start_date = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteInstallmentGroup = `
		DELETE FROM installment_groups WHERE id = ?
	`

	QueryListTransactionsDTO = ` 
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,

	  e.id,
	  e.is_paid,
	  e.amount,
	  e.currency,
	  e.exchange_rate,
	  e.category_id,
	  e.subcategory_id,
	  e.channel_id,
	  e.account_id,

	  c.name  AS category_name,
	  sc.name AS subcategory_name,
	  a.name  AS account_name,
	  ch.name AS channel_name,

	  t.installment_number,
	  ig.total_installments,
	  t.installment_group_id

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id

	WHERE t.deleted_at IS NULL
	AND e.deleted_at IS NULL

	ORDER BY t.date DESC;`

	QueryGetTransactionDTOByID = ` 
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,

	  e.id,
	  e.is_paid,
	  e.amount,
	  e.currency,
	  e.exchange_rate,
	  e.category_id,
	  e.subcategory_id,
	  e.channel_id,
	  e.account_id,

	  c.name  AS category_name,
	  sc.name AS subcategory_name,
	  a.name  AS account_name,
	  ch.name AS channel_name,

	  t.installment_number,
	  ig.total_installments,
	  t.installment_group_id

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id

	WHERE t.id = ?
	ORDER BY t.date DESC;`

	QueryGetTransactionsByInstallmentGroup = `
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,

	  e.id,
	  e.is_paid,
	  e.amount,
	  e.currency,
	  e.exchange_rate,
	  e.category_id,
	  e.subcategory_id,
	  e.channel_id,
	  e.account_id,

	  c.name  AS category_name,
	  sc.name AS subcategory_name,
	  a.name  AS account_name,
	  ch.name AS channel_name,

	  t.installment_number,
	  ig.total_installments,
	  t.installment_group_id

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id

	WHERE t.installment_group_id = ?
	AND t.installment_number >= ?
	AND t.deleted_at IS NULL
	AND e.deleted_at IS NULL
	ORDER BY t.installment_number ASC;`

	baseListTransactionsDTO = `
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,

	  e.id,
	  e.is_paid,
	  e.amount,
	  e.currency,
	  e.exchange_rate,
	  e.category_id,
	  e.subcategory_id,
	  e.channel_id,
	  e.account_id,

	  c.name  AS category_name,
	  sc.name AS subcategory_name,
	  a.name  AS account_name,
	  ch.name AS channel_name,

	  t.installment_number,
	  ig.total_installments,
	  t.installment_group_id

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id`
)

func BuildListTransactionsQuery(filter *Filter) (string, []interface{}) {
	var whereClauses []string
	var args []interface{}

	whereClauses = append(whereClauses, "t.deleted_at IS NULL", "e.deleted_at IS NULL")

	if filter.Search != nil && *filter.Search != "" {
		whereClauses = append(whereClauses, "LOWER(t.description) LIKE LOWER(?)")
		args = append(args, "%"+*filter.Search+"%")
	}

	if filter.Type != nil {
		whereClauses = append(whereClauses, "t.type = ?")
		args = append(args, *filter.Type)
	}

	if filter.Frequency != nil {
		whereClauses = append(whereClauses, "t.frequency = ?")
		args = append(args, *filter.Frequency)
	}

	if filter.Currency != nil {
		whereClauses = append(whereClauses, "e.currency = ?")
		args = append(args, *filter.Currency)
	}

	if filter.Installment != nil {
		if *filter.Installment {
			whereClauses = append(whereClauses, "t.installment_group_id IS NOT NULL")
		} else {
			whereClauses = append(whereClauses, "t.installment_group_id IS NULL")
		}
	}

	if filter.Category != nil {
		whereClauses = append(whereClauses, "e.category_id = ?")
		args = append(args, *filter.Category)
	}

	if filter.Subcategory != nil {
		whereClauses = append(whereClauses, "e.subcategory_id = ?")
		args = append(args, *filter.Subcategory)
	}

	if filter.Channel != nil {
		whereClauses = append(whereClauses, "e.channel_id = ?")
		args = append(args, *filter.Channel)
	}

	if filter.Account != nil {
		whereClauses = append(whereClauses, "e.account_id = ?")
		args = append(args, *filter.Account)
	}

	if filter.DateFrom != nil {
		whereClauses = append(whereClauses, "t.date >= ?")
		args = append(args, filter.DateFrom.String())
	}

	if filter.DateTo != nil {
		whereClauses = append(whereClauses, "t.date <= ?")
		args = append(args, filter.DateTo.String())
	}

	query := baseListTransactionsDTO + " WHERE " + strings.Join(whereClauses, " AND ")

	sortField := "t.created_at"
	if filter.Sort != nil {
		switch *filter.Sort {
		case "date":
			sortField = "t.date"
		case "amount":
			sortField = "CASE WHEN e.currency = 'USD' THEN e.amount * e.exchange_rate ELSE e.amount END"
		case "created_at":
			sortField = "t.created_at"
		}
	}

	order := "DESC"
	if filter.Order != nil && *filter.Order == "asc" {
		order = "ASC"
	}

	query += " ORDER BY " + sortField + " " + order

	limit := 20
	offset := 0
	if filter.Limit != nil {
		limit = *filter.Limit
	}
	if filter.Page != nil && *filter.Page > 1 {
		offset = (*filter.Page - 1) * limit
	}

	query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	return query, args
}
