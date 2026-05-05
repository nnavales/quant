import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "@/hooks";
import { dashboard as dashboardApi } from "@/api_client/endpoints";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { CustomSelect } from "@/components/ui/Select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ReactECharts from "echarts-for-react";
import type { KPI } from "@/api_client/types";

/* ──────────── Simple Bar Chart Modal (DashboardPage) ──────────── */

const KPI_LABELS: Record<string, string> = {
    capital_total: "Balance",
    net_savings_ytd: "Ahorro Neto",
    income_ytd: "Ingresos",
    expenses_ytd: "Gastos",
    savings_margin: "Margen Ahorro",
    avg_monthly_savings: "Ahorro Promedio",
    fixed_cost_ratio: "Ratio Costos Fijos",
    fixed_expense_mix: "Mix Gastos Fijos",
    fixed_income_mix: "Mix Ingresos Fijos",
    stable_income_coverage: "Cobertura Ingresos",
    financial_flexibility: "Flexibilidad",
    core_burn_rate: "Gasto Core",
    savings_volatility: "Volatilidad",
    savings_volatility_ratio: "Ratio Volatilidad",
    projected_yearly_savings: "Ahorro Proyectado",
    projected_yearly_capital: "Capital Proyectado",
    capital_growth_rate_ytd: "Crecimiento",
    expense_coverage_months: "Meses Cobertura",
};

interface KPISimpleModalProps {
    kpi: KPI;
    onClose: () => void;
}

export function KPISimpleModal({ kpi, onClose }: KPISimpleModalProps) {
    const label = KPI_LABELS[kpi] || kpi;
    const { data, isLoading, isError } = useQuery({
        queryKey: ["dashboard", "kpi", kpi],
        queryFn: () => dashboardApi.getKPIEvolution(kpi),
        enabled: !!kpi,
    });

    return (
        <Modal isOpen onClose={onClose}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.lg,
                    padding: spacing[4],
                    width: "90%",
                    maxWidth: "600px",
                    maxHeight: "80vh",
                    overflow: "auto",
                    border: `1px solid ${colors.border}`,
                    outline: `1px solid ${colors.fill}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: spacing[4],
                    }}
                >
                    <h2 style={{ fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>
                        {label}
                    </h2>
                    <Button
                        variant="plain"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </Button>
                </div>

                {isLoading && (
                    <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>
                        Cargando...
                    </div>
                )}

                {isError && (
                    <div style={{ color: colors.accent.red, textAlign: "center", padding: spacing[4] }}>
                        Error al cargar evolución
                    </div>
                )}

                {data && data.data.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "8px",
                            height: "200px",
                            padding: spacing[2],
                        }}
                    >
                        {data.data.map((point) => {
                            const max = Math.max(...data.data.map((d) => d.value));
                            const min = Math.min(...data.data.map((d) => d.value));
                            const range = max - min || 1;
                            return (
                                <div
                                    key={point.year}
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: `${((point.value - min) / range) * 100}%`,
                                            backgroundColor: colors.accent.cyan,
                                            borderRadius: "4px 4px 0 0",
                                            minHeight: "4px",
                                        }}
                                        title={`${point.year}: ${Math.round(point.value).toLocaleString("es-AR")}`}
                                    />
                                    <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>
                                        {point.year}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {(!data || data.data.length === 0) && !isLoading && !isError && (
                    <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>
                        Sin datos históricos
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}

/* ──────────── Full Line Chart Modal (AnalysisPage) ──────────── */

const KPI_MODAL_KPIS: Record<string, KPI> = {
    "Ingresos YTD": "income_ytd",
    "Gastos YTD": "expenses_ytd",
    "Ahorro Neto YTD": "net_savings_ytd",
    "Balance Total": "total_capital",
};

type ViewMode = "ytd" | "monthly" | "current_year";
type MetricType = "total" | "fixed" | "variable";

const formatCompactCurrency = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000_000) {
        return `$${(value / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "")}T`;
    }
    if (abs >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
    }
    if (abs >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (abs >= 1_000) {
        return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    }
    return `$${value.toFixed(0)}`;
};

interface KPIEvolutionModalProps {
    kpi: string;
    onClose: () => void;
}

export function KPIEvolutionModal({ kpi, onClose }: KPIEvolutionModalProps) {
    const { data: dashboardData, isLoading, isError } = useDashboard();
    const [viewMode, setViewMode] = useState<ViewMode>("ytd");
    const [metricType, setMetricType] = useState<MetricType>("total");
    const kpiKey = KPI_MODAL_KPIS[kpi];
    const currentYear = new Date().getFullYear();

    const { data: evolutionData, isLoading: evolutionLoading } = useQuery({
        queryKey: ["dashboard", "kpi", kpiKey],
        queryFn: () => dashboardApi.getKPIEvolution(kpiKey),
        enabled: !!kpiKey,
    });

    if (isLoading || evolutionLoading)
        return (
            <Modal isOpen onClose={onClose} opacity={0.7}>
                <ModalContent>
                    <div style={{ color: colors.fg.dim, textAlign: "center" }}>Cargando...</div>
                </ModalContent>
            </Modal>
        );
    if (isError)
        return (
            <Modal isOpen onClose={onClose} opacity={0.7}>
                <ModalContent>
                    <div style={{ color: colors.accent.red, textAlign: "center" }}>Error al cargar</div>
                </ModalContent>
            </Modal>
        );
    if (!dashboardData?.monthlySeries) return null;

    const config = KPI_MODAL_KPIS[kpi]
        ? { key: KPI_MODAL_KPIS[kpi], color: colors.accent.cyan }
        : { key: "income", color: colors.accent.green };
    const colorMap: Record<string, string> = {
        income_ytd: colors.accent.green,
        expenses_ytd: colors.accent.red,
        net_savings_ytd: colors.accent.green,
        total_capital: colors.accent.cyan,
    };

    const keyMap: Record<string, string> = {
        income_ytd: "income",
        expenses_ytd: "expense",
        net_savings_ytd: "savings",
        total_capital: "capital",
    };
    const dataKey = keyMap[config.key] || "income";

    let displayValueKey: string;
    if (metricType === "fixed") {
        displayValueKey =
            config.key === "income_ytd"
                ? "incomeFixed"
                : config.key === "expenses_ytd"
                  ? "expenseFixed"
                  : dataKey;
    } else if (metricType === "variable") {
        displayValueKey =
            config.key === "income_ytd"
                ? "incomeVariable"
                : config.key === "expenses_ytd"
                  ? "expenseVariable"
                  : dataKey;
    } else {
        displayValueKey = dataKey;
    }

    const isIncomeOrExpense = config.key === "income_ytd" || config.key === "expenses_ytd";
    const monthlyData = dashboardData.monthlySeries.map((m) => ({
        month: m.month,
        displayValue: (m[displayValueKey as keyof typeof m] as number) || 0,
    }));
    const currentYearData = monthlyData.filter((m) => m.month.startsWith(String(currentYear)));

    const ytdData = (evolutionData?.data || []).map((d) => ({
        month: String(d.year),
        displayValue: d.value,
    }));

    let chartData = monthlyData;
    if (viewMode === "ytd") chartData = ytdData;
    else if (viewMode === "current_year") chartData = currentYearData;

    const chartColor = colorMap[config.key] || colors.accent.cyan;

    const titleMap: Record<string, string> = {
        "Ingresos YTD": "Ingresos",
        "Gastos YTD": "Gastos",
        "Ahorro Neto YTD": "Ahorro Neto",
        "Balance Total": "Balance",
    };
    const title = titleMap[kpi] || kpi;

    return (
        <Modal isOpen onClose={onClose} opacity={0.8}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.xl,
                    padding: spacing[5],
                    width: "92%",
                    maxWidth: "900px",
                    maxHeight: "80vh",
                    overflow: "auto",
                    border: `1px solid ${colors.border}`,
                    outline: `1px solid ${colors.fill}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: spacing[4],
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: fonts.size.lg,
                                fontWeight: 600,
                                color: colors.fg.base,
                            }}
                        >
                            {title}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                            <p style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>
                                {viewMode === "ytd"
                                    ? "Evolución anual"
                                    : viewMode === "current_year"
                                      ? "Año en curso"
                                      : "Histórico completo"}
                            </p>
                            <div style={{ minHeight: "28px", display: "flex", alignItems: "center" }}>
                                {isIncomeOrExpense && viewMode !== "ytd" && (
                                    <CustomSelect
                                        value={metricType}
                                        options={[
                                            { value: "total", label: "Total" },
                                            { value: "fixed", label: "Fijo" },
                                            { value: "variable", label: "Variable" },
                                        ]}
                                        onChange={(v) => setMetricType(v as MetricType)}
                                        style={{ width: "100px" }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="plain"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </Button>
                </div>
                <div style={{ display: "flex", gap: spacing[1], marginBottom: spacing[4] }}>
                    {[
                        { key: "ytd", label: "YTD" },
                        { key: "current_year", label: "Año" },
                        { key: "monthly", label: "Todo" },
                    ].map((m) => (
                        <Button
                            key={m.key}
                            variant="tab"
                            active={viewMode === m.key}
                            size="sm"
                            onClick={() => setViewMode(m.key as ViewMode)}
                        >
                            {m.label}
                        </Button>
                    ))}
                </div>
                <div style={{ height: "380px" }}>
                    <ReactECharts
                        option={{
                            backgroundColor: "transparent",
                            grid: { top: 20, right: 20, bottom: 30, left: 60 },
                            xAxis: {
                                type: "category",
                                data: chartData.map((d) => d.month),
                                axisLine: { lineStyle: { color: colors.fill } },
                                axisTick: { show: false },
                                axisLabel: {
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.xs,
                                    formatter: (v: string) => {
                                        if (viewMode === "ytd") return v;
                                        const p = v.split("-");
                                        return p[1] ? `${p[1]}-${p[0].slice(2)}` : v;
                                    },
                                    interval:
                                        viewMode === "monthly"
                                            ? Math.floor(chartData.length / 8)
                                            : "auto",
                                },
                            },
                            yAxis: {
                                type: "value",
                                axisLine: { show: false },
                                axisTick: { show: false },
                                splitLine: {
                                    lineStyle: { color: colors.fill, type: "dashed" },
                                },
                                axisLabel: {
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.xs,
                                    formatter: (v: number) => formatCompactCurrency(v),
                                },
                            },
                            tooltip: {
                                trigger: "axis",
                                backgroundColor: colors.bg.surface,
                                borderColor: colors.fill,
                                textStyle: { color: colors.fg.base },
                                formatter: (params: Array<{ seriesName: string; value: number; name: string; color: string }>) => {
                                    const p = params[0];
                                    return `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${p.name}</div><div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-weight:600">${Math.round(p.value).toLocaleString("es-AR")}</span></div>`;
                                },
                            },
                            series: [
                                {
                                    data: chartData.map((d) => d.displayValue),
                                    type: "line",
                                    smooth: true,
                                    symbol: "circle",
                                    symbolSize: 6,
                                    showSymbol: false,
                                    emphasis: { showSymbol: true, scale: 1.5 },
                                    lineStyle: { color: chartColor, width: 2.5 },
                                    itemStyle: { color: chartColor, borderWidth: 0 },
                                    areaStyle: {
                                        color: {
                                            type: "linear",
                                            x: 0,
                                            y: 0,
                                            x2: 0,
                                            y2: 1,
                                            colorStops: [
                                                { offset: 0, color: `${chartColor}30` },
                                                { offset: 1, color: `${chartColor}00` },
                                            ],
                                        },
                                    },
                                },
                            ],
                        }}
                        style={{ height: "100%", width: "100%" }}
                        opts={{ renderer: "svg" }}
                    />
                </div>
            </ModalContent>
        </Modal>
    );
}
