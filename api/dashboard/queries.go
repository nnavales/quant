package dashboard

import "strings"

const (
	GetFinanceSummary = ` 
	SELECT 
		month, income, expense, savings, 
		income_fixed, expense_fixed, 
		income_variable, expense_variable, 
		exchange_rate
	FROM finance_summary
	WHERE month <= strftime('%Y-%m', date('now'))
	ORDER BY month ASC
`
)

func BuildDimensionQuery(filter DimensionFilter) (string, []any) {
	var conditions []string
	var args []any

	query := `SELECT
		strftime('%Y-%m', t.date) as month,
		t.type,
		SUM(
			CAST(ROUND(
				CASE 
					WHEN e.currency = 'USD' THEN e.amount
					ELSE e.amount / e.exchange_rate
				END
			, 0) AS INTEGER)
		) AS amount,
		e.category_id,
		e.subcategory_id,
		e.account_id,
		e.channel_id,
		MAX(c.name) as category_name,
		MAX(sc.name) as subcategory_name,
		MAX(a.name) as account_name,
		MAX(ch.name) as channel_name
	FROM transactions t
	JOIN entries e ON e.transaction_id = t.id
	LEFT JOIN categories c ON c.id = e.category_id
	LEFT JOIN subcategories sc ON sc.id = e.subcategory_id
	LEFT JOIN accounts a ON a.id = e.account_id
	LEFT JOIN channels ch ON ch.id = e.channel_id
	WHERE t.deleted_at IS NULL AND e.deleted_at IS NULL
	`

	if filter.Type != "" {
		conditions = append(conditions, "t.type = ?")
		args = append(args, filter.Type)
	}
	if filter.CategoryID != nil {
		conditions = append(conditions, "e.category_id = ?")
		args = append(args, *filter.CategoryID)
	}
	if filter.SubcategoryID != nil {
		conditions = append(conditions, "e.subcategory_id = ?")
		args = append(args, *filter.SubcategoryID)
	}
	if filter.AccountID != nil {
		conditions = append(conditions, "e.account_id = ?")
		args = append(args, *filter.AccountID)
	}
	if filter.ChannelID != nil {
		conditions = append(conditions, "e.channel_id = ?")
		args = append(args, *filter.ChannelID)
	}
	if filter.DateFrom != nil {
		conditions = append(conditions, "t.date >= ?")
		args = append(args, *filter.DateFrom)
	}
	if filter.DateTo != nil {
		conditions = append(conditions, "t.date <= ?")
		args = append(args, *filter.DateTo)
	}

	if len(conditions) > 0 {
		query += " AND " + strings.Join(conditions, " AND ")
	}

	query += " GROUP BY month, t.type, COALESCE(e.category_id, ''), COALESCE(e.subcategory_id, ''), COALESCE(e.account_id, ''), COALESCE(e.channel_id, '') ORDER BY month ASC"

	return query, args
}
