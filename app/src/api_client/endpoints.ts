import { api } from "./client";
import type {
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
} from "./types";

export const channels = {
    list: () => api.get<Channel[]>("/channels"),
    listWithAccounts: () => api.get<ChannelWithAccounts[]>("/channels?include=accounts"),
    get: (id: string) => api.get<Channel>(`/channels/${id}`),
    create: (data: ChannelReq) => api.post<Channel>("/channels", data),
    update: (id: string, data: Partial<ChannelReq>) => api.patch<Channel>(`/channels/${id}`, data),
    delete: (id: string) => api.delete<void>(`/channels/${id}`),
};

export const accounts = {
    list: () => api.get<Account[]>("/accounts"),
    get: (id: string) => api.get<Account>(`/accounts/${id}`),
    create: (data: AccountReq) => api.post<Account>("/accounts", data),
    update: (id: string, data: Partial<AccountReq>) => api.patch<Account>(`/accounts/${id}`, data),
    delete: (id: string) => api.delete<void>(`/accounts/${id}`),
};

export const categories = {
    list: () => api.get<Category[]>("/categories"),
    listWithSubcategories: () => api.get<CategoryWithSubcategories[]>("/categories?include=subcategories"),
    get: (id: string) => api.get<Category>(`/categories/${id}`),
    create: (data: CategoryReq) => api.post<Category>("/categories", data),
    update: (id: string, data: Partial<CategoryReq>) =>
        api.patch<Category>(`/categories/${id}`, data),
    delete: (id: string) => api.delete<void>(`/categories/${id}`),
};

export const subcategories = {
    list: () => api.get<Subcategory[]>("/subcategories"),
    get: (id: string) => api.get<Subcategory>(`/subcategories/${id}`),
    create: (data: SubcategoryReq) => api.post<Subcategory>("/subcategories", data),
    update: (id: string, data: Partial<SubcategoryReq>) =>
        api.patch<Subcategory>(`/subcategories/${id}`, data),
    delete: (id: string) => api.delete<void>(`/subcategories/${id}`),
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
            if (filters.installments !== undefined) params.set("installments", String(filters.installments));
            if (filters.category) params.set("category", filters.category);
            if (filters.subcategory) params.set("subcategory", filters.subcategory);
            if (filters.channel) params.set("channel", filters.channel);
            if (filters.account) params.set("account", filters.account);
            if (filters.date_from) params.set("date_from", filters.date_from);
            if (filters.date_to) params.set("date_to", filters.date_to);
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
