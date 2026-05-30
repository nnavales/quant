import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { networth, assets, type AssetReq } from "@/api_client";

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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AssetReq> }) =>
            assets.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => assets.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
