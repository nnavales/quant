package finance

import (
	"fmt"
	"strings"
)

const (
	QueryDeleteTransactionsByInstallmentGroup = `
		DELETE FROM transactions 
		WHERE installment_group_id = ? 
		AND installment_number >= ?
	`

	QueryListTransactionsDTO = ` 
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,
	  t.is_paid,

	  e.id,
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
	  ig.start_date AS installment_start_date,
	  t.installment_group_id,
	  ig.is_canceled,
	  ig.original_amount

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
	  t.is_paid,

	  e.id,
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
	  ig.start_date AS installment_start_date,
	  t.installment_group_id,
	  ig.is_canceled,
	  ig.original_amount

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
	  t.is_paid,

	  e.id,
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
	  ig.start_date AS installment_start_date,
	  t.installment_group_id,
	  ig.is_canceled,
	  ig.original_amount

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id

	WHERE t.installment_group_id = ?
	AND t.deleted_at IS NULL
	AND e.deleted_at IS NULL
	ORDER BY t.installment_number ASC;`

	QueryListTransactionsByInstallmentGroup = `
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,
	  t.is_paid,

	  e.id,
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
	  ig.start_date AS installment_start_date,
	  t.installment_group_id,
	  ig.is_canceled,
	  ig.original_amount

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id

	WHERE t.deleted_at IS NULL
	AND e.deleted_at IS NULL
	ORDER BY t.installment_number ASC;`

	baseListTransactionsDTO = `
	SELECT
	  t.id,
	  t.date,
	  t.description,
	  t.type,
	  t.frequency,
	  t.is_paid,

	  e.id,
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
	  ig.start_date AS installment_start_date,
	  t.installment_group_id,
	  ig.is_canceled,
	  ig.original_amount

	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id

	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id

	LEFT JOIN installment_groups ig ON ig.id = t.installment_group_id`

	baseListHistoricalDTO = `
	SELECT 
	month, 
	exchange_rate, 
	income, 
	income_fixed,
	income_variable,  
	expense, 
	expense_fixed, 
	expense_variable, 
	savings, 
	source   
	FROM finance_summary
	`
)

func BuildListHistoricalEntriesQuery(filter *Filter) (string, []any) {
	if filter == nil {
		filter = &Filter{}
	}

	var whereClauses []string
	var args []any

	if filter.Source != nil {
		whereClauses = append(whereClauses, "source = ?")
		args = append(args, *filter.Source)
	}

	if filter.DateFrom != nil {
		whereClauses = append(whereClauses, "month >= ?")
		args = append(args, filter.DateFrom.String()[0:7])
	}

	if filter.DateTo != nil {
		whereClauses = append(whereClauses, "month <= ?")
		args = append(args, filter.DateTo.String()[0:7])
	}

	query := baseListHistoricalDTO

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// sorting
	sortField := "month"
	if filter.Sort != nil {
		switch *filter.Sort {
		case "month":
			sortField = "month"
		case "income":
			sortField = "income"
		case "expense":
			sortField = "expense"
		case "savings":
			sortField = "savings"
		}
	}

	order := "DESC"
	if filter.Order != nil && *filter.Order == "asc" {
		order = "ASC"
	}

	query += " ORDER BY " + sortField + " " + order

	// pagination
	limit := 20
	offset := 0

	if filter.Limit != nil {
		limit = *filter.Limit
	}
	if filter.Page != nil && *filter.Page > 1 {
		offset = (*filter.Page - 1) * limit
	}

	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	return query, args
}

func buildHistoricalCountQuery(filter *Filter) (string, []any) {
	if filter == nil {
		filter = &Filter{}
	}

	var whereClauses []string
	var args []any

	if filter.DateFrom != nil {
		whereClauses = append(whereClauses, "month >= ?")
		args = append(args, filter.DateFrom.String()[0:7])
	}

	if filter.DateTo != nil {
		whereClauses = append(whereClauses, "month <= ?")
		args = append(args, filter.DateTo.String()[0:7])
	}

	query := "SELECT COUNT(*) FROM finance_summary"

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	return query, args
}

func BuildListTransactionsQuery(filter *Filter) (string, []any) {
	if filter == nil {
		filter = &Filter{}
	}

	var whereClauses []string
	var args []any

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

	if filter.IsPaid != nil {
		whereClauses = append(whereClauses, "t.is_paid = ?")
		args = append(args, *filter.IsPaid)
	}

	query := baseListTransactionsDTO
	if len(whereClauses) > 0 {
		query = baseListTransactionsDTO + " WHERE " + strings.Join(whereClauses, " AND ")
	}

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

func BuildListTransactionIDsQuery(filter *Filter) (string, []any) {
	if filter == nil {
		filter = &Filter{}
	}

	var whereClauses []string
	var args []any

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

	if filter.IsPaid != nil {
		whereClauses = append(whereClauses, "t.is_paid = ?")
		args = append(args, *filter.IsPaid)
	}

	query := "SELECT t.id, e.amount, e.currency, e.exchange_rate FROM transactions t JOIN entries e ON e.transaction_id = t.id"
	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	return query, args
}

func buildCountQuery(filter *Filter) (string, []any) {
	var whereClauses []string
	var args []any

	whereClauses = append(whereClauses, "t.deleted_at IS NULL", "e.deleted_at IS NULL")

	if filter.Search != nil && *filter.Search != "" {
		whereClauses = append(whereClauses, "t.description LIKE ?")
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

	if filter.IsPaid != nil {
		whereClauses = append(whereClauses, "t.is_paid = ?")
		args = append(args, *filter.IsPaid)
	}

	query := "SELECT COUNT(DISTINCT t.id) FROM transactions t JOIN entries e ON e.transaction_id = t.id"

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	return query, args
}
