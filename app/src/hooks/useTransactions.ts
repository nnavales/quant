import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
    transactionAggregates,
    transactions,
    type TransactionFilters,
    type TransactionAggregateReq,
    type CancelInstallmentsReq,
} from "@/api_client";

export function useTransactionAggregates(filters: TransactionFilters) {
    return useQuery({
        queryKey: ["transaction-aggregates", filters],
        queryFn: () => transactionAggregates.list(filters),
    });
}

export function useInfiniteTransactions(filters: TransactionFilters) {
    const { page: _, ...stableFilters } = filters;
    return useInfiniteQuery({
        queryKey: ["transaction-aggregates", "infinite", stableFilters],
        queryFn: ({ pageParam = 1 }) =>
            transactionAggregates.list({ ...stableFilters, page: pageParam }),
        getNextPageParam: (lastPage) => {
            if (lastPage.page * lastPage.limit < lastPage.total)
                return lastPage.page + 1;
            return undefined;
        },
        initialPageParam: 1,
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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TransactionAggregateReq> }) =>
            transactionAggregates.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => transactionAggregates.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useBulkDeleteTransactions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => transactionAggregates.bulkDelete(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useCancelInstallments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CancelInstallmentsReq) => transactionAggregates.cancelInstallments(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateEntryPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
            transactions.updatePaid(id, isPaid),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
