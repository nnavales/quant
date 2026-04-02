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

export interface TransactionRowDTO {
    id: string;
    date: string;
    description: string | null;
    type: TransactionType;
    frequency: TransactionFrequency | null;

    entry_id: string;
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
}

export type UserConfigUpdate = Partial<UserConfig>;

export interface ConfigStatusResponse {
    status: string;
}
