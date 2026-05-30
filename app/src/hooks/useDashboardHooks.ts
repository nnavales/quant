import { useQuery } from "@tanstack/react-query";
import { dashboard, type KPI, type Dimension } from "@/api_client";

export function useDashboard() {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: () => dashboard.getKPIs(),
    });
}

export function useKPIEvolution(kpi: KPI) {
    return useQuery({
        queryKey: ["dashboard", "kpi", kpi],
        queryFn: () => dashboard.getKPIEvolution(kpi),
        enabled: !!kpi,
    });
}

export function useDimensionSeries(
    dimension: Dimension,
    params?: Record<string, string>
) {
    return useQuery({
        queryKey: ["dashboard", "dimension", dimension, params],
        queryFn: () => dashboard.getDimensionSeries(dimension, params),
        enabled: !!dimension,
    });
}

export function useDashboardMetrics(year: number) {
    return useQuery({
        queryKey: ["dashboard", "metrics", year],
        queryFn: () => dashboard.getMetrics(year),
    });
}
