package planning

const (
	QueryCreateInput = `
		INSERT INTO planning_inputs (
			id,
			year,
			description,
			type,
			currency,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	QueryGetInputByID = `
		SELECT
			id,
			year,
			description,
			type,
			currency,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at,
			updated_at
		FROM planning_inputs
		WHERE id = ?
	`

	QueryListInputs = `
		SELECT
			id,
			year,
			description,
			type,
			currency,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at,
			updated_at
		FROM planning_inputs
		ORDER BY year DESC, description ASC
	`

	QueryListInputsByYear = `
		SELECT
			id,
			year,
			description,
			type,
			currency,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at,
			updated_at
		FROM planning_inputs
		WHERE year = ?
		ORDER BY description ASC
	`

	QueryUpdateInput = `
		UPDATE planning_inputs
		SET
			description = ?,
			type = ?,
			currency = ?,
			january = ?,
			february = ?,
			march = ?,
			april = ?,
			may = ?,
			june = ?,
			july = ?,
			august = ?,
			september = ?,
			october = ?,
			november = ?,
			december = ?,
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

	QueryListRates = `
		SELECT month, rate, updated_at
		FROM planning_exchange_rates
		ORDER BY month DESC
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

	QueryCreateGoal = `
		INSERT INTO planning_goals (
			id,
			year,
			metric,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	QueryGetGoalByID = `
		SELECT
			id,
			year,
			metric,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at,
			updated_at
		FROM planning_goals
		WHERE id = ?
	`

	QueryListGoals = `
		SELECT
			id,
			year,
			metric,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at,
			updated_at
		FROM planning_goals
		ORDER BY year DESC, metric ASC
	`

	QueryListGoalsByYear = `
		SELECT
			id,
			year,
			metric,
			january,
			february,
			march,
			april,
			may,
			june,
			july,
			august,
			september,
			october,
			november,
			december,
			created_at,
			updated_at
		FROM planning_goals
		WHERE year = ?
		ORDER BY metric ASC
	`

	QueryUpdateGoal = `
		UPDATE planning_goals
		SET
			metric = ?,
			january = ?,
			february = ?,
			march = ?,
			april = ?,
			may = ?,
			june = ?,
			july = ?,
			august = ?,
			september = ?,
			october = ?,
			november = ?,
			december = ?,
			updated_at = ?
		WHERE id = ?
	`

	QueryDeleteGoal = `
		DELETE FROM planning_goals
		WHERE id = ?
	`

	QueryGetPlanningConfig = `
		SELECT year, initial_capital, updated_at
		FROM planning_config
		WHERE year = ?
	`

	QueryListPlanningConfigs = `
		SELECT year, initial_capital, updated_at
		FROM planning_config
		ORDER BY year DESC
	`

	QueryUpsertPlanningConfig = `
		INSERT INTO planning_config (year, initial_capital, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(year) DO UPDATE SET
			initial_capital = excluded.initial_capital,
			updated_at = excluded.updated_at
	`
)
