import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatbot } from "@/api_client";

export function useChatbotConfig() {
    return useQuery({
        queryKey: ["chatbot"],
        queryFn: () => chatbot.get(),
    });
}

export function useChatbotHealth() {
    return useQuery({
        queryKey: ["chatbot-health"],
        queryFn: () => chatbot.health(),
    });
}

export function useSetAgentConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof chatbot.setAgent>[0]) => chatbot.setAgent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chatbot"] });
            queryClient.invalidateQueries({ queryKey: ["chatbot-health"] });
        },
    });
}

export function useSetChatConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof chatbot.setChat>[0]) => chatbot.setChat(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chatbot"] });
            queryClient.invalidateQueries({ queryKey: ["chatbot-health"] });
        },
    });
}
