package planning

const (
	QueryCreateInput = `
		INSERT INTO planning_inputs (
			id,
			month,
			description,
			type,
			amount,
			currency,
			created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	QueryGetInputByID = `
		SELECT
			id,
			month,
			description,
			type,
			amount,
			currency,
			created_at,
			updated_at
		FROM planning_inputs
		WHERE id = ?
	`

	QueryListInputs = `
		SELECT
			id,
			month,
			description,
			type,
			amount,
			currency,
			created_at,
			updated_at
		FROM planning_inputs
		ORDER BY month ASC, created_at ASC
	`

	QueryListInputsByYear = `
		SELECT
			id,
			month,
			description,
			type,
			amount,
			currency,
			created_at,
			updated_at
		FROM planning_inputs
		WHERE substr(month, 1, 4) = ?
		ORDER BY month ASC, created_at ASC
	`

	QueryUpdateInput = `
		UPDATE planning_inputs
		SET
			month = ?,
			description = ?,
			type = ?,
			amount = ?,
			currency = ?,
			updated_at = ?
		WHERE id = ?
	`

	QueryDeleteInput = `
		DELETE FROM planning_inputs
		WHERE id = ?
	`

	QueryCreateRate = `
		INSERT INTO planning_exchange_rates (month, rate, updated_at)
		VALUES (?, ?, ?)
	`

	QueryGetRateByDate = `
		SELECT
			month,
			rate,
			updated_at
		FROM planning_exchange_rates
		WHERE month = ?
	`

	QueryListRatesByYear = `
		SELECT month, rate, updated_at
		FROM planning_exchange_rates
		WHERE substr(month, 1, 4) = ?
	`

	QueryUpdateRate = `
		UPDATE planning_exchange_rates
		SET
			rate = ?,
			updated_at = ?
		WHERE month = ?
	`

	QueryDeleteRate = `
		DELETE FROM planning_exchange_rates
		WHERE month = ?
	`
)
