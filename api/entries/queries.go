package entries

const (
	QueryCreateEntry = `
		INSERT INTO entries (id, transaction_id, channel_id, account_id, amount, currency, exchange_rate, category_id, subcategory_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetEntryByID = `
		SELECT id, transaction_id, channel_id, account_id, amount, currency, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries WHERE id = ? AND deleted_at IS NULL
	`
	QueryListEntries = `
		SELECT id, transaction_id, channel_id, account_id, amount, currency, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries
	`
	QueryUpdateEntry = `
		UPDATE entries SET transaction_id = ?, channel_id = ?, account_id = ?, amount = ?, currency = ?, exchange_rate = ?, category_id = ?, subcategory_id = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteEntry = `
		DELETE FROM entries WHERE id = ?
	`

	QueryGetEntryByTransacctionID = `
		SELECT id, transaction_id, channel_id, account_id, amount, currency, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries
		WHERE transaction_id = ?;
	`
)
