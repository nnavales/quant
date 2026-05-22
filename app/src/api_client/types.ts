export interface PlanningInput {
    id: string;
    year: number;
    description: string;
    type: "income" | "expense";
    currency: "ARS" | "USD";
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
    created_at: string;
    updated_at: string | null;
}

export interface PlanningInputReq {
    year?: number;
    description?: string;
    type?: "income" | "expense";
    currency?: "ARS" | "USD";
    january?: string;
    february?: string;
    march?: string;
    april?: string;
    may?: string;
    june?: string;
    july?: string;
    august?: string;
    september?: string;
    october?: string;
    november?: string;
    december?: string;
}

export interface PlanningGoal {
    id: string;
    year: number;
    metric: "income" | "expense";
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
    created_at: string;
    updated_at: string | null;
}

export interface PlanningGoalReq {
    year?: number;
    metric?: "income" | "expense";
    january?: string;
    february?: string;
    march?: string;
    april?: string;
    may?: string;
    june?: string;
    july?: string;
    august?: string;
    september?: string;
    october?: string;
    november?: string;
    december?: string;
}

export interface PlanningExchangeRate {
    month: string;
    exchange_rate: number;
    updated_at: string | null;
}

export interface ExchangeRateReq {
    month?: string;
    exchange_rate?: number;
}

export interface PlanningConfig {
    year: number;
    initial_capital: string;
    updated_at: string | null;
}

export interface PlanningConfigReq {
    initial_capital?: string;
}

export interface PlanningMonthData {
    month: number;
    income: string;
    expense: string;
    savings: string;
    capital: string;
}

export interface PlanningTotals {
    income: string;
    expense: string;
    savings: string;
    capital: string;
}

export interface PlanningYear {
    year: number;
    inputs: PlanningInput[];
    months: PlanningMonthData[];
    totals: PlanningTotals;
}

export interface PlanningGoalYear {
     year: number;
     initial_capital: string;
     months: PlanningMonthData[];
     goals: PlanningGoal[];
     totals: PlanningTotals;
 }

export interface GenerateGoalsReq {
    year: number;
    initial_capital: string;
    extra_income: string;
    extra_expense: string;
}

export type TransactionType = "income" | "expense";
export type TransactionFrequency = "fixed" | "variable";
export type Currency = "ARS" | "USD";
export type Instrument = "credit_card" | "debit_card" | "transfer" | "cash" | "crypto";

export interface Channel {
    id: string;
    name: string;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface Account {
    id: string;
    channel_id: string;
    name: string;
    instrument: Instrument;
    last_four: string | null;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface Category {
    id: string;
    name: string;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface Subcategory {
    id: string;
    category_id: string;
    name: string;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface CategoryWithSubcategories {
    category: Category;
    subcategories: Subcategory[];
}

export interface ChannelWithAccounts {
    channel: Channel;
    accounts: Account[] | null;
}

export interface TransactionIDAmount {
    id: string;
    amount: string;
    currency: string;
    exchange_rate: number;
}

export interface TransactionRowDTO {
    id: string;
    date: string;
    description: string | null;
    type: TransactionType;
    frequency: TransactionFrequency | null;

    entry_id: string;
    is_paid: boolean;
    amount: string;
    currency: Currency;
    exchange_rate: number;

    category_id: string | null;
    category_name: string | null;

    subcategory_id: string | null;
    subcategory_name: string | null;

    account_id: string | null;
    account_name: string | null;

    channel_id: string;
    channel_name: string;

    installment_number: number | null;
    total_installments: number | null;
    installment_group_id: string | null;
    installment_start_date: string | null;
    is_canceled: boolean | null;
    original_amount: string | null;
}

export interface ChannelReq {
    id?: string;
    name?: string;
    is_deleted?: boolean;
}

export interface AccountReq {
    id?: string;
    channel_id?: string;
    name?: string;
    instrument?: Instrument;
    last_four?: string;
    is_deleted?: boolean;
}

export interface CategoryReq {
    id?: string;
    name?: string;
    is_deleted?: boolean;
}

export interface SubcategoryReq {
    id?: string;
    category_id?: string;
    name?: string;
    is_deleted?: boolean;
}

export interface TransactionAggregateReq {
    description: string;
    date: string;
    type: TransactionType;
    frequency: TransactionFrequency;
    installment_number?: number;
    amount: string;
    currency: Currency;
    exchange_rate: number;
    category_id: string;
    subcategory_id: string;
    channel_id: string;
    account_id: string;
    is_paid?: boolean;
}

export interface CancelInstallmentsReq {
    installment_group_id: string;
    from_installment: number;
}

export interface ApiError {
    error: string;
}

// ============================================
// Economic / Macro Economic Types
// ============================================

export interface TimeSeriesPoint {
    date: string;
    value: number;
}

export interface TimeSeries {
    name: string;
    unit: string;
    points: TimeSeriesPoint[];
}

export interface TimeSeriesDelta {
    diff: number;
    pct: number;
}

export interface EconomicSeriesResponse {
    series: TimeSeries;
    last?: TimeSeriesPoint;
    delta?: TimeSeriesDelta;
}

export interface DollarValue {
    entity: string;
    slug?: string;
    logo_url: string;
    buy: number;
    sell: number;
    pct_variation: number;
    updated_at: string;
}

export type DollarMap = Record<string, DollarValue>;

export interface LoanValue {
    entity: string;
    name: string;
    slug?: string;
    tna: number;
    updated_at: string;
}

export type LoanMap = Record<string, LoanValue>;

export interface YieldValue {
    entity: string;
    logo_url: string;
    slug?: string;
    conditions: string;
    tem: number;
    tea: number;
    tna: number;
    daily_rate: number;
    limit: number;
    updated_at: string;
}

export type YieldMap = Record<string, YieldValue>;

export interface FixedDepositValue {
    entity: string;
    logo_url: string;
    slug?: string;
    tem: number;
    tea: number;
    tna: number;
    min_term: number;
    max_term: number;
    updated_at: string;
}

export type FixedDepositsMap = Record<string, FixedDepositValue>;

export interface CountryRiskValue {
    date: string;
    value: number;
    variation: number;
}

// ============================================
// User Config Types
// ============================================

export interface UserConfig {
    dollar_source?: string;
    currency?: string;
    username?: string;
    timezone?: string;
    date_format?: string;
    default_rate?: string;
    theme?: string;
}

export type UserConfigUpdate = Partial<UserConfig>;

export interface ConfigStatusResponse {
    status: string;
}

// ============================================
// Historical Types
// ============================================

export interface HistoricalEntry {
    month: string;
    income: string;
    income_fixed: string;
    income_variable: string;
    expense: string;
    expense_fixed: string;
    expense_variable: string;
    exchange_rate: number;
    savings: string;
    source: string;
}

export interface HistoricalEntryResponse {
    data: HistoricalEntry[];
    total_count: number;
}

export type HistoricalEntryCreate = Partial<Omit<HistoricalEntry, "source">>;

export interface BulkCreateHistoricalReq {
    data: HistoricalFinanceReq[];
}

export interface HistoricalFinanceReq {
    date?: string;
    exchange_rate?: number;
    income_usd?: string;
    income_fixed_usd?: string;
    income_variable_usd?: string;
    expense_usd?: string;
    expense_fixed_usd?: string;
    expense_variable_usd?: string;
    savings_usd?: string;
}

export type KPI =
    | "income_ytd"
    | "expenses_ytd"
    | "net_savings_ytd"
    | "savings_margin"
    | "avg_monthly_savings"
    | "fixed_cost_ratio"
    | "fixed_expense_mix"
    | "fixed_income_mix"
    | "stable_income_coverage"
    | "financial_flexibility"
    | "core_burn_rate"
    | "savings_volatility"
    | "savings_volatility_ratio"
    | "projected_yearly_savings"
    | "projected_yearly_capital"
    | "capital_growth_rate_ytd"
    | "capital_total"
    | "total_capital"
    | "expense_coverage_months";

export type Dimension = "category" | "subcategory" | "account" | "channel";

export interface KPIDataPoint {
    year: number;
    value: number;
}

export interface KPIEvolutionResponse {
    kpi: KPI;
    data: KPIDataPoint[];
}

export interface MonthlyData {
    month: string;
    income: number;
    expense: number;
    savings: number;
    capital: number;
    incomeFixed: number;
    incomeVariable: number;
    expenseFixed: number;
    expenseVariable: number;
    exchangeRate: number;
}

export interface KPIResponse {
    IncomeYTD: number;
    ExpensesYTD: number;
    NetSavingsYTD: number;
    SavingsMargin: number;
    AvgMonthlySavings: number;
    FixedCostRatio: number;
    FixedExpenseMix: number;
    FixedIncomeMix: number;
    StableIncomeCoverage: number;
    FinancialFlexibility: number;
    CoreBurnRate: number;
    SavingsVolatility: number;
    SavingsVolatilityRatio: number;
    ProjectedYearlySavings: number;
    ProjectedYearlyCapital: number;
    CapitalGrowthRateYTD: number;
    CapitalTotal: number;
    ExpenseCoverageMonths: number;
}

export interface DashboardResponse {
    currentYtd: KPIResponse;
    previousYtd: KPIResponse;
    monthlySeries: MonthlyData[];
}

export interface TimeSeriesPoint {
    month: string;
    value: number;
    composition?: Array<{ key: string; value: number }>;
}

export interface DimensionSeries {
    key: string;
    data: TimeSeriesPoint[];
}

export interface DimensionSeriesResponse {
     dimension: Dimension;
     type: "income" | "expense";
     data: DimensionSeries[];
 }

 // ============================================
 // Dashboard Metrics Comparison Types
 // ============================================

 export interface MetricCell {
     real?: number;
     fcst?: number;
     plan?: number;
     ly?: number;
     lm?: number;
     vs_fcst?: number;
     vs_fcst_pct?: number;
     vs_plan?: number;
     vs_plan_pct?: number;
     vs_ly?: number;
     vs_ly_pct?: number;
     vs_lm?: number;
     vs_lm_pct?: number;
 }

 export interface MetricSeries {
     months: MetricCell[];
     mtd: MetricCell;
     ytd: MetricCell;
     fy: MetricCell;
 }

export interface MetricComparisonDashboard {
     year: number;
     income: MetricSeries;
     expense: MetricSeries;
     savings: MetricSeries;
     capital: MetricSeries;
     income_fixed: MetricSeries;
     expense_fixed: MetricSeries;
     income_variable: MetricSeries;
     expense_variable: MetricSeries;
 }

// ============================================
// Networth Types
// ============================================

export type AssetType = "liquid" | "physical";

export interface Asset {
    id: string;
    name: string;
    amount: string;
    currency: Currency;
    type: AssetType;
    created_at: string;
    updated_at: string | null;
}

export interface NetWorth {
    total_usd: string;
    liquid_usd: string;
    physical_usd: string;
    assets: Asset[];
    updated_at: string;
}

export interface AssetReq {
    name: string;
    amount: string;
    currency: Currency;
    type: AssetType;
}

// ============================================
// Preset Types
// ============================================

export interface Preset {
    id: string;
    name: string;
    description: string | null;
    type: TransactionType;
    frequency: TransactionFrequency | null;
    category_id: string | null;
    subcategory_id: string | null;
    channel_id: string | null;
    account_id: string | null;
    is_paid: boolean | null;
    currency: Currency | null;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface PresetReq {
    id?: string;
    name?: string;
    description?: string;
    type?: TransactionType;
    frequency?: TransactionFrequency;
    category_id?: string;
    subcategory_id?: string;
    channel_id?: string;
    account_id?: string;
    is_paid?: boolean;
    currency?: Currency;
    is_deleted?: boolean;
}
