package planning

import (
	"context"
	"fmt"
	"strconv"

	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
)

type Service struct {
	repo  Repository
	clock timeutils.Clock
}

func NewService(clock timeutils.Clock, repo Repository) *Service {
	return &Service{
		repo:  repo,
		clock: clock,
	}
}

func (s *Service) CreateInput(ctx context.Context, req PlanningReq) (*PlanningInput, error) {
	input, err := NewPlanningInput(s.clock, *req.Month, *req.Description, *req.Currency, *req.Type, *req.Amount)
	if err != nil {
		return nil, fmt.Errorf("failed to create planning input: %w", err)
	}

	created, err := s.repo.CreateInput(ctx, *input)
	if err != nil {
		return nil, fmt.Errorf("failed to create planning input: %w", err)
	}
	return created, nil
}

func (s *Service) GetInput(ctx context.Context, id string) (*PlanningInput, error) {
	input, err := s.repo.GetInput(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get planning input: %w", err)
	}
	return input, nil
}

func (s *Service) ListInputs(ctx context.Context) ([]PlanningInput, error) {
	inputs, err := s.repo.ListInputs(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list planning inputs: %w", err)
	}
	return inputs, nil
}

func (s *Service) UpdateInput(ctx context.Context, id string, req PlanningReq) (*PlanningInput, error) {
	input, err := s.repo.GetInput(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get planning input for update: %w", err)
	}

	now := s.clock.Now()
	if req.Month != nil {
		input.Month = *req.Month
	}
	if req.Description != nil {
		input.Description = *req.Description
	}
	if req.Type != nil {
		input.Type = *req.Type
	}
	if req.Amount != nil {
		input.Amount = *req.Amount
	}
	if req.Currency != nil {
		input.Currency = *req.Currency
	}

	input.UpdatedAt = &now

	if err := input.Validate(); err != nil {
		return nil, fmt.Errorf("invalid planning input: %w", err)
	}

	updated, err := s.repo.UpdateInput(ctx, *input, now)
	if err != nil {
		return nil, fmt.Errorf("failed to update planning input: %w", err)
	}
	return updated, nil
}

func (s *Service) ListInputsByYear(ctx context.Context, year string) ([]PlanningInput, error) {
	inputs, err := s.repo.ListInputsByYear(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("failed to list planning inputs by year: %w", err)
	}
	return inputs, nil
}

func (s *Service) DeleteInput(ctx context.Context, id string) error {
	err := s.repo.DeleteInput(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete planning input: %w", err)
	}
	return nil
}

func (s *Service) CreateRate(ctx context.Context, req ExchangeRateReq) (*ExchangeRateInput, error) {
	if req.Month == nil || req.Rate == nil {
		return nil, fmt.Errorf("all fields are required: %w", ErrInvalidField)
	}

	input, err := NewExchangeRateInput(*req.Month, *req.Rate)
	if err != nil {
		return nil, fmt.Errorf("failed to create exchange rate: %w", err)
	}

	now := s.clock.Now()
	input.UpdatedAt = &now

	created, err := s.repo.CreateRate(ctx, *input)
	if err != nil {
		return nil, fmt.Errorf("failed to create exchange rate: %w", err)
	}
	return created, nil
}

func (s *Service) GetRateByDate(ctx context.Context, date timeutils.YearMonth) (*ExchangeRateInput, error) {
	rate, err := s.repo.GetRateByDate(ctx, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get exchange rate: %w", err)
	}
	return rate, nil
}

func (s *Service) ListRatesByYear(ctx context.Context, year string) ([]ExchangeRateInput, error) {
	rates, err := s.repo.ListRatesByYear(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("failed to list exchange rates: %w", err)
	}
	return rates, nil
}

func (s *Service) UpdateRate(ctx context.Context, date timeutils.YearMonth, req ExchangeRateReq) (*ExchangeRateInput, error) {
	rate, err := s.repo.GetRateByDate(ctx, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get exchange rate for update: %w", err)
	}

	now := s.clock.Now()
	if req.Rate != nil {
		rate.Rate = *req.Rate
	}

	updated, err := s.repo.UpdateRate(ctx, *rate, now)
	if err != nil {
		return nil, fmt.Errorf("failed to update exchange rate: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteRate(ctx context.Context, date timeutils.YearMonth) error {
	err := s.repo.DeleteRate(ctx, date)
	if err != nil {
		return fmt.Errorf("failed to delete exchange rate: %w", err)
	}
	return nil
}

func (s *Service) BuildPlanningYear(ctx context.Context, year string) (*PlanningYear, error) {
	inputs, err := s.repo.ListInputsByYear(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get inputs: %w", err)
	}

	rates, err := s.repo.ListRatesByYear(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get rates: %w", err)
	}

	rateByMonth := make(map[int]float64)
	for _, r := range rates {
		rateByMonth[int(r.Month.Month())] = r.Rate
	}

	months := make([]PlanningMonth, 12)
	for i := range months {
		months[i].Month = i + 1
	}

	for _, input := range inputs {
		month := int(input.Month.Month())
		m := &months[month-1]
		rate, ok := rateByMonth[month]

		switch input.Currency {
		case entries.CurrencyARS:
			switch input.Type {
			case transactions.TypeIncome:
				m.IncomeARS += input.Amount
				if ok {
					m.IncomeUSD += input.Amount.ARSToUSD(rate)
				}
			case transactions.TypeExpense:
				m.ExpenseARS += input.Amount
				if ok {
					m.ExpenseUSD += input.Amount.ARSToUSD(rate)
				}
			}
		case entries.CurrencyUSD:
			switch input.Type {
			case transactions.TypeIncome:
				m.IncomeUSD += input.Amount
				if ok {
					m.IncomeARS += input.Amount.USDToARS(rate)
				}
			case transactions.TypeExpense:
				m.ExpenseUSD += input.Amount
				if ok {
					m.ExpenseARS += input.Amount.USDToARS(rate)
				}
			}
		}
	}

	var totals PlanningTotals
	for i := range months {
		m := &months[i]
		m.SavingsARS = m.IncomeARS - m.ExpenseARS
		m.SavingsUSD = m.IncomeUSD - m.ExpenseUSD

		totals.IncomeARS += m.IncomeARS
		totals.ExpenseARS += m.ExpenseARS
		totals.SavingsARS += m.SavingsARS
		totals.IncomeUSD += m.IncomeUSD
		totals.ExpenseUSD += m.ExpenseUSD
		totals.SavingsUSD += m.SavingsUSD
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		return &PlanningYear{}, err
	}

	return &PlanningYear{
		Year:   yearInt,
		Inputs: inputs,
		Rates:  rates,
		Months: months,
		Totals: totals,
	}, nil
}
