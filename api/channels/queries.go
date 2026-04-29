package channels

const (
	QueryListDeletedChannels = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM channels
		WHERE deleted_at IS NOT NULL
	`

	QueryListDeletedChannelsWithAccounts = `
		SELECT ch.id, ch.name, ch.created_at, ch.updated_at, ch.deleted_at,
		       a.id, a.name, a.instrument, a.created_at, a.updated_at, a.deleted_at
		FROM channels ch
		LEFT JOIN accounts a ON a.channel_id = ch.id AND a.deleted_at IS NOT NULL
		WHERE ch.deleted_at IS NOT NULL
		ORDER BY ch.name, a.name
	`

	QueryListDeletedAccounts = `
		SELECT id, channel_id, name, instrument, created_at, updated_at, deleted_at
		FROM accounts
		WHERE deleted_at IS NOT NULL
	`

	QueryCreateChannel = `
		INSERT INTO channels (id, name, created_at)
		VALUES (?, ?, ?)
	`
	QueryGetChannelByID = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM channels WHERE id = ? AND deleted_at IS NULL
	`
	QueryGetChannelByName = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM channels WHERE name = ? AND deleted_at IS NULL
	`
	QueryListChannels = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM channels
		WHERE deleted_at IS NULL
	`
	QueryUpdateChannel = `
		UPDATE channels SET name = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteChannel = `
		UPDATE channels
		SET deleted_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	QueryListChannelsWithAccounts = `
		SELECT ch.id, ch.name, ch.created_at, ch.updated_at, ch.deleted_at,
		       a.id, a.name, a.instrument, a.created_at, a.updated_at, a.deleted_at
		FROM channels ch
		LEFT JOIN accounts a ON a.channel_id = ch.id
		ORDER BY ch.name, a.name
	`

	QueryCreateAccount = `
		INSERT INTO accounts (id, channel_id, name, instrument, created_at)
		VALUES (?, ?, ?, ?, ?)
	`
	QueryGetAccountByID = `
		SELECT id, channel_id, name, instrument, created_at, updated_at, deleted_at
		FROM accounts WHERE id = ? AND deleted_at IS NULL
	`
	QueryListAccounts = `
		SELECT id, channel_id, name, instrument, created_at, updated_at, deleted_at
		FROM accounts
		WHERE deleted_at IS NULL
	`
	QueryUpdateAccount = `
		UPDATE accounts SET channel_id = ?, name = ?, instrument = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteAccount = `
		UPDATE accounts
		SET deleted_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	QueryRestoreChannel = `
		UPDATE channels 
		SET deleted_at = NULL
		WHERE id = ? AND deleted_at IS NOT NULL
	`
	QueryRestoreAccount = `
		UPDATE accounts
		SET deleted_at = NULL
		WHERE id = ? AND deleted_at IS NOT NULL
	`

	QueryGetAccountByName = `
		SELECT id, channel_id, name, instrument, created_at, updated_at, deleted_at
		FROM accounts WHERE name = ? AND deleted_at IS NULL
	`

	QueryHardDeleteChannel = `
		DELETE FROM channels 
		WHERE id = ? AND deleted_at IS NOT NULL;
	`

	QueryHardDeleteAccount = `
		DELETE FROM accounts
		WHERE id = ? AND deleted_at IS NOT NULL;
	`
)
