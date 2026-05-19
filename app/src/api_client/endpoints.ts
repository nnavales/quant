import { api } from "./client";
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
        const params = new URLSearchParams();
        if (filters) {
            if (filters.page) params.set("page", String(filters.page));
            if (filters.limit) params.set("limit", String(filters.limit));
            if (filters.sort) params.set("sort", filters.sort);
            if (filters.order) params.set("order", filters.order);
            if (filters.search) params.set("search", filters.search);
            if (filters.type) params.set("type", filters.type);
            if (filters.currency) params.set("currency", filters.currency);
            if (filters.frequency) params.set("frequency", filters.frequency);
            if (filters.installments !== undefined) params.set("installment", String(filters.installments));
            if (filters.category) params.set("category", filters.category);
            if (filters.subcategory) params.set("subcategory", filters.subcategory);
            if (filters.channel) params.set("channel", filters.channel);
            if (filters.account) params.set("account", filters.account);
            if (filters.date_from) params.set("date_from", filters.date_from);
            if (filters.date_to) params.set("date_to", filters.date_to);
            if (filters.is_paid !== undefined) params.set("is_paid", String(filters.is_paid));
        }
        const query = params.toString();
        return api.get<TransactionListResponse>(`/transaction-aggregates${query ? `?${query}` : ""}`).then((response) => ({
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
    cancelInstallments: (data: CancelInstallmentsReq) =>
        api.post<void>("/transaction-aggregates/cancel-installments", data),
};

// ============================================
// Economic / Macro Economic Endpoints
// ============================================

export const economic = {
    getIPC: () => api.get<EconomicSeriesResponse>("/economic/ipc"),
    getInflation: (refresh?: boolean) => {
        const params = new URLSearchParams();
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<EconomicSeriesResponse>(`/economic/inflation${query ? `?${query}` : ""}`);
    },
    getDollarHistoric: (quotation?: string, refresh?: boolean) => {
        const params = new URLSearchParams();
        if (quotation) params.set("quotation", quotation);
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<EconomicSeriesResponse>(`/economic/dollar${query ? `?${query}` : ""}`);
    },
    getDollarBanks: (quotation?: string, refresh?: boolean) => {
        const params = new URLSearchParams();
        if (quotation) params.set("quotation", quotation);
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<DollarMap>(`/economic/dollar/banks${query ? `?${query}` : ""}`);
    },
    getCrypto: (symbol?: string, refresh?: boolean) => {
        const params = new URLSearchParams();
        if (symbol) params.set("symbol", symbol);
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<EconomicSeriesResponse>(`/economic/crypto${query ? `?${query}` : ""}`);
    },
    getCountryRisk: (refresh?: boolean) => {
        const params = new URLSearchParams();
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<CountryRiskValue>(`/economic/country-risk${query ? `?${query}` : ""}`);
    },
    getFixedDeposits: (refresh?: boolean) => {
        const params = new URLSearchParams();
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<FixedDepositsMap>(`/economic/fixed-deposits${query ? `?${query}` : ""}`);
    },
    getYieldAccounts: (refresh?: boolean) => {
        const params = new URLSearchParams();
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<YieldMap>(`/economic/yield-accounts${query ? `?${query}` : ""}`);
    },
    getLoans: (refresh?: boolean) => {
        const params = new URLSearchParams();
        if (refresh) params.set("refresh", "true");
        const query = params.toString();
        return api.get<LoanMap>(`/economic/loans${query ? `?${query}` : ""}`);
    },
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
    sort?: "month" | "income" | "expense";
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
        const params = new URLSearchParams();
        if (filters) {
            if (filters.page) params.set("page", String(filters.page));
            if (filters.limit) params.set("limit", String(filters.limit));
            if (filters.sort) params.set("sort", filters.sort);
            if (filters.order) params.set("order", filters.order);
            if (filters.date_from) params.set("date_from", filters.date_from);
            if (filters.date_to) params.set("date_to", filters.date_to);
            if (filters.source) params.set("source", filters.source);
        }
        const query = params.toString();
        return api.get<HistoricalEntryResponse>(`/historical-entries${query ? `?${query}` : ""}`).then((response) => ({
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
    import: (resource: "transactions" | "historical" | "networth", file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.clientInstance.post(`/backup/import/${resource}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
