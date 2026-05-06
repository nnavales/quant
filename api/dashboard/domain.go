package dashboard

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
)

type KPIEvolutionResponse struct {
	KPI  string         `json:"kpi"`
	Data []KPIDataPoint `json:"data"`
}

type KPIDataPoint struct {
	Year  int     `json:"year"`
	Value float64 `json:"value"`
}

type DimensionSeriesResponse struct {
	Dimension string            `json:"dimension"` // category, subcategory, etc.
	Type      string            `json:"type"`      // income / expense
	Data      []DimensionSeries `json:"data"`
}

type DimensionSeries struct {
	Key  string            `json:"key"` // category name
	Data []TimeSeriesPoint `json:"data"`
}

type Composition struct {
	Key   string  `json:"key"` // category name
	Value float64 `json:"value"`
}

type TimeSeriesPoint struct {
	Month       string        `json:"month"`
	Value       float64       `json:"value"`
	Composition []Composition `json:"composition"`
}

const (
	KPIIncomeYTD              = "income_ytd"
	KPIExpensesYTD            = "expenses_ytd"
	KPINetSavingsYTD          = "net_savings_ytd"
	KPISavingsMargin          = "savings_margin"
	KPIAvgMonthlySavings      = "avg_monthly_savings"
	KPIFixedCostRatio         = "fixed_cost_ratio"
	KPIFixedExpenseMix        = "fixed_expense_mix"
	KPIFixedIncomeMix         = "fixed_income_mix"
	KPIStableIncomeCoverage   = "stable_income_coverage"
	KPIFinancialFlexibility   = "financial_flexibility"
	KPICoreBurnRate           = "core_burn_rate"
	KPISavingsVolatility      = "savings_volatility"
	KPISavingsVolatilityRatio = "savings_volatility_ratio"
	KPIProjectedYearlySavings = "projected_yearly_savings"
	KPIProjectedYearlyCapital = "projected_yearly_capital"
	KPICapitalGrowthRateYTD   = "capital_growth_rate_ytd"
	KPIExpenseCoverageMonths  = "expense_coverage_months"
	KPICapitalTotal           = "total_capital"
)

var ValidKPIs = map[string]bool{
	KPIIncomeYTD:              true,
	KPIExpensesYTD:            true,
	KPINetSavingsYTD:          true,
	KPISavingsMargin:          true,
	KPIAvgMonthlySavings:      true,
	KPIFixedCostRatio:         true,
	KPIFixedExpenseMix:        true,
	KPIFixedIncomeMix:         true,
	KPIStableIncomeCoverage:   true,
	KPIFinancialFlexibility:   true,
	KPICoreBurnRate:           true,
	KPISavingsVolatility:      true,
	KPISavingsVolatilityRatio: true,
	KPIProjectedYearlySavings: true,
	KPIProjectedYearlyCapital: true,
	KPICapitalGrowthRateYTD:   true,
	KPICapitalTotal:           true,
	KPIExpenseCoverageMonths:  true,
}

var ErrInvalidKPI = errors.New("invalid kpi")

const (
	DimensionCategory    = "category"
	DimensionSubcategory = "subcategory"
	DimensionAccount     = "account"
	DimensionChannel     = "channel"
)

var ValidDimensions = map[string]bool{
	DimensionCategory:    true,
	DimensionSubcategory: true,
	DimensionAccount:     true,
	DimensionChannel:     true,
}

var ErrInvalidDimension = errors.New("invalid dimension")

func IsValidKPI(kpi string) bool {
	return ValidKPIs[kpi]
}

func IsValidDimension(dim string) bool {
	return ValidDimensions[dim]
}

type DashboardResponse struct {
	CurrentYTD    KPIResponse   `json:"currentYtd"`
	PreviousYTD   KPIResponse   `json:"previousYtd"`
	MonthlySeries []MonthlyData `json:"monthlySeries"`
}

type MonthlyData struct {
	Month string `json:"month"` // "YYYY-MM"

	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
	Savings float64 `json:"savings"`
	Capital float64 `json:"capital"`

	IncomeFixed    float64 `json:"incomeFixed"`
	IncomeVariable float64 `json:"incomeVariable"`

	ExpenseFixed    float64 `json:"expenseFixed"`
	ExpenseVariable float64 `json:"expenseVariable"`

	ExchangeRate float64 `json:"exchangeRate"`
}

func rowToMonthlyData(r FinanceSummaryRow) MonthlyData {
	return MonthlyData{
		Month:           r.Month,
		Income:          r.Income.ToFloat(),
		Expense:         r.Expense.ToFloat(),
		Savings:         r.Savings.ToFloat(),
		Capital:         r.Capital.ToFloat(),
		IncomeFixed:     r.IncomeFixed.ToFloat(),
		IncomeVariable:  r.IncomeVariable.ToFloat(),
		ExpenseFixed:    r.ExpenseFixed.ToFloat(),
		ExpenseVariable: r.ExpenseVariable.ToFloat(),
		ExchangeRate:    r.ExchangeRate,
	}
}

type KPIResponse struct {
	IncomeYTD              float64
	ExpensesYTD            float64
	NetSavingsYTD          float64
	SavingsMargin          float64
	AvgMonthlySavings      float64
	FixedCostRatio         float64
	FixedExpenseMix        float64
	FixedIncomeMix         float64
	StableIncomeCoverage   float64
	FinancialFlexibility   float64
	CoreBurnRate           float64
	SavingsVolatility      float64
	SavingsVolatilityRatio float64
	ProjectedYearlySavings float64
	ProjectedYearlyCapital float64
	CapitalGrowthRateYTD   float64
	CapitalTotal           float64
	ExpenseCoverageMonths  float64
}

type FinanceSummaryRow struct {
	Month           string
	Income          money.Money
	Expense         money.Money
	Savings         money.Money
	IncomeFixed     money.Money
	ExpenseFixed    money.Money
	IncomeVariable  money.Money
	ExpenseVariable money.Money
	ExchangeRate    float64
	Capital         money.Money
}

type DimensionRow struct {
	Month           string
	Type            string
	Amount          money.Money
	CategoryID      *string
	SubcategoryID   *string
	AccountID       *string
	ChannelID       *string
	CategoryName    string
	SubcategoryName string
	AccountName     string
	ChannelName     string
}

type Filter struct {
}

type DimensionFilter struct {
	Type          string
	CategoryID    *string
	SubcategoryID *string
	AccountID     *string
	ChannelID     *string
	DateFrom      *timeutils.Date
	DateTo        *timeutils.Date
}

type Repository interface {
	GetFinanceSummary(ctx context.Context, filter *Filter) ([]FinanceSummaryRow, error)
	GetDimensionSeries(ctx context.Context, filter DimensionFilter) ([]DimensionRow, error)
}

func BuildKPIs(rows []MonthlyData) KPIResponse {
	if len(rows) == 0 {
		return KPIResponse{}
	}

	var (
		totalIncome       float64
		totalExpense      float64
		totalSavings      float64
		totalIncomeFixed  float64
		totalExpenseFixed float64
		totalExpenseVar   float64
	)

	minMonth := "9999-99"
	maxMonth := "0000-00"

	var latestRow MonthlyData

	// --- Aggregation ---
	for _, r := range rows {
		totalIncome += r.Income
		totalExpense += r.Expense
		totalSavings += r.Savings
		totalIncomeFixed += r.IncomeFixed
		totalExpenseFixed += r.ExpenseFixed
		totalExpenseVar += r.ExpenseVariable

		// detectar rango
		if r.Month < minMonth {
			minMonth = r.Month
		}
		if r.Month > maxMonth {
			maxMonth = r.Month
			latestRow = r // 👈 nos quedamos con el último mes
		}
	}

	// --- Time vs Data ---
	months := float64(diffInMonthsSafe(minMonth, maxMonth))
	observations := float64(len(rows))

	currentCapital := latestRow.Capital

	kpis := KPIResponse{
		IncomeYTD:     totalIncome,
		ExpensesYTD:   totalExpense,
		NetSavingsYTD: totalSavings,
		CapitalTotal:  currentCapital,
	}

	// --- Income, Expenses & Savings ---

	if totalIncome > 0 {
		kpis.SavingsMargin = totalSavings / totalIncome
	}

	if months > 0 {
		kpis.AvgMonthlySavings = totalSavings / months
	}

	// --- Cost Structure & Resilience ---

	if totalIncome > 0 {
		kpis.FixedCostRatio = totalExpenseFixed / totalIncome
		kpis.FixedIncomeMix = totalIncomeFixed / totalIncome
	}

	if totalExpense > 0 {
		kpis.FixedExpenseMix = totalExpenseFixed / totalExpense
		kpis.FinancialFlexibility = totalExpenseVar / totalExpense
	}

	if totalExpenseFixed > 0 {
		kpis.StableIncomeCoverage = totalIncomeFixed / totalExpenseFixed
	}

	if months > 0 {
		kpis.CoreBurnRate = totalExpenseFixed / months

		remainingMonths := 12 - int(months)
		kpis.ProjectedYearlySavings = totalSavings + (kpis.AvgMonthlySavings * float64(remainingMonths))

		// --- NUEVO: Projected YE Capital ---
		kpis.ProjectedYearlyCapital = currentCapital + (kpis.AvgMonthlySavings * float64(remainingMonths))
	}

	// --- NUEVO: Capital Growth Rate YTD ---
	if currentCapital > 0 {
		kpis.CapitalGrowthRateYTD = totalSavings / currentCapital
	}

	// --- NUEVO: Expense Coverage (months) ---
	if kpis.CoreBurnRate > 0 {
		kpis.ExpenseCoverageMonths = currentCapital / kpis.CoreBurnRate
	}

	// --- Savings Volatility ---
	if observations > 1 {
		mean := totalSavings / observations

		var variance float64
		for _, r := range rows {
			diff := r.Savings - mean
			variance += diff * diff
		}

		variance /= observations
		std := math.Sqrt(variance)

		kpis.SavingsVolatility = std

		if mean != 0 {
			kpis.SavingsVolatilityRatio = std / mean
		}
	}

	return kpis
}

func diffInMonthsSafe(start, end string) int {
	startTime, err1 := time.Parse("2006-01", start)
	endTime, err2 := time.Parse("2006-01", end)

	if err1 != nil || err2 != nil {
		return 0
	}

	years := endTime.Year() - startTime.Year()
	months := int(endTime.Month()) - int(startTime.Month())

	return years*12 + months + 1
}

func extractKPI(k KPIResponse, name string) float64 {
	switch name {
	case KPIIncomeYTD:
		return k.IncomeYTD
	case KPIExpensesYTD:
		return k.ExpensesYTD
	case KPINetSavingsYTD:
		return k.NetSavingsYTD
	case KPISavingsMargin:
		return k.SavingsMargin
	case KPIAvgMonthlySavings:
		return k.AvgMonthlySavings
	case KPIFixedCostRatio:
		return k.FixedCostRatio
	case KPIFixedExpenseMix:
		return k.FixedExpenseMix
	case KPIFixedIncomeMix:
		return k.FixedIncomeMix
	case KPIStableIncomeCoverage:
		return k.StableIncomeCoverage
	case KPIFinancialFlexibility:
		return k.FinancialFlexibility
	case KPICoreBurnRate:
		return k.CoreBurnRate
	case KPISavingsVolatility:
		return k.SavingsVolatility
	case KPISavingsVolatilityRatio:
		return k.SavingsVolatilityRatio
	case KPIProjectedYearlySavings:
		return k.ProjectedYearlySavings
	case KPIProjectedYearlyCapital:
		return k.ProjectedYearlyCapital
	case KPICapitalGrowthRateYTD:
		return k.CapitalGrowthRateYTD
	case KPICapitalTotal:
		return k.CapitalTotal
	case KPIExpenseCoverageMonths:
		return k.ExpenseCoverageMonths
	default:
		return 0
	}
}

/*
"SavingsVolatility": 719.4130854384009,
"SavingsVolatilityRatio": 0.7040989336319069,

Capital Growth vs. LY
Capital Growth Rate YTD
Expense Coverage (Months)
Projected YE Capital
Savings vs Forecast YTD (%)
Savings vs Plan YTD (%)
Capital vs Forecast YE (%)
Capital vs Plan YE (%)
Capital Gap to Forecast YE (%)
Capital Gap to Plan YE (%)
*/

/*
Algo esta mal o raro en savingstability
Agregar bien los filters para que haga bien todos los calculos
*/

func parseDimensionFilter(params map[string][]string) (DimensionFilter, error) {
	f := DimensionFilter{}

	if v, ok := params["type"]; ok && len(v) > 0 && v[0] != "" {
		f.Type = v[0]
	}

	if v, ok := params["category_id"]; ok && len(v) > 0 && v[0] != "" {
		f.CategoryID = &v[0]
	}

	if v, ok := params["subcategory_id"]; ok && len(v) > 0 && v[0] != "" {
		f.SubcategoryID = &v[0]
	}

	if v, ok := params["account_id"]; ok && len(v) > 0 && v[0] != "" {
		f.AccountID = &v[0]
	}

	if v, ok := params["channel_id"]; ok && len(v) > 0 && v[0] != "" {
		f.ChannelID = &v[0]
	}

	if v, ok := params["date_from"]; ok && len(v) > 0 && v[0] != "" {
		d, err := timeutils.ParseDate(v[0])
		if err != nil {
			return f, err
		}
		f.DateFrom = &d
	}

	if v, ok := params["date_to"]; ok && len(v) > 0 && v[0] != "" {
		d, err := timeutils.ParseDate(v[0])
		if err != nil {
			return f, err
		}
		f.DateTo = &d
	}

	return f, nil
}
