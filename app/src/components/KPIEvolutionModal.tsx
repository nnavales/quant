import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "@/hooks";
import { dashboard as dashboardApi } from "@/api_client/endpoints";
import { spacing, radius } from "@/styles/theme";
import { formatNumber } from "@/utils/format";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Modal, ModalContent, ModalCloseButton } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { chipTriggerStyle } from "@/styles/filters";
import { Button } from "@/components/ui/Button";
import ReactECharts from "echarts-for-react";
import type { KPI, MetricCell } from "@/api_client/types";
import { flexBetween, flexColumn, flexRow } from "@/styles/layout";

/* ──────────── Full Line Chart Modal ──────────── */

const KPI_MODAL_KPIS: Record<string, KPI> = {
    "Ingresos YTD": "income_ytd",
    "Egresos YTD": "expenses_ytd",
    "Ahorro Neto YTD": "net_savings_ytd",
    "Balance Total": "total_capital",
    "Patrimonio Neto": "total_capital",
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
    metricMonths?: MetricCell[];
    accentColor?: string;
}

export function KPIEvolutionModal({ kpi, onClose, metricMonths, accentColor }: KPIEvolutionModalProps) {
    const { data: dashboardData, isLoading, isError } = useDashboard();
    const [viewMode, setViewMode] = useState<ViewMode>("current_year");
    const [metricType, setMetricType] = useState<MetricType>("total");
    const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
    const isMultiSeries = !!metricMonths && metricMonths.length > 0;
    const toggleSeries = (name: string) => {
        setHiddenSeries((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
    };
    const formatX = (v: string) => {
        if (isMultiSeries || viewMode === "ytd") return v;
        const p = v.split("-");
        if (p.length === 2) {
            const m = parseInt(p[1]);
            if (m >= 1 && m <= 12) {
                const mn = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m - 1];
                if (viewMode === "monthly") return `${mn} '${p[0].slice(-2)}`;
                return mn;
            }
        }
        return v;
    };
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
                <ModalContent
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[5],
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[2] }}>
                        <ModalCloseButton onClick={onClose} />
                    </div>
                    <div style={{ color: colors.fg.dim, textAlign: "center" }}>Cargando...</div>
                </ModalContent>
            </Modal>
        );
    if (isError)
        return (
            <Modal isOpen onClose={onClose} opacity={0.7}>
                <ModalContent
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[5],
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[2] }}>
                        <ModalCloseButton onClick={onClose} />
                    </div>
                    <div style={{ color: colors.accent.red, textAlign: "center" }}>Error al cargar</div>
                </ModalContent>
            </Modal>
        );
    if (!dashboardData?.monthlySeries) return null;

    const config = KPI_MODAL_KPIS[kpi]
        ? { key: KPI_MODAL_KPIS[kpi], color: colors.accent.blue }
        : { key: "income", color: colors.accent.green };
    const colorMap: Record<string, string> = {
        income_ytd: colors.accent.green,
        expenses_ytd: colors.accent.red,
        net_savings_ytd: colors.accent.cyan,
        total_capital: colors.accent.blue,
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
        displayValue: (m[dataKey as keyof typeof m] as number) || 0,
    }));
    const currentYearData = dashboardData.monthlySeries
        .filter((m) => m.month.startsWith(String(currentYear)))
        .map((m) => ({
            month: m.month,
            displayValue: (m[displayValueKey as keyof typeof m] as number) || 0,
        }));

    const ytdData = (evolutionData?.data || []).map((d) => ({
        month: String(d.year),
        displayValue: d.value,
    }));

    let chartData = monthlyData;
    if (viewMode === "ytd") chartData = ytdData;
    else if (viewMode === "current_year") chartData = currentYearData;

    const chartColor = colorMap[config.key] || colors.accent.cyan;

    const seriesColors: Record<string, string> = {
        Real: accentColor ?? chartColor,
        FCST: colors.accent.orange,
        Plan: colors.accent.purple,
        LY: colors.fg.dim,
    };

    const multiSeriesMonths = isMultiSeries
        ? metricMonths.map((_, i) => {
              const d = new Date();
              d.setMonth(i);
              const name = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
              return name.charAt(0).toUpperCase() + name.slice(1);
          })
        : [];
    const multiSeriesOptions = isMultiSeries
        ? (["Real", "FCST", "Plan", "LY"] as const).map((name) => ({
              name,
              data: metricMonths.map((m) => {
                  if (name === "Real") return m.real ?? null;
                  if (name === "FCST") return m.fcst ?? null;
                  if (name === "Plan") return m.plan ?? null;
                  return m.ly ?? null;
              }),
              color: seriesColors[name],
          }))
        : [];

    const titleMap: Record<string, string> = {
        "Ingresos YTD": "Ingresos",
        "Egresos YTD": "Egresos",
        "Ahorro Neto YTD": "Ahorro Neto",
        "Balance Total": "Balance",
        "Capital": "Evolución de Capital",
        "Ahorro": "Evolución del Ahorro",
        "Egresos": "Evolución de Egresos",
        "Ingresos": "Evolución de Ingresos",
    };
    const title = titleMap[kpi] || kpi;

    const visibleSeries = isMultiSeries
        ? multiSeriesOptions.filter((s) => !hiddenSeries.includes(s.name))
        : [];

    return (
        <Modal isOpen onClose={onClose} opacity={0.8}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.lg,
                    width: "1140px",
                    height: "650px",
                    ...flexColumn,
                    overflow: "hidden",
                }}
            >
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing[1],
                    padding: spacing[5],
                    paddingBottom: spacing[3],
                    borderBottom: `1px solid ${colors.border}`,
                    flexShrink: 0,
                }}>
                    <div
                        style={{
                            ...flexBetween,
                            gap: spacing[2],
                        }}
                    >
                        <h2 style={{ fontSize: fonts.size.lg, fontWeight: fonts.weight.semibold, color: colors.fg.base, margin: 0 }}>
                            {title}
                        </h2>
                        {!isMultiSeries && isIncomeOrExpense && viewMode === "current_year" && (
                            <Dropdown
                                value={metricType}
                                options={[
                                    { id: "total", label: "Total" },
                                    { id: "fixed", label: "Fijo" },
                                    { id: "variable", label: "Variable" },
                                ]}
                                onChange={(id) => setMetricType(id as MetricType)}
                                triggerStyle={{ ...chipTriggerStyle(true), width: "auto", minWidth: 0, height: "24px" }}
                            />
                        )}
                        <div style={{ ...flexRow, gap: spacing[2], marginLeft: "auto" }}>
                            {!isMultiSeries && (
                                <>
                                <div style={{
                                    ...flexRow,
                                    gap: 2,
                                    borderRadius: "6px",
                                    background: colors.fill,
                                    overflow: "hidden",
                                    flexShrink: 0,
                                }}>
                                    {[
                                        { key: "current_year", label: "YTD" },
                                        { key: "monthly", label: "Mensual" },
                                        { key: "ytd", label: "Anual" },
                                    ].map((m) => (
                                        <div
                                            key={m.key}
                                            onClick={() => setViewMode(m.key as ViewMode)}
                                            style={{
                                                padding: "2px 8px",
                                                fontSize: fonts.size.xs,
                                                fontWeight: fonts.weight.medium,
                                                color: viewMode === m.key ? colors.fg.base : colors.fg.dim,
                                                background: viewMode === m.key ? colors.bg.surface : "transparent",
                                                borderRadius: "5px",
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                                lineHeight: "20px",
                                            }}
                                        >
                                            {m.label}
                                        </div>
                                    ))}
                                </div>
                                </>
                            )}
                            <ModalCloseButton onClick={onClose} />
                        </div>
                    </div>

                    {isMultiSeries && (
                        <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                            {(["Real", "FCST", "Plan", "LY"] as const).map((name) => {
                                const isHidden = hiddenSeries.includes(name);
                                return (
                                    <div
                                        key={name}
                                        onClick={() => toggleSeries(name)}
                                        style={{
                                            ...flexRow,
                                            gap: 3,
                                            cursor: "pointer",
                                            fontSize: fonts.size.sm,
                                            fontWeight: fonts.weight.medium,
                                            color: isHidden ? colors.fg.dim : undefined,
                                            opacity: isHidden ? 0.45 : 1,
                                            transition: "opacity 0.15s",
                                        }}
                                    >
                                        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: seriesColors[name], flexShrink: 0 }} />
                                        {name}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ReactECharts
                        key={isMultiSeries ? hiddenSeries.join(",") : viewMode}
                        option={{
                            backgroundColor: "transparent",
                            grid: { top: 20, right: 20, bottom: 30, left: 60 },
                            xAxis: {
                                type: "category",
                                data: isMultiSeries ? multiSeriesMonths : chartData.map((d) => d.month),
                                axisLine: { lineStyle: { color: colors.fill } },
                                axisTick: { show: false },
                                axisLabel: {
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.xs,
                                    formatter: (v: string) => formatX(v),
                                    interval: !isMultiSeries && viewMode === "monthly"
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
                                backgroundColor: colors.bg.elevated,
                                borderColor: colors.border,
                                borderWidth: 2,
                                borderRadius: 8,
                                textStyle: { color: colors.fg.base },
                                formatter: (params: Array<{ seriesName: string; value: number; name: string; color: string }>) => {
                                    if (isMultiSeries) {
                                        let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name)}</div>`;
                                        params.forEach((p) => {
                                            if (p.value === null || p.value === undefined) return;
                                            html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-weight:600">${p.seriesName}: ${formatNumber(Math.round(p.value), { decimals: 0 })}</span></div>`;
                                        });
                                        return html;
                                    }
                                    const p = params[0];
                                    return `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(p.name)}</div><div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-weight:600">${formatNumber(Math.round(p.value), { decimals: 0 })}</span></div>`;
                                },
                            },
                            series: isMultiSeries
                                ? visibleSeries.map((s) => ({
                                      name: s.name,
                                      data: s.data,
                                      type: "line",
                                      smooth: true,
                                      symbol: "circle",
                                      symbolSize: 6,
                                      showSymbol: false,
                                      emphasis: { showSymbol: true, scale: 1.5 },
                                      lineStyle: { color: seriesColors[s.name], width: s.name === "Real" ? 2.5 : 1.5 },
                                      itemStyle: { color: seriesColors[s.name], borderWidth: 0 },
                                      areaStyle: s.name === "Real" ? {
                                          color: {
                                              type: "linear",
                                              x: 0,
                                              y: 0,
                                              x2: 0,
                                              y2: 1,
                                              colorStops: [
                                                  { offset: 0, color: `${seriesColors[s.name]}30` },
                                                  { offset: 1, color: `${seriesColors[s.name]}00` },
                                              ],
                                          },
                                      } : undefined,
                                  }))
                                : [
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
