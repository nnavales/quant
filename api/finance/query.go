package finance

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

	QueryCreateEntry = `
		INSERT INTO entries (id, transaction_id, account_id, amount_ars, amount_usd, exchange_rate, category_id, subcategory_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetEntryByID = `
		SELECT id, transaction_id, account_id, amount_ars, amount_usd, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries WHERE id = ?
	`
	QueryListEntries = `
		SELECT id, transaction_id, account_id, amount_ars, amount_usd, exchange_rate, category_id, subcategory_id, created_at, updated_at, deleted_at
		FROM entries
	`
	QueryUpdateEntry = `
		UPDATE entries SET transaction_id = ?, account_id = ?, amount_ars = ?, amount_usd = ?, exchange_rate = ?, category_id = ?, subcategory_id = ?, updated_at = ?, deleted_at = ?
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
)
