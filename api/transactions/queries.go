package transactions

const (
	QueryCreateTransaction = `
		INSERT INTO transactions (id, date, description, type, frequency, installment_group_id, installment_number, is_paid, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetTransactionByID = `
		SELECT id, date, description, type, frequency, installment_group_id, installment_number, is_paid, created_at, updated_at, deleted_at
		FROM transactions WHERE id = ? AND deleted_at IS NULL
	`
	QueryListTransactions = `
		SELECT id, date, description, type, frequency, installment_group_id, installment_number, is_paid, created_at, updated_at, deleted_at
		FROM transactions
	`
	QueryUpdateTransaction = `
		UPDATE transactions SET date = ?, description = ?, type = ?, frequency = ?, installment_group_id = ?, installment_number = ?, is_paid = ?, updated_at = ?, deleted_at = ?
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

	QueryMarkAsPaid = `
		UPDATE transactions SET is_paid = 1, updated_at = ?
		WHERE id = ?;
	`

	QueryListTransactionsByInstallmentGroupID = `
		SELECT id, date, description, type, frequency, installment_group_id, installment_number, is_paid, created_at, updated_at, deleted_at
		FROM transactions
		WHERE installment_group_id = ?
		ORDER BY installment_number ASC;
	`
)
