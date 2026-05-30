import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    planning,
    type PlanningInputReq,
    type PlanningGoalReq,
    type ExchangeRateReq,
    type PlanningConfigReq,
    type GenerateGoalsReq,
} from "@/api_client";

export function usePlanningConfig(year: string) {
    return useQuery({
        queryKey: ["planning", "config", year],
        queryFn: () => planning.config.get(year),
    });
}

export function useUpdatePlanningConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ year, data }: { year: string; data: PlanningConfigReq }) =>
            planning.config.update(year, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function usePlanningInputs(year: string) {
    return useQuery({
        queryKey: ["planning", "inputs", year],
        queryFn: () => planning.inputs.list(year),
    });
}

export function useCreatePlanningInput() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PlanningInputReq) => planning.inputs.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdatePlanningInput() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PlanningInputReq> }) =>
            planning.inputs.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeletePlanningInput() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => planning.inputs.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function usePlanningGoals(year: string) {
    return useQuery({
        queryKey: ["planning", "goals", year],
        queryFn: () => planning.goals.list(year),
    });
}

export function useCreatePlanningGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PlanningGoalReq) => planning.goals.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdatePlanningGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PlanningGoalReq> }) =>
            planning.goals.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeletePlanningGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => planning.goals.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useGenerateGoals() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: GenerateGoalsReq) => planning.goals.generate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function usePlanningForecast(year: string) {
    return useQuery({
        queryKey: ["planning", "forecast", year],
        queryFn: () => planning.forecast(year),
    });
}

export function usePlanningPlan(year: string) {
    return useQuery({
        queryKey: ["planning", "plan", year],
        queryFn: () => planning.plan(year),
    });
}

export function useExchangeRates(year: string) {
    return useQuery({
        queryKey: ["planning", "rates", year],
        queryFn: () => planning.exchangeRates.list(year),
    });
}

export function useCreateExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ExchangeRateReq) => planning.exchangeRates.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ date, data }: { date: string; data: ExchangeRateReq }) =>
            planning.exchangeRates.update(date, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (date: string) => planning.exchangeRates.delete(date),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
