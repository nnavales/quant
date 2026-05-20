import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import {
    transactionAggregates,
    channels,
    accounts,
    categories,
    subcategories,
    economic,
    config,
    transactions,
    historical,
    dashboard,
    networth,
    assets,
    presets,
    backup,
    planning,
    type TransactionFilters,
    type TransactionAggregateReq,
    type CancelInstallmentsReq,
    type UserConfigUpdate,
    type HistoricalEntryCreate,
    type HistoricalFinanceReq,
    type KPI,
    type Dimension,
    type AssetReq,
    type PresetReq,
    type PlanningInputReq,
    type PlanningGoalReq,
    type ExchangeRateReq,
    type PlanningConfigReq,
    type GenerateGoalsReq,
} from "@/api_client";
import { type HistoricalFilters } from "@/api_client";

function invalidateKeys(queryClient: QueryClient, keys: (string | string[])[]) {
    keys.forEach((key) => {
        const qk = typeof key === "string" ? [key] : key;
        queryClient.invalidateQueries({ queryKey: qk, refetchType: "all" });
    });
}

export function useTransactionAggregates(filters: TransactionFilters) {
    return useQuery({
        queryKey: ["transaction-aggregates", filters],
        queryFn: () => transactionAggregates.list(filters),
    });
}

export function useTransactionAggregate(id: string) {
    return useQuery({
        queryKey: ["transaction-aggregate", id],
        queryFn: () => transactionAggregates.get(id),
        enabled: !!id,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: TransactionAggregateReq) => transactionAggregates.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["transaction-aggregates", "transactions", "dashboard", "networth"]);
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TransactionAggregateReq> }) =>
            transactionAggregates.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["transaction-aggregates", "transactions", "dashboard", "networth"]);
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => transactionAggregates.delete(id),
        onSuccess: () => {
            invalidateKeys(queryClient, ["transaction-aggregates", "transactions", "dashboard", "networth"]);
        },
    });
}

export function useBulkDeleteTransactions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => transactionAggregates.bulkDelete(ids),
        onSuccess: () => {
            invalidateKeys(queryClient, ["transaction-aggregates", "transactions", "dashboard", "networth"]);
        },
    });
}

export function useCancelInstallments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CancelInstallmentsReq) => transactionAggregates.cancelInstallments(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["transaction-aggregates", "transactions", "dashboard", "networth"]);
        },
    });
}

export function useChannels() {
    return useQuery({
        queryKey: ["channels"],
        queryFn: () => channels.list(),
    });
}

export function useChannelsWithAccounts() {
    return useQuery({
        queryKey: ["channels", "with-accounts"],
        queryFn: () => channels.listWithAccounts(),
    });
}

export function useChannel(id: string) {
    return useQuery({
        queryKey: ["channel", id],
        queryFn: () => channels.get(id),
        enabled: !!id,
    });
}

export function useCreateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.create,
        onSuccess: () => {
            invalidateKeys(queryClient, ["channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").ChannelReq> }) =>
            channels.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.delete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useRestoreChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.restore,
        onSuccess: () => {
            invalidateKeys(queryClient, ["channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useHardDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.hardDelete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["channels", "accounts", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useAccounts() {
    return useQuery({
        queryKey: ["accounts"],
        queryFn: () => accounts.list(),
    });
}

export function useAccount(id: string) {
    return useQuery({
        queryKey: ["account", id],
        queryFn: () => accounts.get(id),
        enabled: !!id,
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.create,
        onSuccess: () => {
            invalidateKeys(queryClient, ["accounts", "channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").AccountReq> }) =>
            accounts.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["accounts", "channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.delete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["accounts", "channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useRestoreAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.restore,
        onSuccess: () => {
            invalidateKeys(queryClient, ["accounts", "channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useHardDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.hardDelete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["accounts", "channels", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: () => categories.list(),
    });
}

export function useCategoriesWithSubcategories() {
    return useQuery({
        queryKey: ["categories", "with-subcategories"],
        queryFn: () => categories.listWithSubcategories(),
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: ["category", id],
        queryFn: () => categories.get(id),
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.create,
        onSuccess: () => {
            invalidateKeys(queryClient, ["categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").CategoryReq> }) =>
            categories.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.delete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useRestoreCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.restore,
        onSuccess: () => {
            invalidateKeys(queryClient, ["categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useHardDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.hardDelete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["categories", "subcategories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useSubcategories() {
    return useQuery({
        queryKey: ["subcategories"],
        queryFn: () => subcategories.list(),
    });
}

export function useSubcategory(id: string) {
    return useQuery({
        queryKey: ["subcategory", id],
        queryFn: () => subcategories.get(id),
        enabled: !!id,
    });
}

export function useCreateSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.create,
        onSuccess: () => {
            invalidateKeys(queryClient, ["subcategories", "categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useUpdateSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").SubcategoryReq> }) =>
            subcategories.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["subcategories", "categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useDeleteSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.delete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["subcategories", "categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useRestoreSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.restore,
        onSuccess: () => {
            invalidateKeys(queryClient, ["subcategories", "categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

export function useHardDeleteSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.hardDelete,
        onSuccess: () => {
            invalidateKeys(queryClient, ["subcategories", "categories", "dashboard", "dashboard/dimension", "transaction-aggregates", "transactions"]);
        },
    });
}

// ============================================
// Economic / Macro Economic Hooks
// ============================================

export function useIPC() {
    return useQuery({
        queryKey: ["economic", "ipc"],
        queryFn: () => economic.getIPC(),
    });
}

export function useInflation() {
    return useQuery({
        queryKey: ["economic", "inflation"],
        queryFn: () => economic.getInflation(false),
    });
}

export function useDollarHistoric(quotation?: string) {
    return useQuery({
        queryKey: ["economic", "dollar-historic", quotation],
        queryFn: () => economic.getDollarHistoric(quotation, false),
    });
}

export function useDollarBanks(quotation?: string, refresh?: boolean) {
    return useQuery({
        queryKey: ["economic", "dollar-banks", quotation, refresh],
        queryFn: () => economic.getDollarBanks(quotation, refresh),
    });
}

export function useCrypto(symbol?: string) {
    return useQuery({
        queryKey: ["economic", "crypto", symbol],
        queryFn: () => economic.getCrypto(symbol, false),
    });
}

export function useCountryRisk() {
    return useQuery({
        queryKey: ["economic", "country-risk"],
        queryFn: () => economic.getCountryRisk(false),
    });
}

export function useFixedDeposits() {
    return useQuery({
        queryKey: ["economic", "fixed-deposits"],
        queryFn: () => economic.getFixedDeposits(false),
    });
}

export function useYieldAccounts() {
    return useQuery({
        queryKey: ["economic", "yield-accounts"],
        queryFn: () => economic.getYieldAccounts(false),
    });
}

export function useLoans() {
    return useQuery({
        queryKey: ["economic", "loans"],
        queryFn: () => economic.getLoans(false),
    });
}

// ============================================
// User Config Hooks
// ============================================

export function useUserConfig() {
    return useQuery({
        queryKey: ["config"],
        queryFn: () => config.get(),
    });
}

export function useUpdateUserConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UserConfigUpdate) => config.update(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["config", "dashboard", "transaction-aggregates", "transactions", "networth"]);
        },
    });
}

export function useUpdateEntryPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
            transactions.updatePaid(id, isPaid),
        onSuccess: () => {
            invalidateKeys(queryClient, ["transaction-aggregates", "transactions", "dashboard", "networth"]);
        },
    });
}

// ============================================
// Historical Hooks
// ============================================

export function useHistoricalEntries(filters?: HistoricalFilters) {
    return useQuery({
        queryKey: ["historical", filters],
        queryFn: () => historical.list(filters),
    });
}

export function useHistoricalEntry(month: string) {
    return useQuery({
        queryKey: ["historical", month],
        queryFn: () => historical.get(month),
        enabled: !!month,
    });
}

export function useCreateHistoricalEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: HistoricalEntryCreate) => historical.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["historical"]);
        },
    });
}

export function useUpdateHistoricalEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ month, data }: { month: string; data: Partial<HistoricalFinanceReq> }) =>
            historical.update(month, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["historical"]);
        },
    });
}

export function useDeleteHistoricalEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (month: string) => historical.delete(month),
        onSuccess: () => {
            invalidateKeys(queryClient, ["historical"]);
        },
    });
}

export function useBulkCreateHistoricalEntries() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: HistoricalFinanceReq[]) => historical.bulkCreate(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["historical"]);
        },
    });
}

export function useDashboard() {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: () => dashboard.getKPIs(),
    });
}

export function useKPIEvolution(kpi: KPI) {
    return useQuery({
        queryKey: ["dashboard", "kpi", kpi],
        queryFn: () => dashboard.getKPIEvolution(kpi),
        enabled: !!kpi,
    });
}

export function useDimensionSeries(
    dimension: Dimension,
    params?: Record<string, string>
) {
    return useQuery({
        queryKey: ["dashboard", "dimension", dimension, params],
        queryFn: () => dashboard.getDimensionSeries(dimension, params),
        enabled: !!dimension,
    });
}

// ============================================
// Networth Hooks
// ============================================

export function useNetWorth() {
    return useQuery({
        queryKey: ["networth"],
        queryFn: () => networth.get(),
    });
}

export function useAssets() {
    return useQuery({
        queryKey: ["assets"],
        queryFn: () => assets.list(),
    });
}

export function useAsset(id: string) {
    return useQuery({
        queryKey: ["asset", id],
        queryFn: () => assets.get(id),
        enabled: !!id,
    });
}

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AssetReq) => assets.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["assets", "networth"]);
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AssetReq> }) =>
            assets.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["assets", "networth"]);
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assets.delete(id),
        onSuccess: () => {
            invalidateKeys(queryClient, ["assets", "networth"]);
        },
    });
}

// ============================================
// Preset Hooks
// ============================================

export function usePresets() {
    return useQuery({
        queryKey: ["presets"],
        queryFn: () => presets.list(),
    });
}

export function usePreset(id: string) {
    return useQuery({
        queryKey: ["preset", id],
        queryFn: () => presets.get(id),
        enabled: !!id,
    });
}

export function useCreatePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PresetReq) => presets.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["presets"]);
        },
    });
}

export function useUpdatePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PresetReq> }) =>
            presets.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["presets"]);
        },
    });
}

export function useDeletePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => presets.delete(id),
        onSuccess: () => {
            invalidateKeys(queryClient, ["presets"]);
        },
    });
}

export function useRestorePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => presets.restore(id),
        onSuccess: () => {
            invalidateKeys(queryClient, ["presets"]);
        },
    });
}

export function useExportBackup() {
    return useMutation({
        mutationFn: () => backup.export(),
    });
}

export function useImportBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ resource, file }: { resource: "transactions" | "historical" | "networth" | "presets" | "planning-inputs" | "planning-goals" | "planning-exchange-rates" | "planning-config"; file: File }) =>
            backup.import(resource, file),
        onSuccess: () => {
            invalidateKeys(queryClient, [
                "transaction-aggregates",
                "transactions",
                "historical",
                "assets",
                "networth",
                "dashboard",
                "categories",
                "subcategories",
                "channels",
                "accounts",
                "presets",
                ["planning"],
            ]);
        },
    });
}

// ============================================
// Planning Hooks
// ============================================

export function usePlanningConfig(year: string) {
    return useQuery({
        queryKey: ["planning", "config", year],
        queryFn: () => planning.config.get(year),
    });
}

export function useUpdatePlanningConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ year, data }: { year: string; data: PlanningConfigReq }) =>
            planning.config.update(year, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function usePlanningInputs(year: string) {
    return useQuery({
        queryKey: ["planning", "inputs", year],
        queryFn: () => planning.inputs.list(year),
    });
}

export function useCreatePlanningInput() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PlanningInputReq) => planning.inputs.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useUpdatePlanningInput() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PlanningInputReq> }) =>
            planning.inputs.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useDeletePlanningInput() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => planning.inputs.delete(id),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function usePlanningGoals(year: string) {
    return useQuery({
        queryKey: ["planning", "goals", year],
        queryFn: () => planning.goals.list(year),
    });
}

export function useCreatePlanningGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PlanningGoalReq) => planning.goals.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useUpdatePlanningGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PlanningGoalReq> }) =>
            planning.goals.update(id, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useDeletePlanningGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => planning.goals.delete(id),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useGenerateGoals() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: GenerateGoalsReq) => planning.goals.generate(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function usePlanningForecast(year: string) {
    return useQuery({
        queryKey: ["planning", "forecast", year],
        queryFn: () => planning.forecast(year),
    });
}

export function usePlanningPlan(year: string) {
    return useQuery({
        queryKey: ["planning", "plan", year],
        queryFn: () => planning.plan(year),
    });
}

export function useExchangeRates(year: string) {
    return useQuery({
        queryKey: ["planning", "rates", year],
        queryFn: () => planning.exchangeRates.list(year),
    });
}

export function useCreateExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ExchangeRateReq) => planning.exchangeRates.create(data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useUpdateExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ date, data }: { date: string; data: ExchangeRateReq }) =>
            planning.exchangeRates.update(date, data),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export function useDeleteExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (date: string) => planning.exchangeRates.delete(date),
        onSuccess: () => {
            invalidateKeys(queryClient, ["planning"]);
        },
    });
}

export { useClickOutside } from "./useClickOutside";
export { useDropdownPosition } from "./useDropdownPosition";
export { useCategoryGroups, useAccountGroups } from "./useDropdownGroups";
export { useDollarRate } from "./useDollarRate";
export function useDashboardMetrics(year: number) {
    return useQuery({
        queryKey: ["dashboard", "metrics", year],
        queryFn: () => dashboard.getMetrics(year),
    });
}

 export { useGroupedChannels, useGroupedCategories } from "./useGroupedItems";
