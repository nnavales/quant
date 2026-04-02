import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    transactionAggregates,
    channels,
    accounts,
    categories,
    subcategories,
    economic,
    config,
    type TransactionFilters,
    type TransactionAggregateReq,
    type CancelInstallmentsReq,
    type UserConfigUpdate,
} from "@/api_client";

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
            queryClient.invalidateQueries({ queryKey: ["transaction-aggregates"] });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TransactionAggregateReq> }) =>
            transactionAggregates.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transaction-aggregates"] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => transactionAggregates.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transaction-aggregates"] });
        },
    });
}

export function useCancelInstallments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CancelInstallmentsReq) => transactionAggregates.cancelInstallments(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transaction-aggregates"] });
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
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
    });
}

export function useUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").ChannelReq> }) =>
            channels.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
    });
}

export function useDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["channels"] });
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
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").AccountReq> }) =>
            accounts.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["channels"] });
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
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").CategoryReq> }) =>
            categories.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
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
            queryClient.invalidateQueries({ queryKey: ["subcategories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

export function useUpdateSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<import("@/api_client/types").SubcategoryReq> }) =>
            subcategories.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subcategories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

export function useDeleteSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subcategories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
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
            queryClient.invalidateQueries({ queryKey: ["config"] });
        },
    });
}
