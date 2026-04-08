package categories

import (
	"context"
	"log/slog"

	"github.com/nnavales/summit/api/timeutils"
)

func SeedDefaults(ctx context.Context, repo *SQLiteRepo, clock timeutils.Clock) error {
	categoryNames := []string{"Servicios", "Suscripciones", "Supermercado", "Transporte", "Entretenimiento", "Salud", "Educación", "Shopping", "Hogar"}

	now := clock.Now()
	categoryIDs := make(map[string]string)

	existingCategories, err := repo.ListCategories(ctx, Filter{Deleted: false})
	if err == nil {
		for _, cat := range existingCategories {
			categoryIDs[cat.Name] = cat.ID
		}
	}

	for _, name := range categoryNames {
		if _, exists := categoryIDs[name]; exists {
			slog.Info("category.seed.found", "category", name)
			continue
		}

		c := NewCategory(now, name)
		created, err := repo.CreateCategory(ctx, *c)
		if err != nil {
			slog.Warn("category.seed.error", "err", err, "category", name)
			continue
		}
		categoryIDs[name] = created.ID
		slog.Info("category.seed.created", "category", name)
	}

	subcategorySeeds := []struct {
		categoryName string
		name         string
	}{
		{"Servicios", "Electricidad"},
		{"Servicios", "Gas"},
		{"Servicios", "Agua"},
		{"Servicios", "Internet"},
		{"Servicios", "Teléfono"},
		{"Servicios", "Celular"},
		{"Suscripciones", "Netflix"},
		{"Suscripciones", "Spotify"},
		{"Suscripciones", "Disney+"},
		{"Suscripciones", "Amazon Prime"},
		{"Suscripciones", "HBO Max"},
		{"Supermercado", "Carrefour"},
		{"Supermercado", "Coto"},
		{"Supermercado", "Jumbo"},
		{"Supermercado", "Chango Más"},
		{"Supermercado", "Dia"},
		{"Transporte", "Subte"},
		{"Transporte", "Colectivo"},
		{"Transporte", "Tren"},
		{"Transporte", "Taxi"},
		{"Transporte", "Uber"},
		{"Transporte", "Cabify"},
		{"Entretenimiento", "Cine"},
		{"Entretenimiento", "Teatro"},
		{"Entretenimiento", "Conciertos"},
		{"Entretenimiento", "Bares"},
		{"Entretenimiento", "Restaurantes"},
		{"Salud", "Farmacia"},
		{"Salud", "Médico"},
		{"Salud", "Dentista"},
		{"Educación", "Cursos"},
		{"Educación", "Libros"},
		{"Educación", "Universidad"},
		{"Shopping", "Ropa"},
		{"Shopping", "Zapatos"},
		{"Shopping", "Accesorios"},
		{"Hogar", "Muebles"},
		{"Hogar", "Decoración"},
		{"Hogar", "Electrodomésticos"},
	}

	for _, ss := range subcategorySeeds {
		categoryID, ok := categoryIDs[ss.categoryName]
		if !ok {
			continue
		}
		sub := NewSubcategory(now, categoryID, ss.name)
		_, err := repo.CreateSubcategory(ctx, *sub)
		if err != nil {
			slog.Warn("subcategory.seed.error", "err", err, "subcategory", ss.name)
		} else {
			slog.Info("subcategory.seed.created", "subcategory", ss.name)
		}
	}

	return nil
}
