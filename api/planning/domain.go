package planning

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/nnavales/quant/api/apperrors"
	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
	"github.com/oklog/ulid/v2"
)

type GoalMetric string

const (
	GoalIncome  GoalMetric = "income"
	GoalExpense GoalMetric = "expense"
)

var validGoalMetrics = map[GoalMetric]bool{
	GoalIncome:  true,
	GoalExpense: true,
}

func IsValidGoalMetric(m GoalMetric) bool {
	return validGoalMetrics[m]
}

var ErrInvalidField = apperrors.ErrInvalidInput
var ErrNotFound = apperrors.ErrNotFound

type PlanningInput struct {
	ID          string                       `json:"id"`
	Year        int                          `json:"year"`
	Description string                       `json:"description"`
	Type        transactions.TransactionType `json:"type"`
	Currency    entries.Currency             `json:"currency"`
	January     money.Money                  `json:"january"`
	February    money.Money                  `json:"february"`
	March       money.Money                  `json:"march"`
	April       money.Money                  `json:"april"`
	May         money.Money                  `json:"may"`
	June        money.Money                  `json:"june"`
	July        money.Money                  `json:"july"`
	August      money.Money                  `json:"august"`
	September   money.Money                  `json:"september"`
	October     money.Money                  `json:"october"`
	November    money.Money                  `json:"november"`
	December    money.Money                  `json:"december"`
	CreatedAt   time.Time                    `json:"created_at"`
	UpdatedAt   *time.Time                   `json:"updated_at"`
}

func NewPlanningInput(
	clock timeutils.Clock,
	year int,
	description string,
	currency entries.Currency,
	inputType transactions.TransactionType,
	values [12]money.Money,
) (*PlanningInput, error) {

	id := ulid.Make().String()

	i := &PlanningInput{
		ID:          id,
		Year:        year,
		Description: description,
		Type:        inputType,
		Currency:    currency,
		January:     values[0],
		February:    values[1],
		March:       values[2],
		April:       values[3],
		May:         values[4],
		June:        values[5],
		July:        values[6],
		August:      values[7],
		September:   values[8],
		October:     values[9],
		November:    values[10],
		December:    values[11],
		CreatedAt:   clock.Now(),
	}

	if err := i.Validate(); err != nil {
		return nil, err
	}

	return i, nil
}

func (i *PlanningInput) Validate() error {
	if i.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if i.Year == 0 {
		return fmt.Errorf("year is required: %w", ErrInvalidField)
	}
	if i.Description == "" {
		return fmt.Errorf("description is required: %w", ErrInvalidField)
	}
	if len(i.Description) > 50 {
		return fmt.Errorf("description is too long (max 50 chars): %w", ErrInvalidField)
	}
	if i.Type == "" {
		return fmt.Errorf("type is required: %w", ErrInvalidField)
	}
	if i.Currency == "" {
		return fmt.Errorf("currency is required: %w", ErrInvalidField)
	}

	return nil
}

type Repository interface {
	GetInput(ctx context.Context, ID string) (*PlanningInput, error)
	ListInputs(ctx context.Context) ([]PlanningInput, error)
	ListInputsByYear(ctx context.Context, year string) ([]PlanningInput, error)
	CreateInput(ctx context.Context, i PlanningInput) (*PlanningInput, error)
	CreateInputTx(ctx context.Context, tx *sql.Tx, i PlanningInput) (*PlanningInput, error)
	UpdateInput(ctx context.Context, i PlanningInput, now time.Time) (*PlanningInput, error)
	DeleteInput(ctx context.Context, id string) error

	GetRateByDate(ctx context.Context, date timeutils.YearMonth) (*ExchangeRateInput, error)
	ListRates(ctx context.Context) ([]ExchangeRateInput, error)
	ListRatesByYear(ctx context.Context, year string) ([]ExchangeRateInput, error)
	CreateRate(ctx context.Context, i ExchangeRateInput) (*ExchangeRateInput, error)
	CreateRateTx(ctx context.Context, tx *sql.Tx, i ExchangeRateInput) (*ExchangeRateInput, error)
	UpdateRate(ctx context.Context, i ExchangeRateInput, now time.Time) (*ExchangeRateInput, error)
	DeleteRate(ctx context.Context, date timeutils.YearMonth) error

	GetGoal(ctx context.Context, id string) (*PlanningGoal, error)
	ListGoals(ctx context.Context) ([]PlanningGoal, error)
	ListGoalsByYear(ctx context.Context, year string) ([]PlanningGoal, error)
	CreateGoal(ctx context.Context, g PlanningGoal) (*PlanningGoal, error)
	CreateGoalTx(ctx context.Context, tx *sql.Tx, g PlanningGoal) (*PlanningGoal, error)
	UpdateGoal(ctx context.Context, g PlanningGoal, now time.Time) (*PlanningGoal, error)
	DeleteGoal(ctx context.Context, id string) error

	GetPlanningConfig(ctx context.Context, year int) (*PlanningConfig, error)
	ListPlanningConfigs(ctx context.Context) ([]PlanningConfig, error)
	UpsertPlanningConfig(ctx context.Context, c PlanningConfig) (*PlanningConfig, error)
	UpsertPlanningConfigTx(ctx context.Context, tx *sql.Tx, c PlanningConfig) (*PlanningConfig, error)
}

type PlanningYear struct {
	Year   int             `json:"year"`
	Inputs []PlanningInput `json:"inputs"`
	Months []PlanningMonth `json:"months"`
	Totals PlanningTotals  `json:"totals"`
}

type PlanningMonth struct {
	Month   int         `json:"month"`
	Income  money.Money `json:"income"`
	Expense money.Money `json:"expense"`
	Savings money.Money `json:"savings"`
	Capital money.Money `json:"capital"`
}

type PlanningTotals struct {
	Income  money.Money `json:"income"`
	Expense money.Money `json:"expense"`
	Savings money.Money `json:"savings"`
	Capital money.Money `json:"capital"`
}

type PlanningConfig struct {
	Year           int         `json:"year"`
	InitialCapital money.Money `json:"initial_capital"`
	UpdatedAt      *time.Time  `json:"updated_at"`
}

type PlanningConfigReq struct {
	InitialCapital *money.Money `json:"initial_capital"`
}

// helper para calcular planning year desde input

type PlanningReq struct {
	Year        *int                          `json:"year"`
	Description *string                       `json:"description"`
	Type        *transactions.TransactionType `json:"type"`
	Currency    *entries.Currency             `json:"currency"`
	January     *money.Money                  `json:"january"`
	February    *money.Money                  `json:"february"`
	March       *money.Money                  `json:"march"`
	April       *money.Money                  `json:"april"`
	May         *money.Money                  `json:"may"`
	June        *money.Money                  `json:"june"`
	July        *money.Money                  `json:"july"`
	August      *money.Money                  `json:"august"`
	September   *money.Money                  `json:"september"`
	October     *money.Money                  `json:"october"`
	November    *money.Money                  `json:"november"`
	December    *money.Money                  `json:"december"`
}

type PlanningGoalMonth struct {
	Month   int         `json:"month"`
	Income  money.Money `json:"income"`
	Expense money.Money `json:"expense"`
	Savings money.Money `json:"savings"`
	Capital money.Money `json:"capital"`
}

type PlanningGoalYear struct {
	Year           int                 `json:"year"`
	InitialCapital money.Money         `json:"initial_capital"`
	Months         []PlanningGoalMonth `json:"months"`
	Goals          []PlanningGoal      `json:"goals"`
	Totals         PlanningGoalMonth   `json:"totals"`
}

type ExchangeRateInput struct {
	Month     timeutils.YearMonth `json:"month"`
	Rate      float64             `json:"exchange_rate"`
	UpdatedAt *time.Time          `json:"updated_at"`
}

func NewExchangeRateInput(month timeutils.YearMonth, rate float64) (*ExchangeRateInput, error) {
	r := &ExchangeRateInput{
		Month: month,
		Rate:  rate,
	}

	if err := r.Validate(); err != nil {
		return nil, err
	}

	return r, nil
}

func (r *ExchangeRateInput) Validate() error {
	if r.Month.IsZero() {
		return fmt.Errorf("month is required: %w", ErrInvalidField)
	}

	if r.Rate <= 0 {
		return fmt.Errorf("rate cannot be a value less or equal to zero, %w", ErrInvalidField)
	}

	return nil
}

type ExchangeRateReq struct {
	Month *timeutils.YearMonth `json:"month"`
	Rate  *float64             `json:"exchange_rate"`
}

type PlanningGoal struct {
	ID        string      `json:"id"`
	Year      int         `json:"year"`
	Metric    GoalMetric  `json:"metric"` // income, expense
	January   money.Money `json:"january"`
	February  money.Money `json:"february"`
	March     money.Money `json:"march"`
	April     money.Money `json:"april"`
	May       money.Money `json:"may"`
	June      money.Money `json:"june"`
	July      money.Money `json:"july"`
	August    money.Money `json:"august"`
	September money.Money `json:"september"`
	October   money.Money `json:"october"`
	November  money.Money `json:"november"`
	December  money.Money `json:"december"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt *time.Time  `json:"updated_at"`
}

func NewPlanningGoal(clock timeutils.Clock, year int, metric GoalMetric, values [12]money.Money) (*PlanningGoal, error) {
	if !IsValidGoalMetric(metric) {
		return nil, fmt.Errorf("invalid goal metric %q: %w", metric, ErrInvalidField)
	}

	id := ulid.Make().String()

	g := &PlanningGoal{
		ID:        id,
		Year:      year,
		Metric:    metric,
		January:   values[0],
		February:  values[1],
		March:     values[2],
		April:     values[3],
		May:       values[4],
		June:      values[5],
		July:      values[6],
		August:    values[7],
		September: values[8],
		October:   values[9],
		November:  values[10],
		December:  values[11],
		CreatedAt: clock.Now(),
	}

	if err := g.Validate(); err != nil {
		return nil, err
	}

	return g, nil
}

func (g *PlanningGoal) Validate() error {
	if g.ID == "" {
		return fmt.Errorf("id is required: %w", ErrInvalidField)
	}
	if g.Year == 0 {
		return fmt.Errorf("year is required: %w", ErrInvalidField)
	}
	if !IsValidGoalMetric(g.Metric) {
		return fmt.Errorf("invalid metric %q: %w", g.Metric, ErrInvalidField)
	}
	return nil
}

type PlanningGoalReq struct {
	Year      *int         `json:"year"`
	Metric    *GoalMetric  `json:"metric"`
	January   *money.Money `json:"january"`
	February  *money.Money `json:"february"`
	March     *money.Money `json:"march"`
	April     *money.Money `json:"april"`
	May       *money.Money `json:"may"`
	June      *money.Money `json:"june"`
	July      *money.Money `json:"july"`
	August    *money.Money `json:"august"`
	September *money.Money `json:"september"`
	October   *money.Money `json:"october"`
	November  *money.Money `json:"november"`
	December  *money.Money `json:"december"`
}
