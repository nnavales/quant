package historical

const (
	QueryCreateHistoricalEntry = `
		INSERT INTO historical_entries (
			date,
			exchange_rate,
			income_total_usd,
			income_fixed_usd,
			income_variable_usd,
			expense_total_usd,
			expense_fixed_usd,
			expense_variable_usd,
			savings_usd,
			created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	QueryUpdateHistoricalEntry = `
		UPDATE historical_entries SET
			exchange_rate = ?,
			income_total_usd = ?,
			income_fixed_usd = ?,
			income_variable_usd = ?,
			expense_total_usd = ?,
			expense_fixed_usd = ?,
			expense_variable_usd = ?,
			savings_usd = ?
		WHERE date = ?
	`

	QueryListHistoricalEntries = `
		SELECT
			date,
			exchange_rate,
			income_total_usd,
			income_fixed_usd,
			income_variable_usd,
			expense_total_usd,
			expense_fixed_usd,
			expense_variable_usd,
			savings_usd,
			created_at
		FROM historical_entries
		ORDER BY date DESC
	`

	QueryGetHistoricalEntryByDate = `
		SELECT
			date,
			exchange_rate,
			income_total_usd,
			income_fixed_usd,
			income_variable_usd,
			expense_total_usd,
			expense_fixed_usd,
			expense_variable_usd,
			savings_usd,
			created_at
		FROM historical_entries
		WHERE date = ?
	`

	QueryDeleteHistoricalEntry = `
		DELETE FROM historical_entries WHERE date = ?
	`

	QueryBulkCreateHistoricalEntries = `
		INSERT INTO historical_entries (
			date,
			exchange_rate,
			income_total_usd,
			income_fixed_usd,
			income_variable_usd,
			expense_total_usd,
			expense_fixed_usd,
			expense_variable_usd,
			savings_usd,
			created_at
		) VALUES `
)
