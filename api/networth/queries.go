package networth

var (
	QueryGetAssetByID = `
		SELECT 
			id,
			name,
			amount,
			currency,
			type,
			created_at,
			updated_at
		FROM assets
		WHERE id = ?;`

	QueryListAssets = `
		SELECT 
			id,
			name,
			amount,
			currency,
			type,
			created_at,
			updated_at
		FROM assets;`

	QueryCreateAsset = `
		INSERT INTO assets	
		(
			id,
			name,
			amount,
			currency,
			type,
			created_at
		)
		VALUES
		( 
			?,
			?,
			?,
			?,
			?,
			?
		);`

	QueryUpdateAsset = `
		UPDATE assets
		SET 
			name = ?,
			amount = ?,
			currency = ?,
			type = ?,
			updated_at = ?
		WHERE id = ?;`

	QueryDeleteAsset = `
		DELETE FROM assets
		WHERE id = ?;`
)
