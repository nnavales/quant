package categories

import (
	"context"
	"log/slog"

	"github.com/nnavales/quant/api/timeutils"
)

func SeedDefaults(ctx context.Context, repo *SQLiteRepo, clock timeutils.Clock) error {
	now := clock.Now()

	categoryNames := []string{
		"Impuestos",
		"Otros",
		"Salud",
		"Servicios",
		"Suscripciones",
		"Trabajo",
		"Vehiculos",
		"Vivienda",
		"Ajustes",
		"Consumo",
		"Cuidado Personal",
		"Inversiones",
		"Movilidad",
		"Ocio",
		"Prestamos",
		"Regalos",
		"Beneficio",
		"Ganancias",
		"Premios",
		"Recuperos",
		"Reintegros",
		"Ventas",
	}

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
		// Impuestos
		{"Impuestos", "ABL"},
		{"Impuestos", "ARBA"},
		{"Impuestos", "Monotributo"},
		{"Impuestos", "Tarjetas"},

		// Otros
		{"Otros", "Diferencia (Tarjeta/AF)"},

		// Salud
		{"Salud", "Gimnasio"},
		{"Salud", "OSMECON"},
		{"Salud", "Consultas Médicas"},
		{"Salud", "Farmacia"},
		{"Salud", "Medicamentos"},
		{"Salud", "Odontología"},

		// Servicios
		{"Servicios", "Agua"},
		{"Servicios", "Cable"},
		{"Servicios", "Gas"},
		{"Servicios", "Luz"},
		{"Servicios", "Telefonos"},

		// Suscripciones
		{"Suscripciones", "Google Drive"},
		{"Suscripciones", "LinkedIn"},
		{"Suscripciones", "Netflix"},
		{"Suscripciones", "Spotify"},
		{"Suscripciones", "Youtube"},
		{"Suscripciones", "Meli +"},

		// Trabajo
		{"Trabajo", "Alimentación"},
		{"Trabajo", "Viaticos"},
		{"Trabajo", "Salario"},
		{"Trabajo", "Aguinaldo"},
		{"Trabajo", "Ajustes Salariales"},
		{"Trabajo", "Bonos"},
		{"Trabajo", "Vacaciones"},

		// Vehiculos
		{"Vehiculos", "Cochera"},
		{"Vehiculos", "Patente"},
		{"Vehiculos", "Seguro"},

		// Vivienda
		{"Vivienda", "Alquiler"},
		{"Vivienda", "Expensas"},
		{"Vivienda", "Seguro del Hogar"},

		// Ajustes
		{"Ajustes", "Ajuste por Cierre"},
		{"Ajustes", "Sinceramientos"},
		{"Ajustes", "Correcciones / Diferencias"},

		// Consumo
		{"Consumo", "Alimentos"},
		{"Consumo", "Hogar"},
		{"Consumo", "Indumentaria"},
		{"Consumo", "Tecnología"},
		{"Consumo", "Varios"},

		// Cuidado Personal
		{"Cuidado Personal", "Depilacion"},
		{"Cuidado Personal", "Estética"},
		{"Cuidado Personal", "Peluqueria"},

		// Inversiones
		{"Inversiones", "Bursatil"},
		{"Inversiones", "Criptomonedas"},
		{"Inversiones", "Arbitraje"},
		{"Inversiones", "Bonos"},
		{"Inversiones", "CEDEARs"},
		{"Inversiones", "Crypto"},
		{"Inversiones", "FCI"},
		{"Inversiones", "Staking Crypto"},
		{"Inversiones", "Tasa Fija ARS"},
		{"Inversiones", "Tasa Fija USD"},

		// Movilidad
		{"Movilidad", "Combustible"},
		{"Movilidad", "Mantenimiento Vehicular"},
		{"Movilidad", "Transporte Público"},
		{"Movilidad", "Uber"},

		// Ocio
		{"Ocio", "Actividades"},
		{"Ocio", "Eventos"},
		{"Ocio", "Gastronomía"},
		{"Ocio", "Salidas Nocturnas"},
		{"Ocio", "Viajes/Vacaciones"},

		// Prestamos
		{"Prestamos", "Adelantos"},

		// Regalos
		{"Regalos", "Amigos"},
		{"Regalos", "Familiar"},

		// Beneficio
		{"Beneficio", "Alimentar (Mercado Libre)"},

		// Ganancias
		{"Ganancias", "Inversiones"},

		// Premios
		{"Premios", "Bancos"},

		// Recuperos
		{"Recuperos", "Devoluciones"},
		{"Recuperos", "Prestamos"},

		// Reintegros
		{"Reintegros", "BBVA"},
		{"Reintegros", "Galicia"},
		{"Reintegros", "Naranja X"},
		{"Reintegros", "Swiss Medical"},
		{"Reintegros", "Uala"},

		// Ventas
		{"Ventas", "Facebook"},
		{"Ventas", "Mercadolibre"},
	}

	for _, ss := range subcategorySeeds {
		categoryID, ok := categoryIDs[ss.categoryName]
		if !ok {
			continue
		}

		existingSubs, err := repo.ListSubcategories(ctx, Filter{Deleted: false})
		if err == nil {
			found := false
			for _, sub := range existingSubs {
				if sub.CategoryID == categoryID && sub.Name == ss.name {
					found = true
					break
				}
			}
			if found {
				slog.Info("subcategory.seed.found", "subcategory", ss.name)
				continue
			}
		}

		sub := NewSubcategory(now, categoryID, ss.name)
		_, err = repo.CreateSubcategory(ctx, *sub)
		if err != nil {
			slog.Warn("subcategory.seed.error", "err", err, "subcategory", ss.name)
		} else {
			slog.Info("subcategory.seed.created", "subcategory", ss.name)
		}
	}

	return nil
}
