package presets

const (
	QueryCreatePreset = `
		INSERT INTO presets (id, name, description, type, frequency, category_id, subcategory_id, channel_id, account_id, is_paid, currency, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	QueryGetPresetByID = `
		SELECT id, name, description, type, frequency, category_id, subcategory_id, channel_id, account_id, is_paid, currency, created_at, updated_at, deleted_at
		FROM presets WHERE id = ? AND deleted_at IS NULL
	`
	QueryGetPresetByName = `
		SELECT id, name, description, type, frequency, category_id, subcategory_id, channel_id, account_id, is_paid, currency, created_at, updated_at, deleted_at
		FROM presets WHERE name = ? AND deleted_at IS NULL
	`
	QueryListPresets = `
		SELECT id, name, description, type, frequency, category_id, subcategory_id, channel_id, account_id, is_paid, currency, created_at, updated_at, deleted_at
		FROM presets
		WHERE deleted_at IS NULL
		ORDER BY name
	`
	QueryListDeletedPresets = `
		SELECT id, name, description, type, frequency, category_id, subcategory_id, channel_id, account_id, is_paid, currency, created_at, updated_at, deleted_at
		FROM presets
		WHERE deleted_at IS NOT NULL
		ORDER BY name
	`
	QueryUpdatePreset = `
		UPDATE presets SET name = ?, description = ?, type = ?, frequency = ?, category_id = ?, subcategory_id = ?, channel_id = ?, account_id = ?, is_paid = ?, currency = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeletePreset = `
		UPDATE presets
		SET deleted_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`
	QueryRestorePreset = `
		UPDATE presets
		SET deleted_at = NULL
		WHERE id = ? AND deleted_at IS NOT NULL
	`
)