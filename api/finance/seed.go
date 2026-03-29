package finance

import (
	"context"
	"time"
)

func (s *Service) SeedDefaults(ctx context.Context) error {
	now := time.Now()
	efectivo := NewChannel(now, "Efectivo")
	channels := []Channel{*efectivo}

	for _, ch := range channels {
		if err := ch.Validate(); err != nil {
			continue
		}
		_, _ = s.repo.CreateChannel(ctx, ch)
	}

	accounts := []Account{
		*NewAccount(now, efectivo.ID, "Efectivo", "cash"),
	}
	for _, acc := range accounts {
		if err := acc.Validate(); err != nil {
			continue
		}
		_, _ = s.repo.CreateAccount(ctx, acc)
	}

	servicios := NewCategory(now, "Servicios")
	suscripciones := NewCategory(now, "Suscripciones")

	categories := []Category{
		*servicios,
		*suscripciones,
	}
	for _, cat := range categories {
		if err := cat.Validate(); err != nil {
			continue
		}
		_, _ = s.repo.CreateCategory(ctx, cat)
	}

	subcategories := []Subcategory{
		*NewSubcategory(now, servicios.ID, "Agua"),
		*NewSubcategory(now, servicios.ID, "Cable"),
		*NewSubcategory(now, servicios.ID, "Gas"),
		*NewSubcategory(now, servicios.ID, "Luz"),
		*NewSubcategory(now, servicios.ID, "Telefonos"),
	}
	for _, sub := range subcategories {
		if err := sub.Validate(); err != nil {
			continue
		}
		_, _ = s.repo.CreateSubcategory(ctx, sub)
	}

	return nil
}
