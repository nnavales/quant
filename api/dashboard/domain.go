package dashboard

import (
	"context"
	"math"
	"time"
)

type KPIResponse struct {
	IncomeYTD            float64
	ExpensesYTD          float64
	NetSavingsYTD        float64
	SavingsMargin        float64
	AvgMonthlySavings    float64
	FixedCostRatio       float64
	FixedExpenseMix      float64
	FixedIncomeMix       float64
	StableIncomeCoverage float64
	FinancialFlexibility float64
	CoreBurnRate         float64
	SavingsVolatility    float64
}

type FinanceSummaryRow struct {
	Month           string
	Income          float64
	Expense         float64
	Savings         float64
	IncomeFixed     float64
	ExpenseFixed    float64
	IncomeVariable  float64
	ExpenseVariable float64
	ExchangeRate    float64
}

type Filter struct {
}

type Repository interface {
	GetFinanceSummary(ctx context.Context, filter *Filter) ([]FinanceSummaryRow, error)
}

func BuildKPIs(rows []FinanceSummaryRow) KPIResponse {
	var (
		totalIncome       float64
		totalExpense      float64
		totalSavings      float64
		totalIncomeFixed  float64
		totalExpenseFixed float64
		totalExpenseVar   float64
	)

	// --- Detect min/max month (YYYY-MM safe lexicographically) ---
	minMonth := "9999-99"
	maxMonth := "0000-00"

	for _, r := range rows {
		totalIncome += r.Income
		totalExpense += r.Expense
		totalSavings += r.Savings
		totalIncomeFixed += r.IncomeFixed
		totalExpenseFixed += r.ExpenseFixed
		totalExpenseVar += r.ExpenseVariable

		if r.Month < minMonth {
			minMonth = r.Month
		}
		if r.Month > maxMonth {
			maxMonth = r.Month
		}
	}

	months := float64(diffInMonthsSafe(minMonth, maxMonth))

	kpis := KPIResponse{
		IncomeYTD:     totalIncome,
		ExpensesYTD:   totalExpense,
		NetSavingsYTD: totalSavings,
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
	}

	// --- Savings Volatility (STD DEV real) ---
	if len(rows) > 1 && months > 0 {
		mean := kpis.AvgMonthlySavings
		var variance float64

		for _, r := range rows {
			diff := r.Savings - mean
			variance += diff * diff
		}

		variance /= float64(len(rows)) // importante: N real de observaciones
		kpis.SavingsVolatility = math.Sqrt(variance)
	}

	return kpis
}

func diffInMonthsSafe(start, end string) int {
	startTime, err1 := time.Parse("2006-01", start)
	endTime, err2 := time.Parse("2006-01", end)

	if err1 != nil || err2 != nil {
		return 0 // fail-safe
	}

	years := endTime.Year() - startTime.Year()
	months := int(endTime.Month()) - int(startTime.Month())

	return years*12 + months + 1 // inclusive
}

/*
Capital Growth vs LY
Capital Growth Rate YTD
Expense Coverage
Projected YE Capital
Projected YE Savings = AvgMonthlySavings * 12 (Semi Posible: impl kpis.ProjectedYearlySavings = kpis.AvgMonthlySavings * 12)
forecast
plan
*/

/*
Algo esta mal o raro en savingstability
Agregar bien los filters para que haga bien todos los calculos
*/
