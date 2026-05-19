package planning

import (
	"context"
	"fmt"
	"strconv"

	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/money"
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
	if req.Year == nil || req.Description == nil || req.Type == nil || req.Currency == nil {
		return nil, fmt.Errorf("year, description, type and currency are required: %w", ErrInvalidField)
	}

	values := [12]money.Money{
		ptrOrZero(req.January), ptrOrZero(req.February), ptrOrZero(req.March),
		ptrOrZero(req.April), ptrOrZero(req.May), ptrOrZero(req.June),
		ptrOrZero(req.July), ptrOrZero(req.August), ptrOrZero(req.September),
		ptrOrZero(req.October), ptrOrZero(req.November), ptrOrZero(req.December),
	}

	input, err := NewPlanningInput(s.clock, *req.Year, *req.Description, *req.Currency, *req.Type, values)
	if err != nil {
		return nil, fmt.Errorf("failed to create planning input: %w", err)
	}

	created, err := s.repo.CreateInput(ctx, *input)
	if err != nil {
		return nil, fmt.Errorf("failed to create planning input: %w", err)
	}
	return created, nil
}

func ptrOrZero(m *money.Money) money.Money {
	if m == nil {
		return 0
	}
	return *m
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

	if req.Description != nil {
		input.Description = *req.Description
	}
	if req.Type != nil {
		input.Type = *req.Type
	}
	if req.Currency != nil {
		input.Currency = *req.Currency
	}
	if req.January != nil {
		input.January = *req.January
	}
	if req.February != nil {
		input.February = *req.February
	}
	if req.March != nil {
		input.March = *req.March
	}
	if req.April != nil {
		input.April = *req.April
	}
	if req.May != nil {
		input.May = *req.May
	}
	if req.June != nil {
		input.June = *req.June
	}
	if req.July != nil {
		input.July = *req.July
	}
	if req.August != nil {
		input.August = *req.August
	}
	if req.September != nil {
		input.September = *req.September
	}
	if req.October != nil {
		input.October = *req.October
	}
	if req.November != nil {
		input.November = *req.November
	}
	if req.December != nil {
		input.December = *req.December
	}

	if err := input.Validate(); err != nil {
		return nil, fmt.Errorf("invalid planning input: %w", err)
	}

	updated, err := s.repo.UpdateInput(ctx, *input, s.clock.Now())
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

func (s *Service) CreateGoal(ctx context.Context, req PlanningGoalReq) (*PlanningGoal, error) {
	if req.Year == nil || req.Metric == nil {
		return nil, fmt.Errorf("year and metric are required: %w", ErrInvalidField)
	}

	values := [12]money.Money{
		ptrOrZero(req.January), ptrOrZero(req.February), ptrOrZero(req.March),
		ptrOrZero(req.April), ptrOrZero(req.May), ptrOrZero(req.June),
		ptrOrZero(req.July), ptrOrZero(req.August), ptrOrZero(req.September),
		ptrOrZero(req.October), ptrOrZero(req.November), ptrOrZero(req.December),
	}

	goal, err := NewPlanningGoal(s.clock, *req.Year, *req.Metric, values)
	if err != nil {
		return nil, fmt.Errorf("failed to create planning goal: %w", err)
	}

	created, err := s.repo.CreateGoal(ctx, *goal)
	if err != nil {
		return nil, fmt.Errorf("failed to create planning goal: %w", err)
	}
	return created, nil
}

func (s *Service) GetGoal(ctx context.Context, id string) (*PlanningGoal, error) {
	return s.repo.GetGoal(ctx, id)
}

func (s *Service) ListGoalsByYear(ctx context.Context, year string) ([]PlanningGoal, error) {
	return s.repo.ListGoalsByYear(ctx, year)
}

func (s *Service) UpdateGoal(ctx context.Context, id string, req PlanningGoalReq) (*PlanningGoal, error) {
	goal, err := s.repo.GetGoal(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get planning goal for update: %w", err)
	}

	if req.Metric != nil {
		goal.Metric = *req.Metric
	}
	if req.January != nil {
		goal.January = *req.January
	}
	if req.February != nil {
		goal.February = *req.February
	}
	if req.March != nil {
		goal.March = *req.March
	}
	if req.April != nil {
		goal.April = *req.April
	}
	if req.May != nil {
		goal.May = *req.May
	}
	if req.June != nil {
		goal.June = *req.June
	}
	if req.July != nil {
		goal.July = *req.July
	}
	if req.August != nil {
		goal.August = *req.August
	}
	if req.September != nil {
		goal.September = *req.September
	}
	if req.October != nil {
		goal.October = *req.October
	}
	if req.November != nil {
		goal.November = *req.November
	}
	if req.December != nil {
		goal.December = *req.December
	}

	if err := goal.Validate(); err != nil {
		return nil, fmt.Errorf("invalid planning goal: %w", err)
	}

	updated, err := s.repo.UpdateGoal(ctx, *goal, s.clock.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to update planning goal: %w", err)
	}
	return updated, nil
}

func (s *Service) DeleteGoal(ctx context.Context, id string) error {
	return s.repo.DeleteGoal(ctx, id)
}

func (s *Service) GetPlanningConfig(ctx context.Context, year int) (*PlanningConfig, error) {
	cfg, err := s.repo.GetPlanningConfig(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get planning config: %w", err)
	}
	return cfg, nil
}

func (s *Service) SetPlanningConfig(ctx context.Context, year int, req PlanningConfigReq) (*PlanningConfig, error) {
	now := s.clock.Now()
	cfg := PlanningConfig{
		Year:      year,
		UpdatedAt: &now,
	}
	if req.InitialCapital != nil {
		cfg.InitialCapital = *req.InitialCapital
	}

	updated, err := s.repo.UpsertPlanningConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to set planning config: %w", err)
	}
	return updated, nil
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

	yearInt, _ := strconv.Atoi(year)
	cfg, _ := s.repo.GetPlanningConfig(ctx, yearInt)
	var initialCapital money.Money
	if cfg != nil {
		initialCapital = cfg.InitialCapital
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
		monthlyValues := [12]money.Money{
			input.January, input.February, input.March, input.April, input.May, input.June,
			input.July, input.August, input.September, input.October, input.November, input.December,
		}

		for m := range 12 {
			amount := monthlyValues[m]
			if amount == 0 {
				continue
			}

			month := m + 1
			rate, ok := rateByMonth[month]

			switch input.Currency {
			case entries.CurrencyARS:
				if !ok {
					continue
				}
				switch input.Type {
				case transactions.TypeIncome:
					months[m].Income += amount.ARSToUSD(rate)
				case transactions.TypeExpense:
					months[m].Expense += amount.ARSToUSD(rate)
				}
			case entries.CurrencyUSD:
				switch input.Type {
				case transactions.TypeIncome:
					months[m].Income += amount
				case transactions.TypeExpense:
					months[m].Expense += amount
				}
			}
		}
	}

	var totals PlanningTotals
	for i := range months {
		m := &months[i]
		m.Savings = m.Income - m.Expense

		if i == 0 {
			m.Capital = initialCapital + m.Savings
		} else {
			m.Capital = months[i-1].Capital + m.Savings
		}

		totals.Income += m.Income
		totals.Expense += m.Expense
		totals.Savings += m.Savings
		totals.Capital = m.Capital
	}

	return &PlanningYear{
		Year:   yearInt,
		Months: months,
		Inputs: inputs,
		Totals: totals,
	}, nil
}

type GoalAdjustment struct {
	ExtraIncome  money.Money
	ExtraExpense money.Money
}

func (s *Service) GetPlanYear(ctx context.Context, yearStr string) (*PlanningGoalYear, error) {
	goals, err := s.repo.ListGoalsByYear(ctx, yearStr)
	if err != nil {
		return nil, fmt.Errorf("failed to get goals: %w", err)
	}

	var incomeGoal, expenseGoal *PlanningGoal
	for i, g := range goals {
		switch g.Metric {
		case GoalIncome:
			incomeGoal = &goals[i]
		case GoalExpense:
			expenseGoal = &goals[i]
		}
	}

	if incomeGoal == nil && expenseGoal == nil {
		yearInt, _ := strconv.Atoi(yearStr)

		cfg, _ := s.repo.GetPlanningConfig(ctx, yearInt)

		initialCapital := money.Money(0)
		if cfg != nil {
			initialCapital = cfg.InitialCapital
		}

		months := make([]PlanningGoalMonth, 12)

		var capital money.Money = initialCapital

		for i := range months {
			months[i] = PlanningGoalMonth{
				Month:   i + 1,
				Income:  0,
				Expense: 0,
				Savings: 0,
				Capital: capital,
			}
		}

		return &PlanningGoalYear{
			Year:           yearInt,
			Goals:          []PlanningGoal{},
			InitialCapital: initialCapital,
			Months:         months,
			Totals: PlanningGoalMonth{
				Capital: capital,
			},
		}, nil
	}

	yearInt, _ := strconv.Atoi(yearStr)
	cfg, _ := s.repo.GetPlanningConfig(ctx, yearInt)
	initialCapital := money.Money(0)
	if cfg != nil {
		initialCapital = cfg.InitialCapital
	}

	months := make([]PlanningGoalMonth, 12)
	var total PlanningGoalMonth

	for m := 0; m < 12; m++ {
		monthVal := func(g *PlanningGoal) money.Money {
			if g == nil {
				return 0
			}
			switch m {
			case 0:
				return g.January
			case 1:
				return g.February
			case 2:
				return g.March
			case 3:
				return g.April
			case 4:
				return g.May
			case 5:
				return g.June
			case 6:
				return g.July
			case 7:
				return g.August
			case 8:
				return g.September
			case 9:
				return g.October
			case 10:
				return g.November
			case 11:
				return g.December
			default:
				return 0
			}
		}

		income := monthVal(incomeGoal)
		expense := monthVal(expenseGoal)
		savings := income - expense

		var capital money.Money
		if m == 0 {
			capital = initialCapital + savings
		} else {
			capital = months[m-1].Capital + savings
		}

		months[m] = PlanningGoalMonth{
			Month:   m + 1,
			Income:  income,
			Expense: expense,
			Savings: savings,
			Capital: capital,
		}

		total.Income += income
		total.Expense += expense
		total.Savings += savings
	}
	total.Capital = months[11].Capital

	return &PlanningGoalYear{
		Year:           yearInt,
		Goals:          goals,
		InitialCapital: initialCapital,
		Months:         months,
		Totals:         total,
	}, nil
}

func (s *Service) GenerateGoalsFromForecast(ctx context.Context, year int, adj GoalAdjustment) error {
	pYear, err := s.BuildPlanningYear(ctx, strconv.Itoa(year))
	if err != nil {
		return fmt.Errorf("failed to build planning year: %w", err)
	}

	extraIncomePerMonth := adj.ExtraIncome / 12
	extraExpensePerMonth := adj.ExtraExpense / 12

	var incomeValues, expenseValues [12]money.Money
	for i, m := range pYear.Months {
		incomeValues[i] = m.Income + extraIncomePerMonth
		expenseValues[i] = m.Expense + extraExpensePerMonth
	}

	existing, err := s.repo.ListGoalsByYear(ctx, strconv.Itoa(year))
	if err != nil {
		return fmt.Errorf("failed to get existing goals: %w", err)
	}

	if err := s.upsertGoal(ctx, year, GoalIncome, &incomeValues, existing); err != nil {
		return err
	}
	if err := s.upsertGoal(ctx, year, GoalExpense, &expenseValues, existing); err != nil {
		return err
	}

	return nil
}

func (s *Service) upsertGoal(ctx context.Context, year int, metric GoalMetric, values *[12]money.Money, existing []PlanningGoal) error {
	for _, g := range existing {
		if g.Metric == metric {
			g.January = values[0]
			g.February = values[1]
			g.March = values[2]
			g.April = values[3]
			g.May = values[4]
			g.June = values[5]
			g.July = values[6]
			g.August = values[7]
			g.September = values[8]
			g.October = values[9]
			g.November = values[10]
			g.December = values[11]

			if _, err := s.repo.UpdateGoal(ctx, g, s.clock.Now()); err != nil {
				return fmt.Errorf("failed to update %s goal: %w", metric, err)
			}
			return nil
		}
	}

	goal, err := NewPlanningGoal(s.clock, year, metric, *values)
	if err != nil {
		return fmt.Errorf("failed to create %s goal: %w", metric, err)
	}
	if _, err := s.repo.CreateGoal(ctx, *goal); err != nil {
		return fmt.Errorf("failed to create %s goal: %w", metric, err)
	}
	return nil
}
