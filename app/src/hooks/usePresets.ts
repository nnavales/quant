import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { presets, type PresetReq } from "@/api_client";

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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdatePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PresetReq> }) =>
            presets.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeletePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => presets.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useRestorePreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => presets.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
