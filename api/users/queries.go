package users

const (
	QueryUpdate = `
		UPDATE user_config
		SET value = ?, updated_at = ?
		WHERE key = ?;
	`

	QueryInsertIfNotExists = `
		INSERT OR IGNORE INTO user_config (key, value, created_at)
		VALUES (?, ?, ?);
	`

	QueryGet = `
		SELECT value FROM user_config WHERE key = ?;
	`

	QueryList = `
		SELECT key, value FROM user_config;
	`
)
