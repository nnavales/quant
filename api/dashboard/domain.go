package dashboard

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/timeutils"
)

// --- KPI constants ---

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
	KPITotalCapital           = "total_capital"
)

// --- Dimension constants ---

const (
	DimensionCategory    = "category"
	DimensionSubcategory = "subcategory"
	DimensionAccount     = "account"
	DimensionChannel     = "channel"
)

// --- validation ---

var validKPIs = map[string]bool{
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
	KPITotalCapital:           true,
	KPIExpenseCoverageMonths:  true,
}

var validDimensions = map[string]bool{
	DimensionCategory:    true,
	DimensionSubcategory: true,
	DimensionAccount:     true,
	DimensionChannel:     true,
}

func IsValidKPI(kpi string) bool {
	return validKPIs[kpi]
}

func IsValidDimension(dim string) bool {
	return validDimensions[dim]
}

// --- Errors ---

var (
	ErrInvalidKPI       = errors.New("invalid kpi")
	ErrInvalidDimension = errors.New("invalid dimension")
	ErrInvalidMetric    = errors.New("invalid metric")
)

// --- Data types ---

type MonthlyData struct {
	Month           string  `json:"month"`
	Income          float64 `json:"income"`
	Expense         float64 `json:"expense"`
	Savings         float64 `json:"savings"`
	Capital         float64 `json:"capital"`
	IncomeFixed     float64 `json:"incomeFixed"`
	IncomeVariable  float64 `json:"incomeVariable"`
	ExpenseFixed    float64 `json:"expenseFixed"`
	ExpenseVariable float64 `json:"expenseVariable"`
	ExchangeRate    float64 `json:"exchangeRate"`
	HasIncome       bool    `json:"-"`
	HasExpense      bool    `json:"-"`
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

type Filter struct{}

type DimensionFilter struct {
	Type          string
	CategoryID    *string
	SubcategoryID *string
	AccountID     *string
	ChannelID     *string
	DateFrom      *timeutils.Date
	DateTo        *timeutils.Date
}

// --- Response types ---

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

type DashboardResponse struct {
	CurrentYTD    KPIResponse   `json:"currentYtd"`
	PreviousYTD   KPIResponse   `json:"previousYtd"`
	MonthlySeries []MonthlyData `json:"monthlySeries"`
}

type KPIEvolutionResponse struct {
	KPI  string         `json:"kpi"`
	Data []KPIDataPoint `json:"data"`
}

type KPIDataPoint struct {
	Year  int     `json:"year"`
	Value float64 `json:"value"`
}

type DimensionSeriesResponse struct {
	Dimension string            `json:"dimension"`
	Type      string            `json:"type"`
	Data      []DimensionSeries `json:"data"`
}

type DimensionSeries struct {
	Key  string            `json:"key"`
	Data []TimeSeriesPoint `json:"data"`
}

type Composition struct {
	Key   string  `json:"key"`
	Value float64 `json:"value"`
}

type TimeSeriesPoint struct {
	Month       string        `json:"month"`
	Value       float64       `json:"value"`
	Composition []Composition `json:"composition"`
}

// --- Repository interface ---

type Repository interface {
	GetFinanceSummary(ctx context.Context, filter *Filter) ([]FinanceSummaryRow, error)
	GetDimensionSeries(ctx context.Context, filter DimensionFilter) ([]DimensionRow, error)
}

// --- Helpers ---

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
		HasIncome:       r.Income != 0,
		HasExpense:      r.Expense != 0,
	}
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

// --- BuildKPIs ---

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
			latestRow = r
		}
	}

	months := float64(diffInMonthsSafe(minMonth, maxMonth))
	observations := float64(len(rows))

	currentCapital := latestRow.Capital

	kpis := KPIResponse{
		IncomeYTD:     totalIncome,
		ExpensesYTD:   totalExpense,
		NetSavingsYTD: totalSavings,
		CapitalTotal:  currentCapital,
	}

	if totalIncome > 0 {
		kpis.SavingsMargin = totalSavings / totalIncome
	}

	if months > 0 {
		kpis.AvgMonthlySavings = totalSavings / months
	}

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
		kpis.ProjectedYearlyCapital = currentCapital + (kpis.AvgMonthlySavings * float64(remainingMonths))
	}

	if currentCapital > 0 {
		kpis.CapitalGrowthRateYTD = totalSavings / currentCapital
	}

	if kpis.CoreBurnRate > 0 {
		kpis.ExpenseCoverageMonths = currentCapital / kpis.CoreBurnRate
	}

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

// --- extractKPI ---

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
	case KPITotalCapital:
		return k.CapitalTotal
	case KPIExpenseCoverageMonths:
		return k.ExpenseCoverageMonths
	default:
		return 0
	}
}

type MonthlyForecastData struct {
	Month           int     `json:"month"`
	IncomeForecast  float64 `json:"income_fcst"`
	ExpenseForecast float64 `json:"expense_fcst"`
	SavingsForecast float64 `json:"savings_fcst"`
	CapitalForecast float64 `json:"capital_fcst"`
}

type MonthlyPlanData struct {
	Month       int     `json:"month"`
	IncomePlan  float64 `json:"income_plan"`
	ExpensePlan float64 `json:"expense_plan"`
	SavingsPlan float64 `json:"savings_plan"`
	CapitalPlan float64 `json:"capital_plan"`
}

// --- Output types ---

type MetricCell struct {
	Real      float64 `json:"real,omitempty"`
	FCST      float64 `json:"fcst,omitempty"`
	Plan      float64 `json:"plan,omitempty"`
	LY        float64 `json:"ly,omitempty"`
	VsFCST    float64 `json:"vs_fcst,omitempty"`
	VsFCSTPct float64 `json:"vs_fcst_pct,omitempty"`
	VsPlan    float64 `json:"vs_plan,omitempty"`
	VsPlanPct float64 `json:"vs_plan_pct,omitempty"`
	VsLY      float64 `json:"vs_ly,omitempty"`
	VsLYPct   float64 `json:"vs_ly_pct,omitempty"`
	LM        float64 `json:"lm,omitempty"`
	VsLM      float64 `json:"vs_lm,omitempty"`
	VsLMPct   float64 `json:"vs_lm_pct,omitempty"`
}

type MetricSeries struct {
	Months []MetricCell `json:"months,omitempty"`
	MTD    MetricCell   `json:"mtd"`
	YTD    MetricCell   `json:"ytd"`
	FY     MetricCell   `json:"fy"`
}

type MetricComparisonDashboard struct {
	Year            int          `json:"year"`
	Income          MetricSeries `json:"income"`
	Expense         MetricSeries `json:"expense"`
	Savings         MetricSeries `json:"savings"`
	Capital         MetricSeries `json:"capital"`
	IncomeFixed     MetricSeries `json:"income_fixed"`
	ExpenseFixed    MetricSeries `json:"expense_fixed"`
	IncomeVariable  MetricSeries `json:"income_variable"`
	ExpenseVariable MetricSeries `json:"expense_variable"`
}

// --- Main entry point ---

func BuildMetricsDashboard(actual []MonthlyData, fcst []MonthlyForecastData, plan []MonthlyPlanData) MetricComparisonDashboard {
	if len(actual) == 0 {
		return MetricComparisonDashboard{}
	}

	currentYear := time.Now().Year()

	var currentRows, prevRows []MonthlyData
	for _, r := range actual {
		year, _, _ := timeutils.ParseYearAndMonth(r.Month)
		if year == currentYear {
			currentRows = append(currentRows, r)
		} else if year == currentYear-1 {
			prevRows = append(prevRows, r)
		}
	}

	realMap := mapByMonth(currentRows)
	lyMap := mapByMonth(prevRows)

	income := buildSeries(realMap, lyMap, fcst, plan, extractIncome, extractForecastIncome, extractPlanIncome, true)
	expense := buildSeries(realMap, lyMap, fcst, plan, extractExpenses, extractForecastExpenses, extractPlanExpenses, true)
	savings := buildSeries(realMap, lyMap, fcst, plan, extractSavings, extractForecastSavings, extractPlanSavings, true)
	capital := buildSeries(realMap, lyMap, fcst, plan, extractCapital, extractForecastCapital, extractPlanCapital, false)

	incomeFixed := buildSimpleSeries(realMap, lyMap, extractIncomeFixed)
	expenseFixed := buildSimpleSeries(realMap, lyMap, extractExpenseFixed)
	incomeVariable := buildSimpleSeries(realMap, lyMap, extractIncomeVariable)
	expenseVariable := buildSimpleSeries(realMap, lyMap, extractExpenseVariable)

	return MetricComparisonDashboard{
		Year:            currentYear,
		Income:          income,
		Expense:         expense,
		Savings:         savings,
		Capital:         capital,
		IncomeFixed:     incomeFixed,
		ExpenseFixed:    expenseFixed,
		IncomeVariable:  incomeVariable,
		ExpenseVariable: expenseVariable,
	}
}

// --- Build one dollar MetricSeries from 4 sources ---

func buildSeries(
	realMap, lyMap map[int]MonthlyData,
	fcstMonths []MonthlyForecastData,
	planMonths []MonthlyPlanData,
	extractReal func(MonthlyData) float64,
	extractFcst func(MonthlyForecastData) float64,
	extractPlan func(MonthlyPlanData) float64,
	accumulate bool,
) MetricSeries {

	var months []MetricCell

	// Mes del sistema: el mes actual siempre se calcula aunque Real=0
	currentMonth := int(time.Now().Month())

	var ytdReal, ytdFcst, ytdPlan, ytdLY float64
	var totalFcst, totalPlan, totalLY float64
	realMonths := 0
	lyMonths := 0

	for m := 1; m <= 12; m++ {
		realVal := extractReal(realMap[m])
		var fcstVal float64
		if m-1 < len(fcstMonths) {
			fcstVal = extractFcst(fcstMonths[m-1])
		}
		var planVal float64
		if m-1 < len(planMonths) {
			planVal = extractPlan(planMonths[m-1])
		}
		lyVal := extractReal(lyMap[m])

		// Contar meses con datos reales usando el flag HasIncome
		realMonthData, hasReal := realMap[m]
		lyMonthData, hasLY := lyMap[m]
		if hasReal && realMonthData.HasIncome {
			realMonths++
		}
		if hasLY && lyMonthData.HasIncome {
			lyMonths++
		}

		// YTD: acumular hasta currentMonth (solo si accumulate=true)
		if m <= currentMonth && accumulate {
			ytdReal += realVal
			ytdFcst += fcstVal
			ytdPlan += planVal
			ytdLY += lyVal
		}

		// Total de todos los 12 meses
		totalFcst += fcstVal
		totalPlan += planVal
		totalLY += lyVal

		// Vs* solo se calculan para meses pasados y el mes actual
		// Meses futuros quedan en 0 (omitempty los oculta en JSON)
		cell := MetricCell{
			Real: realVal,
			FCST: fcstVal,
			Plan: planVal,
			LY:   lyVal,
		}
		if m <= currentMonth {
			cell.VsFCST = realVal - fcstVal
			cell.VsFCSTPct = safeDiv(realVal-fcstVal, fcstVal)
			cell.VsPlan = realVal - planVal
			cell.VsPlanPct = safeDiv(realVal-planVal, planVal)
			cell.VsLY = realVal - lyVal
			cell.VsLYPct = safeDiv(realVal-lyVal, lyVal)
		}
		months = append(months, cell)
	}

	// MTD = valor del currentMonth (un solo mes)
	lastMonth := months[currentMonth-1]
	mtdCell := MetricCell{
		Real:      lastMonth.Real,
		FCST:      lastMonth.FCST,
		Plan:      lastMonth.Plan,
		LY:        lastMonth.LY,
		VsFCST:    lastMonth.VsFCST,
		VsFCSTPct: lastMonth.VsFCSTPct,
		VsPlan:    lastMonth.VsPlan,
		VsPlanPct: lastMonth.VsPlanPct,
		VsLY:      lastMonth.VsLY,
		VsLYPct:   lastMonth.VsLYPct,
	}

	// YTD
	var ytdCell MetricCell
	if accumulate {
		ytdCell = MetricCell{
			Real: ytdReal,
			FCST: ytdFcst,
			Plan: ytdPlan,
			LY:   ytdLY,
		}
		if ytdReal != 0 {
			ytdCell.VsFCST = ytdReal - ytdFcst
			ytdCell.VsFCSTPct = safeDiv(ytdReal-ytdFcst, ytdFcst)
			ytdCell.VsPlan = ytdReal - ytdPlan
			ytdCell.VsPlanPct = safeDiv(ytdReal-ytdPlan, ytdPlan)
			ytdCell.VsLY = ytdReal - ytdLY
			ytdCell.VsLYPct = safeDiv(ytdReal-ytdLY, ytdLY)
		}
	} else {
		ytdCell = MetricCell{
			Real:      lastMonth.Real,
			FCST:      lastMonth.FCST,
			Plan:      lastMonth.Plan,
			LY:        lastMonth.LY,
			VsFCST:    lastMonth.VsFCST,
			VsFCSTPct: lastMonth.VsFCSTPct,
			VsPlan:    lastMonth.VsPlan,
			VsPlanPct: lastMonth.VsPlanPct,
			VsLY:      lastMonth.VsLY,
			VsLYPct:   lastMonth.VsLYPct,
		}
	}

	// FY
	var fyCell MetricCell
	if accumulate {
		var fyReal, fyFcst, fyPlan, fyLY float64

		if realMonths == 12 {
			fyReal = ytdReal
		}
		fyFcst = totalFcst
		fyPlan = totalPlan

		if lyMonths == 12 {
			fyLY = totalLY
		}

		fyCell = MetricCell{
			Real: fyReal,
			FCST: fyFcst,
			Plan: fyPlan,
			LY:   fyLY,
		}
		if fyReal != 0 {
			fyCell.VsFCST = fyReal - fyFcst
			fyCell.VsFCSTPct = safeDiv(fyReal-fyFcst, fyFcst)
			fyCell.VsPlan = fyReal - fyPlan
			fyCell.VsPlanPct = safeDiv(fyReal-fyPlan, fyPlan)
			if fyLY != 0 {
				fyCell.VsLY = fyReal - fyLY
				fyCell.VsLYPct = safeDiv(fyReal-fyLY, fyLY)
			}
		}
	} else {
		december := months[11]
		fyCell = MetricCell{
			Real:      december.Real,
			FCST:      december.FCST,
			Plan:      december.Plan,
			LY:        december.LY,
			VsFCST:    december.VsFCST,
			VsFCSTPct: december.VsFCSTPct,
			VsPlan:    december.VsPlan,
			VsPlanPct: december.VsPlanPct,
			VsLY:      december.VsLY,
			VsLYPct:   december.VsLYPct,
		}
	}

	return MetricSeries{
		Months: months,
		MTD:    mtdCell,
		YTD:    ytdCell,
		FY:     fyCell,
	}
}

// --- Helpers ---

func safeDiv(a, b float64) float64 {
	if b == 0 {
		return 0
	}
	return a / b
}

func mapByMonth(rows []MonthlyData) map[int]MonthlyData {
	m := make(map[int]MonthlyData)
	for _, r := range rows {
		_, month, _ := timeutils.ParseYearAndMonth(r.Month)
		m[month] = r
	}
	return m
}

func buildSimpleSeries(
	realMap, lyMap map[int]MonthlyData,
	extractReal func(MonthlyData) float64,
) MetricSeries {

	var months []MetricCell
	currentMonth := int(time.Now().Month())

	var ytdReal, ytdLY float64

	for m := 1; m <= 12; m++ {
		realVal := extractReal(realMap[m])
		lyVal := extractReal(lyMap[m])

		if m <= currentMonth {
			ytdReal += realVal
			ytdLY += lyVal
		}

		cell := MetricCell{
			Real: realVal,
			LY:   lyVal,
		}
		if m <= currentMonth {
			cell.VsLY = realVal - lyVal
			cell.VsLYPct = safeDiv(realVal-lyVal, lyVal)
		}

		if m > 1 {
			lmVal := extractReal(realMap[m-1])
			cell.LM = lmVal
			cell.VsLM = realVal - lmVal
			cell.VsLMPct = safeDiv(realVal-lmVal, lmVal)
		} else {
			lmVal := extractReal(lyMap[12])
			cell.LM = lmVal
			cell.VsLM = realVal - lmVal
			cell.VsLMPct = safeDiv(realVal-lmVal, lmVal)
		}

		months = append(months, cell)
	}

	lastMonth := months[currentMonth-1]
	mtdCell := MetricCell{
		Real:    lastMonth.Real,
		LY:      lastMonth.LY,
		VsLY:    lastMonth.VsLY,
		VsLYPct: lastMonth.VsLYPct,
		VsLM:    lastMonth.VsLM,
		VsLMPct: lastMonth.VsLMPct,
	}

	ytdCell := MetricCell{
		Real: ytdReal,
		LY:   ytdLY,
	}
	if ytdReal != 0 {
		ytdCell.VsLY = ytdReal - ytdLY
		ytdCell.VsLYPct = safeDiv(ytdReal-ytdLY, ytdLY)
	}

	fyCell := MetricCell{
		Real: ytdReal,
		LY:   ytdLY,
	}
	if fyReal := ytdReal; fyReal != 0 {
		fyCell.VsLY = fyReal - ytdLY
		fyCell.VsLYPct = safeDiv(fyReal-ytdLY, ytdLY)
	}

	return MetricSeries{
		Months: months,
		MTD:    mtdCell,
		YTD:    ytdCell,
		FY:     fyCell,
	}
}

// --- Extractors: Real (MonthlyData) ---

func extractIncome(r MonthlyData) float64          { return r.Income }
func extractExpenses(r MonthlyData) float64        { return r.Expense }
func extractSavings(r MonthlyData) float64         { return r.Savings }
func extractCapital(r MonthlyData) float64         { return r.Capital }
func extractIncomeFixed(r MonthlyData) float64     { return r.IncomeFixed }
func extractExpenseFixed(r MonthlyData) float64    { return r.ExpenseFixed }
func extractIncomeVariable(r MonthlyData) float64  { return r.IncomeVariable }
func extractExpenseVariable(r MonthlyData) float64 { return r.ExpenseVariable }

// --- Extractors: Forecast (MonthlyForecastData) ---

func extractForecastIncome(r MonthlyForecastData) float64   { return r.IncomeForecast }
func extractForecastExpenses(r MonthlyForecastData) float64 { return r.ExpenseForecast }
func extractForecastSavings(r MonthlyForecastData) float64  { return r.SavingsForecast }
func extractForecastCapital(r MonthlyForecastData) float64  { return r.CapitalForecast }

// --- Extractors: Plan (MonthlyPlanData) ---

func extractPlanIncome(r MonthlyPlanData) float64   { return r.IncomePlan }
func extractPlanExpenses(r MonthlyPlanData) float64 { return r.ExpensePlan }
func extractPlanSavings(r MonthlyPlanData) float64  { return r.SavingsPlan }
func extractPlanCapital(r MonthlyPlanData) float64  { return r.CapitalPlan }
