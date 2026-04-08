package categories

const (
	QueryListDeletedCategories = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM categories
		WHERE deleted_at IS NOT NULL
	`

	QueryListDeletedSubcategories = `
		SELECT id, category_id, name, created_at, updated_at, deleted_at
		FROM subcategories
		WHERE deleted_at IS NOT NULL
	`

	QueryCreateCategory = `
		INSERT INTO categories (id, name, created_at)
		VALUES (?, ?, ?)
	`
	QueryGetCategoryByID = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM categories WHERE id = ? AND deleted_at IS NULL
	`
	QueryListCategories = `
		SELECT id, name, created_at, updated_at, deleted_at
		FROM categories
		WHERE deleted_at IS NULL
	`
	QueryUpdateCategory = `
		UPDATE categories SET name = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteCategory = `
		UPDATE categories
		SET deleted_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	QueryCreateSubcategory = `
		INSERT INTO subcategories (id, category_id, name, created_at)
		VALUES (?, ?, ?, ?)
	`
	QueryGetSubcategoryByID = `
		SELECT id, category_id, name, created_at, updated_at, deleted_at
		FROM subcategories WHERE id = ? AND deleted_at IS NULL
	`
	QueryListSubcategories = `
		SELECT id, category_id, name, created_at, updated_at, deleted_at
		FROM subcategories
		WHERE deleted_at IS NULL
	`
	QueryUpdateSubcategory = `
		UPDATE subcategories SET category_id = ?, name = ?, updated_at = ?, deleted_at = ?
		WHERE id = ?
	`
	QueryDeleteSubcategory = `
		UPDATE subcategories 
		SET deleted_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	QueryListCategoriesWithSubcategories = `
		SELECT c.id, c.name, c.created_at, c.updated_at, c.deleted_at,
		       s.id, s.name, s.created_at, s.updated_at, s.deleted_at
		FROM categories c
		LEFT JOIN subcategories s ON s.category_id = c.id 
		ORDER BY c.name, s.name
	`

	QueryListDeletedCategoriesWithSubcategories = `
		SELECT c.id, c.name, c.created_at, c.updated_at, c.deleted_at,
		       s.id, s.name, s.created_at, s.updated_at, s.deleted_at
		FROM categories c
		LEFT JOIN subcategories s ON s.category_id = c.id AND s.deleted_at IS NOT NULL
		WHERE c.deleted_at IS NOT NULL
		ORDER BY c.name, s.name
	`

	QueryRestoreSubcategory = `
		UPDATE subcategories
		SET deleted_at = NULL
		WHERE id = ? AND deleted_at IS NOT NULL
	`
	QueryRestoreCategory = `
		UPDATE categories
		SET deleted_at = NULL
		WHERE id = ? AND deleted_at IS NOT NULL
	`
)
