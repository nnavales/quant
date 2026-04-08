package installments

const (
	QueryDeleteTransactionsByInstallmentGroup = `
		DELETE FROM transactions 
		WHERE installment_group_id = ? 
		AND installment_number >= ?
	`

	QueryCreateInstallmentGroup = `
		INSERT INTO installment_groups (id, total_installments, start_date, created_at, original_amount, description, currency, is_canceled)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetInstallmentGroupByID = `
		SELECT id, total_installments, start_date, created_at, updated_at, deleted_at, original_amount, description, currency, is_canceled
		FROM installment_groups WHERE id = ? AND deleted_at IS NULL
	`
	QueryListInstallmentGroups = `
		SELECT id, total_installments, start_date, created_at, updated_at, deleted_at, original_amount, description, currency, is_canceled
		FROM installment_groups
	`
	QueryUpdateInstallmentGroup = `
		UPDATE installment_groups SET total_installments = ?, start_date = ?, updated_at = ?, deleted_at = ?, original_amount = ?, description = ?, currency = ?, is_canceled = ?
		WHERE id = ?
	`
	QueryDeleteInstallmentGroup = `
		DELETE FROM installment_groups WHERE id = ?
	`

	QuerySetCancelled = `
		UPDATE installment_groups SET updated_at = ?, is_canceled = ?
		WHERE id = ?
	`
)
