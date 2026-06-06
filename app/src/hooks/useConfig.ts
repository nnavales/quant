import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config } from "@/api_client";

export function useUserConfig() {
    return useQuery({
        queryKey: ["config"],
        queryFn: () => config.get(),
    });
}

export function useUpdateUserConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, value }: { key: string; value: string }) => config.update(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
