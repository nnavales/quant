import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { channels, type ChannelReq } from "@/api_client";

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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ChannelReq> }) =>
            channels.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useRestoreChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.restore,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useHardDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: channels.hardDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
