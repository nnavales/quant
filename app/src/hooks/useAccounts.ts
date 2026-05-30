import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accounts, type AccountReq } from "@/api_client";

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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AccountReq> }) =>
            accounts.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useRestoreAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.restore,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useHardDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: accounts.hardDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
