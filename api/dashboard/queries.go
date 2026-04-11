package dashboard

const (
	GetFinanceSummary = ` 
	SELECT 
		month, income, expense, savings, 
		income_fixed, expense_fixed, 
		income_variable, expense_variable, 
		exchange_rate
	FROM finance_summary
	WHERE month BETWEEN 
		strftime('%Y-01', date('now')) 
		AND strftime('%Y-%m', date('now'));
	`
)
