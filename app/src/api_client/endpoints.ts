import { api } from "./client";

function buildQuery(obj: Record<string, string | number | boolean | undefined | null>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    }
    const q = p.toString();
    return q ? `?${q}` : "";
}

import type {
     NetWorth,
     Asset,
     AssetReq,
     Channel,
     ChannelReq,
     Account,
     AccountReq,
     Category,
     CategoryReq,
     Subcategory,
     SubcategoryReq,
     CategoryWithSubcategories,
     ChannelWithAccounts,
      TransactionRowDTO,
      TransactionIDAmount,
      TransactionAggregateReq,
     CancelInstallmentsReq,
     EconomicSeriesResponse,
     DollarMap,
     LoanMap,
     YieldMap,
     FixedDepositsMap,
     CountryRiskValue,
     UserConfig,
     UserConfigUpdate,
     ConfigStatusResponse,
     HistoricalEntry,
     HistoricalEntryResponse,
     HistoricalEntryCreate,
     HistoricalFinanceReq,
     BulkCreateHistoricalReq,
     DashboardResponse,
     KPIEvolutionResponse,
     KPI,
     Dimension,
     DimensionSeriesResponse,
     Preset,
     PresetReq,
     PlanningInput,
     PlanningInputReq,
     PlanningGoal,
     PlanningGoalReq,
     PlanningExchangeRate,
     ExchangeRateReq,
     PlanningConfig,
     PlanningConfigReq,
     PlanningYear,
     PlanningGoalYear,
     GenerateGoalsReq,
     MetricComparisonDashboard,
 } from "./types";

export const channels = {
    list: () => api.get<Channel[]>("/channels"),
    listWithAccounts: () => api.get<ChannelWithAccounts[]>("/channels?include=accounts"),
    get: (id: string) => api.get<Channel>(`/channels/${id}`),
    create: (data: ChannelReq) => api.post<Channel>("/channels", data),
    update: (id: string, data: Partial<ChannelReq>) => api.patch<Channel>(`/channels/${id}`, data),
    delete: (id: string) => api.delete<void>(`/channels/${id}`),
    restore: (id: string) => api.post<void>(`/channels/${id}/restore`),
    hardDelete: (id: string) => api.delete<void>(`/channels/${id}/hard`),
};

export const accounts = {
    list: () => api.get<Account[]>("/accounts"),
    get: (id: string) => api.get<Account>(`/accounts/${id}`),
    create: (data: AccountReq) => api.post<Account>("/accounts", data),
    update: (id: string, data: Partial<AccountReq>) => api.patch<Account>(`/accounts/${id}`, data),
    delete: (id: string) => api.delete<void>(`/accounts/${id}`),
    restore: (id: string) => api.post<void>(`/accounts/${id}/restore`),
    hardDelete: (id: string) => api.delete<void>(`/accounts/${id}/hard`),
};

export const categories = {
    list: () => api.get<Category[]>("/categories"),
    listWithSubcategories: () => api.get<CategoryWithSubcategories[]>("/categories?include=subcategories"),
    get: (id: string) => api.get<Category>(`/categories/${id}`),
    create: (data: CategoryReq) => api.post<Category>("/categories", data),
    update: (id: string, data: Partial<CategoryReq>) =>
        api.patch<Category>(`/categories/${id}`, data),
    delete: (id: string) => api.delete<void>(`/categories/${id}`),
    restore: (id: string) => api.post<void>(`/categories/${id}/restore`),
    hardDelete: (id: string) => api.delete<void>(`/categories/${id}/hard`),
};

export const subcategories = {
    list: () => api.get<Subcategory[]>("/subcategories"),
    get: (id: string) => api.get<Subcategory>(`/subcategories/${id}`),
    create: (data: SubcategoryReq) => api.post<Subcategory>("/subcategories", data),
    update: (id: string, data: Partial<SubcategoryReq>) =>
        api.patch<Subcategory>(`/subcategories/${id}`, data),
    delete: (id: string) => api.delete<void>(`/subcategories/${id}`),
    restore: (id: string) => api.post<void>(`/subcategories/${id}/restore`),
    hardDelete: (id: string) => api.delete<void>(`/subcategories/${id}/hard`),
};

export interface TransactionFilters {
    page?: number;
    limit?: number;
    sort?: "date" | "amount" | "created_at";
    order?: "asc" | "desc";
    search?: string;
    type?: "income" | "expense";
    currency?: "ARS" | "USD";
    frequency?: "fixed" | "variable";
    installments?: boolean;
    category?: string;
    subcategory?: string;
    channel?: string;
    account?: string;
    date_from?: string;
    date_to?: string;
    is_paid?: boolean;
}

interface TransactionListResponse {
    data: TransactionRowDTO[];
    total_count: number;
}

export const transactionAggregates = {
    list: (filters?: TransactionFilters) => {
        const qs = filters ? buildQuery({
            page: filters.page,
            limit: filters.limit,
            sort: filters.sort,
            order: filters.order,
            search: filters.search,
            type: filters.type,
            currency: filters.currency,
            frequency: filters.frequency,
            installment: filters.installments,
            category: filters.category,
            subcategory: filters.subcategory,
            channel: filters.channel,
            account: filters.account,
            date_from: filters.date_from,
            date_to: filters.date_to,
            is_paid: filters.is_paid,
        }) : "";
        return api.get<TransactionListResponse>(`/transaction-aggregates${qs}`).then((response) => ({
            data: response.data || [],
            total: response.total_count || 0,
            page: filters?.page || 1,
            limit: filters?.limit || 20,
        }));
    },
    get: (id: string) => api.get<TransactionRowDTO>(`/transaction-aggregates/${id}`),
    create: (data: TransactionAggregateReq) =>
        api.post<TransactionRowDTO>("/transaction-aggregates", data),
    update: (id: string, data: Partial<TransactionAggregateReq>) =>
        api.patch<TransactionRowDTO>(`/transaction-aggregates/${id}`, data),
    delete: (id: string) => api.delete<void>(`/transaction-aggregates/${id}`),
    bulkDelete: (ids: string[]) => api.delete<void>("/transaction-aggregates/bulk", { ids }),
    cancelInstallments: (data: CancelInstallmentsReq) =>
        api.post<void>("/transaction-aggregates/cancel-installments", data),
    listIds: (filters?: TransactionFilters) => {
        const qs = filters ? buildQuery({
            search: filters.search,
            type: filters.type,
            currency: filters.currency,
            frequency: filters.frequency,
            installment: filters.installments,
            category: filters.category,
            subcategory: filters.subcategory,
            channel: filters.channel,
            account: filters.account,
            date_from: filters.date_from,
            date_to: filters.date_to,
            is_paid: filters.is_paid,
        }) : "";
        return api.get<TransactionIDAmount[]>(`/transaction-aggregates/ids${qs}`);
    },
};

// ============================================
// Economic / Macro Economic Endpoints
// ============================================

export const economic = {
    getIPC: () => api.get<EconomicSeriesResponse>("/economic/ipc"),
    getInflation: (refresh?: boolean) =>
        api.get<EconomicSeriesResponse>(`/economic/inflation${buildQuery({ refresh: refresh || undefined })}`),
    getDollarHistoric: (quotation?: string, refresh?: boolean) =>
        api.get<EconomicSeriesResponse>(`/economic/dollar${buildQuery({ quotation, refresh: refresh || undefined })}`),
    getDollarBanks: (quotation?: string, refresh?: boolean) =>
        api.get<DollarMap>(`/economic/dollar/banks${buildQuery({ quotation, refresh: refresh || undefined })}`),
    getCrypto: (symbol?: string, refresh?: boolean) =>
        api.get<EconomicSeriesResponse>(`/economic/crypto${buildQuery({ symbol, refresh: refresh || undefined })}`),
    getCountryRisk: (refresh?: boolean) =>
        api.get<CountryRiskValue>(`/economic/country-risk${buildQuery({ refresh: refresh || undefined })}`),
    getFixedDeposits: (refresh?: boolean) =>
        api.get<FixedDepositsMap>(`/economic/fixed-deposits${buildQuery({ refresh: refresh || undefined })}`),
    getYieldAccounts: (refresh?: boolean) =>
        api.get<YieldMap>(`/economic/yield-accounts${buildQuery({ refresh: refresh || undefined })}`),
    getLoans: (refresh?: boolean) =>
        api.get<LoanMap>(`/economic/loans${buildQuery({ refresh: refresh || undefined })}`),
};

// ============================================
// User Config Endpoints
// ============================================

export const config = {
    get: () => api.get<UserConfig>("/users/config"),
    getByKey: (key: string) => api.get<unknown>(`/users/config/${key}`),
    update: (data: UserConfigUpdate) => api.patch<ConfigStatusResponse>("/users/config", data),
};

export const transactions = {
    updatePaid: (id: string, isPaid: boolean) =>
        api.patch(`/transaction/${id}/paid`, { is_paid: isPaid }),
};

export const dashboard = {
     getKPIs: () => api.get<DashboardResponse>("/dashboard"),
     getKPIEvolution: (kpi: KPI) => api.get<KPIEvolutionResponse>(`/dashboard/kpi/${kpi}/evolution`),
     getDimensionSeries: (dimension: Dimension, params?: Record<string, string>) => {
         const searchParams = new URLSearchParams(params);
         const query = searchParams.toString();
         return api.get<DimensionSeriesResponse>(
             `/dashboard/dimension/${dimension}${query ? `?${query}` : ""}`
         );
     },
     getMetrics: (year: number) => api.get<MetricComparisonDashboard>(`/dashboard/metrics?year=${year}`),
 };

// ============================================
// Historical Endpoints
// ============================================

export interface HistoricalFilters {
    page?: number;
    limit?: number;
    sort?: "month" | "income" | "expense" | "savings";
    order?: "asc" | "desc";
    date_from?: string;
    date_to?: string;
    source?: "historical" | "transactions";
}

function normalizeMonth(month: string): string {
    // Backend expects YYYY-MM-DD but list returns YYYY-MM
    if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`;
    return month;
}

export const historical = {
    list: (filters?: HistoricalFilters) => {
        const qs = filters ? buildQuery({
            page: filters.page,
            limit: filters.limit,
            sort: filters.sort,
            order: filters.order,
            date_from: filters.date_from,
            date_to: filters.date_to,
            source: filters.source,
        }) : "";
        return api.get<HistoricalEntryResponse>(`/historical-entries${qs}`).then((response) => ({
            data: response.data || [],
            total: response.total_count || 0,
            page: filters?.page || 1,
            limit: filters?.limit || 20,
        }));
    },
    get: (month: string) => api.get<HistoricalEntry>(`/historical/${normalizeMonth(month)}`),
    create: (data: HistoricalEntryCreate) => api.post<HistoricalEntry>("/historical", data),
    update: (month: string, data: Partial<HistoricalFinanceReq>) =>
        api.patch<HistoricalEntry>(`/historical/${normalizeMonth(month)}`, data),
    delete: (month: string) => api.delete<void>(`/historical/${normalizeMonth(month)}`),
    bulkCreate: (data: HistoricalFinanceReq[]) =>
        api.post<void>("/historical/bulk", { data } as BulkCreateHistoricalReq),
};

// ============================================
// Networth Endpoints
// ============================================

export const networth = {
    get: () => api.get<NetWorth>("/networth"),
};

export const assets = {
    list: () => api.get<Asset[]>("/assets"),
    get: (id: string) => api.get<Asset>(`/assets/${id}`),
    create: (data: AssetReq) => api.post<Asset>("/assets", data),
    update: (id: string, data: Partial<AssetReq>) => api.patch<Asset>(`/assets/${id}`, data),
    delete: (id: string) => api.delete<void>(`/assets/${id}`),
};

// ============================================
// Presets Endpoints
// ============================================

export const presets = {
    list: () => api.get<Preset[]>("/presets"),
    get: (id: string) => api.get<Preset>(`/presets/${id}`),
    create: (data: PresetReq) => api.post<Preset>("/presets", data),
    update: (id: string, data: Partial<PresetReq>) => api.patch<Preset>(`/presets/${id}`, data),
    delete: (id: string) => api.delete<void>(`/presets/${id}`),
    restore: (id: string) => api.post<void>(`/presets/${id}/restore`),
};

export const planning = {
    inputs: {
        list: (year: string) => api.get<PlanningInput[]>(`/planning/inputs?year=${year}`),
        get: (id: string) => api.get<PlanningInput>(`/planning/inputs/${id}`),
        create: (data: PlanningInputReq) => api.post<PlanningInput>("/planning/inputs", data),
        update: (id: string, data: Partial<PlanningInputReq>) =>
            api.patch<PlanningInput>(`/planning/inputs/${id}`, data),
        delete: (id: string) => api.delete<void>(`/planning/inputs/${id}`),
    },
    goals: {
        list: (year: string) => api.get<PlanningGoal[]>(`/planning/goals?year=${year}`),
        get: (id: string) => api.get<PlanningGoal>(`/planning/goals/${id}`),
        create: (data: PlanningGoalReq) => api.post<PlanningGoal>("/planning/goals", data),
        update: (id: string, data: Partial<PlanningGoalReq>) =>
            api.patch<PlanningGoal>(`/planning/goals/${id}`, data),
        delete: (id: string) => api.delete<void>(`/planning/goals/${id}`),
        generate: (data: GenerateGoalsReq) =>
            api.post<PlanningGoal[]>("/planning/goals/generate", data),
    },
    exchangeRates: {
        list: (year: string) => api.get<PlanningExchangeRate[]>(`/planning/exchange-rates?year=${year}`),
        get: (date: string) => api.get<PlanningExchangeRate>(`/planning/exchange-rates/${date}`),
        create: (data: ExchangeRateReq) =>
            api.post<PlanningExchangeRate>("/planning/exchange-rates", data),
        update: (date: string, data: ExchangeRateReq) =>
            api.patch<PlanningExchangeRate>(`/planning/exchange-rates/${date}`, data),
        delete: (date: string) => api.delete<void>(`/planning/exchange-rates/${date}`),
    },
    config: {
        get: (year: string) => api.get<PlanningConfig>(`/planning/config/${year}`),
        update: (year: string, data: PlanningConfigReq) =>
            api.patch<PlanningConfig>(`/planning/config/${year}`, data),
    },
    forecast: (year: string) => api.get<PlanningYear>(`/planning/forecast/${year}`),
    plan: (year: string) => api.get<PlanningGoalYear>(`/planning/plan/${year}`),
};

export const backup = {
    export: () =>
        api.clientInstance.get("/backup/export", {
            responseType: "blob",
        }),
    import: (resource: "transactions" | "historical" | "networth" | "presets" | "planning-inputs" | "planning-goals" | "planning-exchange-rates" | "planning-config", file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.clientInstance.post(`/backup/import/${resource}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
