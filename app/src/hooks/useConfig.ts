import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config, type UserConfigUpdate } from "@/api_client";

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
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
