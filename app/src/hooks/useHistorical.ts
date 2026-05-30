import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
    historical,
    type HistoricalFilters,
    type HistoricalEntryCreate,
    type HistoricalFinanceReq,
} from "@/api_client";

export function useHistoricalEntries(filters?: HistoricalFilters) {
    return useQuery({
        queryKey: ["historical", filters],
        queryFn: () => historical.list(filters),
    });
}

export function useHistoricalEntriesInfinite(filters?: HistoricalFilters) {
    const { page: _, ...stableFilters } = filters ?? {};
    return useInfiniteQuery({
        queryKey: ["historical", "infinite", stableFilters],
        queryFn: ({ pageParam = 1 }) =>
            historical.list({ ...stableFilters, page: pageParam }),
        getNextPageParam: (lastPage) => {
            if (lastPage.page * lastPage.limit < lastPage.total)
                return lastPage.page + 1;
            return undefined;
        },
        initialPageParam: 1,
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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateHistoricalEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ month, data }: { month: string; data: Partial<HistoricalFinanceReq> }) =>
            historical.update(month, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteHistoricalEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (month: string) => historical.delete(month),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useBulkCreateHistoricalEntries() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: HistoricalFinanceReq[]) => historical.bulkCreate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
