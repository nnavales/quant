import { useState, useMemo, useEffect } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { useDashboard, useDashboardMetrics, useDimensionSeries } from "@/hooks";
import { Dropdown } from "@/components/ui/Dropdown";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { MetricCell, MonthlyData } from "@/api_client/types";

type ViewMode = "current_year" | "ytd" | "monthly";

interface TooltipParam {
    name: string;
    seriesName: string;
    value: number;
    color: string;
}

function trimData(months: string[], ...series: (number | null)[][]) {
    const start = months.findIndex((_, i) => series.some((s) => (s[i] ?? 0) !== 0));
    const idx = start >= 0 ? start : months.length;
    return {
        months: months.slice(idx),
        data: series.map((s) => s.slice(idx)),
    };
}

const formatValue = (v: number) => v.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true });

const formatCompact = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return Math.round(v).toLocaleString("es-AR");
};

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const formatX = (v: string, mode?: ViewMode) => {
    const p = v.split("-");
    if (p.length === 2) {
        const month = parseInt(p[1]);
        if (month >= 1 && month <= 12) {
            if (mode === "monthly") return `${monthNames[month - 1]} '${p[0].slice(-2)}`;
            return monthNames[month - 1];
        }
    }
    return v;
};

function EvoChart({ xData, series, tooltipFormatter, yFormatter, yMax, gridTop, hiddenSeries, chartKey, viewMode }: {
    xData: string[];
    series: any[];
    tooltipFormatter: (params: TooltipParam[]) => string;
    yFormatter?: (v: number) => string;
    yMax?: number;
    gridTop?: number;
    hiddenSeries?: string[];
    chartKey?: string;
    viewMode?: ViewMode;
}) {
    const dense = xData.length > 14;
    const labelInterval = dense ? Math.ceil(xData.length / 14) : 0;
    const visibleSeries = hiddenSeries?.length ? series.filter((s) => !hiddenSeries.includes(s.name)) : series;
    return (
        <ReactECharts
            key={chartKey}
            option={{
                backgroundColor: "transparent",
                grid: { top: gridTop ?? 20, right: 20, bottom: 32, left: 48 },
                xAxis: {
                    type: "category",
                    data: xData,
                    axisLine: { lineStyle: { color: colors.fill } },
                    axisTick: { show: false },
                    axisLabel: { color: colors.fg.dim, fontSize: fonts.size.xs, interval: labelInterval, formatter: (v: string) => formatX(v, viewMode) },
                },
                yAxis: {
                    type: "value",
                    max: yMax,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: colors.fill, type: "dashed" } },
                    axisLabel: { color: colors.fg.dim, fontSize: fonts.size.xs, formatter: yFormatter ?? ((v: number) => formatCompact(v)) },
                },
                tooltip: {
                    trigger: "axis",
                    backgroundColor: colors.bg.header,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: [6, 10],
                    textStyle: { color: colors.fg.base, fontSize: fonts.size["2xs"] },
                    formatter: tooltipFormatter,
                    extraCssText: `outline:1px solid ${colors.fill};border-radius:8px;box-shadow:none;`,
                },
                series: visibleSeries,
            }}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "svg" }}
        />
    );
}

const groups = [
    {
        id: "cashflow-annual",
        label: "Cash Flow & Anual",
        charts: [
            { id: "cashflow", title: "Cash Flow Mensual", desc: "Ingresos vs gastos por mes.", legend: [{ label: "Ingresos", color: colors.accent.green }, { label: "Gastos", color: colors.accent.red }] },
            { id: "savings-rate", title: "Savings Rate", desc: "Porcentaje ahorrado cada mes.", legend: [{ label: "50%", color: colors.fg.dim, style: "line" as const }] },
            { id: "annual-area", title: "Acumulado Anual", desc: "Tendencia acumulada del año.", legend: [{ label: "Ingresos", color: colors.accent.green }, { label: "Gastos", color: colors.accent.red }, { label: "Ahorro", color: colors.accent.cyan }] },
        ],
    },
    {
        id: "capital-composition",
        label: "Capital & Composición",
        charts: [
            { id: "capital-growth", title: "Evolución del Capital", desc: "Patrimonio neto acumulado." },
            { id: "expense-fixed-vs-variable", title: "Gasto Fijo vs Variable", desc: "Composición del gasto mensual.", legend: [{ label: "Fijo", color: `${colors.accent.orange}B3` }, { label: "Variable", color: `${colors.accent.yellow}B3` }] },
            { id: "income-fixed-vs-variable", title: "Ingreso Fijo vs Variable", desc: "Composición del ingreso mensual.", legend: [{ label: "Fijo", color: `${colors.accent.green}B3` }, { label: "Variable", color: `${colors.accent.green}50` }] },
        ],
    },
    {
        id: "real-vs-plan",
        label: "Real vs Plan",
        charts: [
            { id: "real-vs-plan-capital", title: "Capital — Real vs Plan", desc: "Real, plan, forecast y año anterior.", legend: [{ label: "Real", color: colors.accent.blue }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
            { id: "real-vs-plan-savings", title: "Ahorro — Real vs Plan", desc: "Real, plan, forecast y año anterior.", legend: [{ label: "Real", color: colors.accent.cyan }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
            { id: "real-vs-plan-income", title: "Ingresos — Real vs Plan", desc: "Real, plan, forecast y año anterior.", legend: [{ label: "Real", color: colors.accent.green }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
            { id: "real-vs-plan-expense", title: "Gastos — Real vs Plan", desc: "Real, plan, forecast y año anterior.", legend: [{ label: "Real", color: colors.accent.red }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
        ],
    },
    {
        id: "expense-breakdown",
        label: "Gastos",
        charts: [
            { id: "expense-by-category", title: "Distribución por Categoría", desc: "Gastos del último mes agrupados por categoría y subcategoría." },
            { id: "expense-by-channel", title: "Distribución por Canal", desc: "Gastos del último mes agrupados por canal y cuenta." },
        ],
    },
];

export function EvolutionPage() {
    const { data, isLoading: dashLoading } = useDashboard();
    const currentYear = new Date().getFullYear();
    const { data: metrics } = useDashboardMetrics(currentYear);
    const dimParams = useMemo(() => ({ type: "expense" as const }), []);
    const { data: expenseByCategory } = useDimensionSeries("category", dimParams);
    const { data: expenseByChannel } = useDimensionSeries("channel", dimParams);
    const [groupIdx, setGroupIdx] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>("current_year");
    const [hiddenSeries, setHiddenSeries] = useState<Record<string, string[]>>({});
    const [expenseYear, setExpenseYear] = useState(String(new Date().getFullYear()));
    const [expenseMonth, setExpenseMonth] = useState("all");
    const [modalChartId, setModalChartId] = useState<string | null>(null);
    useEffect(() => {
        if (!modalChartId) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalChartId(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [modalChartId]);
    const toggleSeries = (chartId: string, name: string) => {
        setHiddenSeries((prev) => {
            const current = prev[chartId] ?? [];
            const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
            return { ...prev, [chartId]: next };
        });
    };

    const monthlySeries: MonthlyData[] = data?.monthlySeries || [];

    const yearAgg = useMemo(() => {
        const byYear: Record<string, MonthlyData[]> = {};
        for (const m of monthlySeries) {
            const y = m.month.split("-")[0];
            if (!byYear[y]) byYear[y] = [];
            byYear[y].push(m);
        }
        const years = Object.keys(byYear).sort();
        return {
            months: years,
            income: years.map((y) => byYear[y].reduce((s, m) => s + m.income, 0)),
            expense: years.map((y) => byYear[y].reduce((s, m) => s + m.expense, 0)),
            capital: years.map((y) => byYear[y][byYear[y].length - 1].capital),
            savings: years.map((y) => byYear[y].reduce((s, m) => s + m.savings, 0)),
            expenseFixed: years.map((y) => byYear[y].reduce((s, m) => s + (m.expenseFixed ?? 0), 0)),
            expenseVariable: years.map((y) => byYear[y].reduce((s, m) => s + (m.expenseVariable ?? 0), 0)),
            incomeFixed: years.map((y) => byYear[y].reduce((s, m) => s + (m.incomeFixed ?? 0), 0)),
            incomeVariable: years.map((y) => byYear[y].reduce((s, m) => s + (m.incomeVariable ?? 0), 0)),
        };
    }, [monthlySeries]);

    const filteredSeries = useMemo(() => {
        if (viewMode === "current_year") {
            return monthlySeries.filter((m) => m.month.startsWith(String(currentYear)));
        }
        if (viewMode === "monthly") return monthlySeries;
        return [];
    }, [monthlySeries, currentYear, viewMode]);

    const isMonthly = viewMode !== "ytd";

    const dataStart = useMemo(() => {
        const base = isMonthly ? filteredSeries : yearAgg.months.map((y, i) => ({
            month: y, income: yearAgg.income[i], expense: yearAgg.expense[i],
            capital: yearAgg.capital[i], savings: yearAgg.savings[i],
        }));
        const idx = base.findIndex(
            (m) => m.income !== 0 || m.expense !== 0 || m.capital !== 0 || m.savings !== 0,
        );
        return idx >= 0 ? idx : 0;
    }, [isMonthly, filteredSeries, yearAgg]);

    const months = useMemo(() => {
        if (!isMonthly) return yearAgg.months.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.month);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.months]);
    const income = useMemo(() => {
        if (!isMonthly) return yearAgg.income.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.income);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.income]);
    const expense = useMemo(() => {
        if (!isMonthly) return yearAgg.expense.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.expense);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.expense]);
    const capital = useMemo(() => {
        if (!isMonthly) return yearAgg.capital.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.capital);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.capital]);
    const savings = useMemo(() => {
        if (!isMonthly) return yearAgg.savings.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.savings);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.savings]);
    const expenseFixed = useMemo(() => {
        if (!isMonthly) return yearAgg.expenseFixed.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.expenseFixed);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.expenseFixed]);
    const expenseVariable = useMemo(() => {
        if (!isMonthly) return yearAgg.expenseVariable.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.expenseVariable);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.expenseVariable]);
    const incomeFixed = useMemo(() => {
        if (!isMonthly) return yearAgg.incomeFixed.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.incomeFixed);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.incomeFixed]);
    const incomeVariable = useMemo(() => {
        if (!isMonthly) return yearAgg.incomeVariable.slice(dataStart);
        return filteredSeries.slice(dataStart).map((m) => m.incomeVariable);
    }, [isMonthly, filteredSeries, dataStart, yearAgg.incomeVariable]);
    const savingsRate = useMemo(() => income.map((v, i) => (v > 0 ? (savings[i] / v) * 100 : 0)), [income, savings]);

    const seriesColors: Record<string, string> = {
        Real: colors.accent.blue,
        FCST: colors.accent.orange,
        Plan: colors.accent.purple,
        LY: colors.fg.dim,
    };



    const mkMultiSeries = (metricMonths: MetricCell[] | undefined, realColor: string) =>
        (["Real", "FCST", "Plan", "LY"] as const).map((name) => ({
            name,
            data: metricMonths?.map((m) => {
                if (name === "Real") return m.real ?? null;
                if (name === "FCST") return m.fcst ?? null;
                if (name === "Plan") return m.plan ?? null;
                return m.ly ?? null;
            }) ?? [],
            color: name === "Real" ? realColor : seriesColors[name],
        }));

    const cumulativeIncome = useMemo(() => {
        let sum = 0; return income.map((v) => { sum += v; return sum; });
    }, [income]);
    const cumulativeExpense = useMemo(() => {
        let sum = 0; return expense.map((v) => { sum += v; return sum; });
    }, [expense]);
    const cumulativeSavings = useMemo(() => {
        let sum = 0; return savings.map((v) => { sum += v; return sum; });
    }, [savings]);

    if (dashLoading) {
        return <div style={{ padding: spacing[4], color: colors.fg.dim }}>Cargando evolución...</div>;
    }
    if (!data || monthlySeries.length === 0) {
        return <div style={{ padding: spacing[4], color: colors.fg.dim }}>Sin datos suficientes</div>;
    }

    const card: React.CSSProperties = {
        backgroundColor: colors.bg.surface,
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
    };

    const chartHeader: React.CSSProperties = {
        fontSize: fonts.size.sm,
        fontWeight: 600,
        color: colors.fg.base,
        padding: `${spacing[2]} ${spacing[3]}`,
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
    };

    const paginate = (dir: number) => {
        setGroupIdx((prev) => (prev + dir + groups.length) % groups.length);
    };

    function renderChart(chartId: string, hidden: string[] = []) {
        const emptyMsg = (msg: string) => (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: spacing[4] }}>
                <span style={{ fontSize: fonts.size.sm, color: colors.fg.dim, textAlign: "center" }}>{msg}</span>
            </div>
        );

        if (months.length < 2 && isMonthly && !["expense-by-category", "expense-by-channel"].includes(chartId)) {
            return emptyMsg("Se necesitan al menos 2 meses de datos");
        }

        switch (chartId) {
            case "cashflow": {
                return (
                    <EvoChart
                        xData={months}
                        series={[
                            { type: "bar", data: income, name: "Ingresos", stack: "a", itemStyle: { color: `${colors.accent.green}B3`, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 16, barGap: "30%", animationDuration: 600, animationEasing: "cubicOut" },
                            { type: "bar", data: expense.map((v) => -v), name: "Gastos", stack: "a", itemStyle: { color: `${colors.accent.red}B3`, borderRadius: [0, 0, 4, 4] }, barMaxWidth: 16, barGap: "30%", animationDuration: 600, animationEasing: "cubicOut" },
                        ]}
                        tooltipFormatter={(params) => {
                            const inc = params.find((p) => p.seriesName === "Ingresos")?.value ?? 0;
                            const exp = params.find((p) => p.seriesName === "Gastos")?.value ?? 0;
                            const net = inc - exp;
                            const ahorro = inc + exp;
                            return `
                                <div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", viewMode)}</div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.green}"></span>Ingresos: <b>${formatCompact(inc)}</b></div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.red}"></span>Gastos: <b>${formatCompact(exp)}</b></div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.purple}"></span>Neto: <b>${formatCompact(net)}</b></div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.cyan}"></span>Ahorro: <b>${formatCompact(ahorro)}</b></div>
                            `;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "savings-rate":
                return (
                    <EvoChart
                        xData={months}
                        series={[{
                            type: "line", data: savingsRate,
                            smooth: true, symbol: "circle", symbolSize: 4,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            animationDuration: 600, animationEasing: "cubicOut",
                            lineStyle: { color: colors.accent.cyan, width: 2.5 },
                            itemStyle: { color: colors.accent.cyan },
                            areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.cyan}30` }, { offset: 1, color: `${colors.accent.cyan}00` }] } },
                            markLine: {
                                silent: true,
                                data: [{ yAxis: 50, label: { show: false }, lineStyle: { color: colors.fg.dim, type: "dashed" } }],
                                symbol: "none",
                            },
                        }]}
                        yFormatter={(v) => `${formatValue(v)}%`}
                        yMax={100}
                        tooltipFormatter={(params) =>
                            `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", viewMode)}</div><span style="font-size:12px"><b>${formatValue(params[0]?.value)}%</b> de ahorro</span>`
                        }
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );

            case "capital-growth":
                return (
                    <EvoChart
                        xData={months}
                        series={[{
                            type: "line", data: capital,
                            smooth: true, symbol: "circle", symbolSize: 4,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            animationDuration: 600, animationEasing: "cubicOut",
                            lineStyle: { color: colors.accent.blue, width: 2.5 },
                            itemStyle: { color: colors.accent.blue },
                            areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.blue}30` }, { offset: 1, color: `${colors.accent.blue}00` }] } },
                        }]}
                        tooltipFormatter={(params) =>
                            `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", viewMode)}</div><span style="font-size:12px"><b>${formatCompact(params[0]?.value ?? 0)}</b></span>`
                        }
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            case "expense-fixed-vs-variable": {
                const { months: expMonths, data: [expFix, expVar] } = trimData(months, expenseFixed, expenseVariable);
                return (
                    <EvoChart
                        xData={expMonths}
                        series={[
                            { type: "bar", data: expFix, name: "Fijo", stack: "exp", itemStyle: { color: `${colors.accent.orange}B3` }, barMaxWidth: 16, barGap: "30%", animationDuration: 600, animationEasing: "cubicOut" },
                            { type: "bar", data: expVar, name: "Variable", stack: "exp", itemStyle: { color: `${colors.accent.yellow}B3` }, barMaxWidth: 16, barGap: "30%", animationDuration: 600, animationEasing: "cubicOut" },
                        ]}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", viewMode)}</div>`;
                            params.forEach((p) => {
                                html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: <b>${formatCompact(p.value)}</b></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "income-fixed-vs-variable": {
                const { months: incMonths, data: [incFix, incVar] } = trimData(months, incomeFixed, incomeVariable);
                return (
                    <EvoChart
                        xData={incMonths}
                        series={[
                            { type: "bar", data: incFix, name: "Fijo", stack: "inc", itemStyle: { color: `${colors.accent.green}B3` }, barMaxWidth: 16, barGap: "30%", animationDuration: 600, animationEasing: "cubicOut" },
                            { type: "bar", data: incVar, name: "Variable", stack: "inc", itemStyle: { color: `${colors.accent.green}50` }, barMaxWidth: 16, barGap: "30%", animationDuration: 600, animationEasing: "cubicOut" },
                        ]}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", viewMode)}</div>`;
                            params.forEach((p) => {
                                html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: <b>${formatCompact(p.value)}</b></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-capital": {
                const m = metrics?.capital?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.blue);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); return d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); });
                return (
                    <EvoChart
                        xData={labels}
                        series={multi.map((s) => ({
                            name: s.name, data: s.data, type: "line",
                            smooth: true, symbol: "circle", symbolSize: 6,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            lineStyle: { color: s.color, width: s.name === "Real" ? 2.5 : 1.5 },
                            itemStyle: { color: s.color, borderWidth: 0 },
                            areaStyle: s.name === "Real" ? { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${s.color}30` }, { offset: 1, color: `${s.color}00` }] } } : undefined,
                        }))}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, viewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${Math.round(p.value).toLocaleString("es-AR")}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-savings": {
                const m = metrics?.savings?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.cyan);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); return d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); });
                return (
                    <EvoChart
                        xData={labels}
                        series={multi.map((s) => ({
                            name: s.name, data: s.data, type: "line",
                            smooth: true, symbol: "circle", symbolSize: 6,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            lineStyle: { color: s.color, width: s.name === "Real" ? 2.5 : 1.5 },
                            itemStyle: { color: s.color, borderWidth: 0 },
                            areaStyle: s.name === "Real" ? { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${s.color}30` }, { offset: 1, color: `${s.color}00` }] } } : undefined,
                        }))}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, viewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${Math.round(p.value).toLocaleString("es-AR")}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-income": {
                const m = metrics?.income?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.green);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); return d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); });
                return (
                    <EvoChart
                        xData={labels}
                        series={multi.map((s) => ({
                            name: s.name, data: s.data, type: "line",
                            smooth: true, symbol: "circle", symbolSize: 6,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            lineStyle: { color: s.color, width: s.name === "Real" ? 2.5 : 1.5 },
                            itemStyle: { color: s.color, borderWidth: 0 },
                            areaStyle: s.name === "Real" ? { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${s.color}30` }, { offset: 1, color: `${s.color}00` }] } } : undefined,
                        }))}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, viewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${Math.round(p.value).toLocaleString("es-AR")}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-expense": {
                const m = metrics?.expense?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.red);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); return d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); });
                return (
                    <EvoChart
                        xData={labels}
                        series={multi.map((s) => ({
                            name: s.name, data: s.data, type: "line",
                            smooth: true, symbol: "circle", symbolSize: 6,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            lineStyle: { color: s.color, width: s.name === "Real" ? 2.5 : 1.5 },
                            itemStyle: { color: s.color, borderWidth: 0 },
                            areaStyle: s.name === "Real" ? { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${s.color}30` }, { offset: 1, color: `${s.color}00` }] } } : undefined,
                        }))}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, viewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${Math.round(p.value).toLocaleString("es-AR")}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "annual-area": {
                return (
                    <EvoChart
                        xData={months}
                        series={[
                            { type: "line", data: cumulativeIncome, name: "Ingresos", smooth: true, symbol: "circle", symbolSize: 4, showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 }, animationDuration: 600, animationEasing: "cubicOut", lineStyle: { color: colors.accent.green, width: 2 }, itemStyle: { color: colors.accent.green }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.green}30` }, { offset: 1, color: `${colors.accent.green}00` }] } } },
                            { type: "line", data: cumulativeExpense, name: "Gastos", smooth: true, symbol: "circle", symbolSize: 4, showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 }, animationDuration: 600, animationEasing: "cubicOut", lineStyle: { color: colors.accent.red, width: 2 }, itemStyle: { color: colors.accent.red }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.red}30` }, { offset: 1, color: `${colors.accent.red}00` }] } } },
                            { type: "line", data: cumulativeSavings, name: "Ahorro", smooth: true, symbol: "circle", symbolSize: 4, showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 }, animationDuration: 600, animationEasing: "cubicOut", lineStyle: { color: colors.accent.cyan, width: 2 }, itemStyle: { color: colors.accent.cyan }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.cyan}30` }, { offset: 1, color: `${colors.accent.cyan}00` }] } } },
                        ]}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", viewMode)}</div>`;
                            params.forEach((p) => {
                                html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: <b>${formatCompact(p.value)}</b></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={viewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "expense-by-category":
            case "expense-by-channel": {
                const dimData = chartId === "expense-by-category" ? expenseByCategory : expenseByChannel;
                if (!dimData || !dimData.data.length) return emptyMsg("Sin datos");
                const allDataMonths = [...new Set(dimData.data.flatMap((s) => s.data.map((d) => d.month)))].sort();
                const targetMonths = expenseMonth === "all"
                    ? allDataMonths.filter((m) => m.startsWith(expenseYear))
                    : allDataMonths.filter((m) => m === `${expenseYear}-${expenseMonth}`);
                const items = dimData.data
                    .map((g) => {
                        const pts = g.data.filter((d) => targetMonths.includes(d.month));
                        const total = pts.reduce((s, d) => s + d.value, 0);
                        const compMap: Record<string, number> = {};
                        pts.forEach((d) => d.composition?.forEach((c) => { compMap[c.key] = (compMap[c.key] || 0) + c.value; }));
                        return { name: g.key, total, composition: compMap };
                    })
                    .filter((g) => g.total > 0)
                    .sort((a, b) => b.total - a.total);
                if (!items.length) return emptyMsg("Sin datos");
                const subKeys = [...new Set(items.flatMap((g) => Object.keys(g.composition).filter((k) => g.composition[k] > 0)))].sort((a, b) => {
                    const ta = items.reduce((s, g) => s + (g.composition[a] ?? 0), 0);
                    const tb = items.reduce((s, g) => s + (g.composition[b] ?? 0), 0);
                    return tb - ta;
                });
                const catPalette = [colors.accent.blue, colors.accent.green, colors.accent.orange, colors.accent.red, colors.accent.purple, colors.accent.cyan, colors.accent.teal, "#6c5ce7", "#e17055", "#e84393"];
                const shade = (hex: string, f: number) => {
                    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                    const c = Math.max(0, Math.min(1, f));
                    return `rgb(${Math.round(r * c)},${Math.round(g * c)},${Math.round(b * c)})`;
                };
                const catBase = items.map((_, i) => catPalette[i % catPalette.length]);
                const subColor: Record<string, string> = {};
                subKeys.forEach((k) => {
                    const pi = items.findIndex((g) => g.composition[k] > 0);
                    const base = pi >= 0 ? catBase[pi] : colors.fg.dim;
                    const siblings = subKeys.filter((sk) => items[pi]?.composition[sk] > 0);
                    const si = siblings.indexOf(k);
                    subColor[k] = shade(base, 0.45 + (si / Math.max(siblings.length - 1, 1)) * 0.55);
                });
                const series = subKeys.map((name) => ({
                    name,
                    type: "bar",
                    stack: "total",
                    data: items.map((g) => g.composition[name] ?? 0),
                    itemStyle: { color: subColor[name], borderRadius: 0 },
                    label: { show: false },
                    emphasis: { itemStyle: { color: subColor[name] }, label: { show: false } },
                }));
                return (
                    <ReactECharts
                        option={{
                            backgroundColor: "transparent",
                            grid: { top: 6, right: 80, bottom: 8, left: 100, containLabel: true },
                            xAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: colors.fill, type: "dashed" } }, axisLabel: { color: colors.fg.dim, fontSize: fonts.size.xs, formatter: (v: number) => formatCompact(v) } },
                            yAxis: { type: "category", data: items.map((g) => g.name), axisLine: { lineStyle: { color: colors.fill } }, axisTick: { show: false }, axisLabel: { color: colors.fg.base, fontSize: fonts.size.xs } },
                            tooltip: {
                                trigger: "axis",
                                axisPointer: { type: "shadow" },
                                backgroundColor: colors.bg.header,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: [6, 10],
                                textStyle: { color: colors.fg.base, fontSize: fonts.size["2xs"] },
                                formatter: (params: TooltipParam[]) => {
                                    const cat = params[0].name;
                                    const entry = items.find((g) => g.name === cat);
                                    if (!entry) return "";
                                    let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${cat}</div>`;
                                    Object.entries(entry.composition)
                                        .filter(([, v]) => v > 0)
                                        .sort(([, a], [, b]) => b - a)
                                        .forEach(([key, val]) => {
                                            html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${subColor[key]}"></span>${key}: <b>${formatCompact(val)}</b></div>`;
                                        });
                                    html += `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;padding-top:4px;border-top:1px solid ${colors.fill};font-size:12px">Total: <b>${formatCompact(entry.total)}</b></div>`;
                                    return html;
                                },
                                extraCssText: `outline:1px solid ${colors.fill};border-radius:8px;box-shadow:none;`,
                            },
                            series,
                        }}
                        style={{ height: "100%", width: "100%" }}
                        opts={{ renderer: "svg" }}
                        key={`${chartId}-${expenseYear}-${expenseMonth}`}
                    />
                );
            }
            default:
                return null;
        }
    }

    return (
        <>
        <div
            style={{
                padding: spacing[3],
                display: "flex",
                flexDirection: "column",
                gap: spacing[3],
                maxHeight: "calc(100vh - 80px)",
                boxSizing: "border-box",
                overflow: "auto",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.xl,
                            fontWeight: fonts.weight.semibold,
                            color: colors.fg.base,
                            margin: 0,
                            marginBottom: spacing[1],
                        }}
                    >
                        Evolución
                    </h1>
                    <p
                        style={{
                            fontFamily: fonts.family.text,
                            fontSize: fonts.size.sm,
                            color: colors.fg.dim,
                            margin: 0,
                        }}
                    >
                        {groups[groupIdx].label}
                    </p>
                </div>
                {groups[groupIdx].id !== "real-vs-plan" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[1],
                    position: "relative",
                    borderRadius: "8px",
                    background: colors.fill,
                    overflow: "hidden",
                    cursor: "pointer",
                    userSelect: "none",
                }}>
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: `calc(${["current_year", "ytd", "monthly"].indexOf(viewMode)} * (100% / 3))`,
                        width: "calc(100% / 3)",
                        height: "100%",
                        borderRadius: "7px",
                        background: colors.bg.surface,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
                        transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        pointerEvents: "none",
                    }} />
                    {[
                        { key: "current_year" as ViewMode, label: "YTD" },
                        { key: "ytd" as ViewMode, label: "YoY" },
                        { key: "monthly" as ViewMode, label: "MoM" },
                    ].map((m) => (
                        <div
                            key={m.key}
                            onClick={() => setViewMode(m.key)}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: 1,
                                padding: "3px 10px",
                                whiteSpace: "nowrap",
                                fontSize: fonts.size.xs,
                                fontWeight: 500,
                                color: viewMode === m.key ? colors.fg.base : colors.fg.dim,
                                transition: "color 0.2s",
                                lineHeight: "18px",
                            }}
                        >
                            {m.label}
                        </div>
                    ))}
                </div>
                )}
            </div>

            {data && (
                <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap", flexShrink: 0 }}>
                    {([
                        { label: "Margen Ahorro", value: `${formatValue(data.currentYtd.SavingsMargin * 100)}%`, color: data.currentYtd.SavingsMargin >= 0 ? colors.accent.green : colors.accent.red },
                        { label: "Gasto Core", value: formatCompact(data.currentYtd.CoreBurnRate), color: colors.fg.base },
                        { label: "Cobertura", value: `${formatValue(data.currentYtd.ExpenseCoverageMonths)}m`, color: colors.accent.cyan },
                        { label: "Crecimiento YTD", value: `${formatValue(data.currentYtd.CapitalGrowthRateYTD * 100)}%`, color: data.currentYtd.CapitalGrowthRateYTD >= 0 ? colors.accent.green : colors.accent.red },
                        { label: "Ahorro Promedio", value: formatCompact(data.currentYtd.AvgMonthlySavings), color: colors.accent.cyan },
                        { label: "Flexibilidad", value: `${formatValue(data.currentYtd.FinancialFlexibility * 100)}%`, color: colors.accent.cyan },
                        { label: "Ratio Costos Fijos", value: `${formatValue(data.currentYtd.FixedCostRatio * 100)}%`, color: colors.accent.orange },
                        { label: "Cobertura Ingreso", value: `${formatValue(data.currentYtd.StableIncomeCoverage)}x`, color: data.currentYtd.StableIncomeCoverage >= 1 ? colors.accent.green : colors.accent.red },
                    ] as const).map((kpi) => (
                        <div key={kpi.label} style={{ display: "flex", alignItems: "center", gap: spacing[1], backgroundColor: colors.fill, borderRadius: radius.md, padding: `${spacing[1]} ${spacing[2]}`, flexShrink: 0 }}>
                            <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim, whiteSpace: "nowrap" }}>{kpi.label}</span>
                            <span style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: kpi.color, fontWeight: 700, whiteSpace: "nowrap" }}>{kpi.value}</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: spacing[3], flexShrink: 0 }}>
                <button
                    onClick={() => paginate(-1)}
                    style={{
                        background: "none",
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        color: colors.fg.dim,
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
                >
                    <ChevronLeft size={18} />
                </button>

                {groups.map((g, i) => (
                    <button
                        key={g.id}
                        onClick={() => setGroupIdx(i)}
                        style={{
                            background: groupIdx === i ? colors.fill : "transparent",
                            border: "none",
                            borderRadius: radius.md,
                            padding: `${spacing[1]} ${spacing[2]}`,
                            fontSize: fonts.size.sm,
                            fontWeight: groupIdx === i ? 600 : 400,
                            color: groupIdx === i ? colors.fg.base : colors.fg.dim,
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {g.label}
                    </button>
                ))}

                <button
                    onClick={() => paginate(1)}
                    style={{
                        background: "none",
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        color: colors.fg.dim,
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {groups[groupIdx].id === "expense-breakdown" && (
                <div style={{ display: "flex", gap: spacing[2], alignItems: "center", flexShrink: 0 }}>
                    <Dropdown
                        value={expenseYear}
                        onChange={setExpenseYear}
                        options={expenseByCategory ? [...new Set(expenseByCategory.data.flatMap((s) => s.data.map((d) => d.month.split("-")[0])))].sort().reverse().map((y) => ({ id: y, label: y })) : []}
                        triggerStyle={{ height: "32px", width: "80px", fontSize: fonts.size.sm } as React.CSSProperties}
                    />
                    <Dropdown
                        value={expenseMonth}
                        onChange={setExpenseMonth}
                        options={[{ id: "all", label: "Todo el año" }, ...["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((name, i) => ({ id: String(i + 1).padStart(2, "0"), label: name }))]}
                        triggerStyle={{ height: "32px", width: "140px", fontSize: fonts.size.sm } as React.CSSProperties}
                    />
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3], flex: 1, minHeight: 0 }}>
                {groups[groupIdx].charts.map((ch: { id: string; title: string; desc?: string; legend?: { label: string; color: string }[] }) => (
                    <div key={ch.id} style={card}>
                        <div style={{ ...chartHeader, display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing[2] }}>
                                <span>{ch.title}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: spacing[1] }}>
                                    <button
                                        onClick={() => setModalChartId(ch.id)}
                                        title="Expandir"
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: colors.fg.dim,
                                            borderRadius: radius.sm,
                                            transition: "all 0.15s",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
                                    >
                                        <Maximize2 size={14} />
                                    </button>
                                {ch.legend && (
                                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap", justifyContent: "flex-end" }}>
                                        {ch.legend.map((l: { label: string; color: string; style?: "line" }) => {
                                            const isHidden = hiddenSeries[ch.id]?.includes(l.label);
                                            return (
                                                <div key={l.label} onClick={l.style === "line" ? undefined : () => toggleSeries(ch.id, l.label)} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: fonts.size.xs, color: isHidden ? colors.fg.dim : undefined, cursor: l.style === "line" ? "default" : "pointer", opacity: isHidden ? 0.45 : 1, transition: "opacity 0.15s" }}>
                                                    {l.style === "line" ? (
                                                        <span style={{ display: "inline-block", width: 14, height: 0, borderTop: `1.5px dashed ${l.color}`, flexShrink: 0 }} />
                                                    ) : (
                                                        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                                                    )}
                                                    {l.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                </div>
                            </div>
                            {ch.desc && <span style={{ fontSize: fonts.size.xs, fontWeight: 400, color: colors.fg.dim }}>{ch.desc}</span>}
                        </div>
                        <div style={{ height: "312px", flexShrink: 0 }}>
                            {renderChart(ch.id, hiddenSeries[ch.id] ?? [])}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {modalChartId && (() => {
            const chart = groups.flatMap((g) => g.charts).find((c) => c.id === modalChartId)!;
            return (
                <div
                    onClick={() => setModalChartId(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: colors.bg.surface,
                            borderRadius: radius.lg,
                            border: `1px solid ${colors.border}`,
                                width: "90vw",
                                height: "70vh",
                                maxWidth: 1200,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{
                            ...chartHeader,
                            display: "flex",
                            flexDirection: "column",
                            gap: spacing[2],
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <span>{chart.title}</span>
                                    {chart.desc && <span style={{ fontSize: fonts.size.xs, fontWeight: 400, color: colors.fg.dim, marginLeft: spacing[2] }}>{chart.desc}</span>}
                                </div>
                                <button
                                    onClick={() => setModalChartId(null)}
                                    title="Cerrar"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: colors.fg.dim,
                                        borderRadius: radius.sm,
                                        transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing[2], flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                                {["expense-by-category", "expense-by-channel"].includes(modalChartId) ? (
                                    <>
                                    <Dropdown
                                        value={expenseYear}
                                        onChange={setExpenseYear}
                                        options={expenseByCategory ? [...new Set(expenseByCategory.data.flatMap((s) => s.data.map((d) => d.month.split("-")[0])))].sort().reverse().map((y) => ({ id: y, label: y })) : []}
                                        triggerStyle={{ height: "28px", width: "80px", fontSize: fonts.size.xs } as React.CSSProperties}
                                    />
                                    <Dropdown
                                        value={expenseMonth}
                                        onChange={setExpenseMonth}
                                        options={[{ id: "all", label: "Todo el año" }, ...["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((name, i) => ({ id: String(i + 1).padStart(2, "0"), label: name }))]}
                                        triggerStyle={{ height: "28px", width: "130px", fontSize: fonts.size.xs } as React.CSSProperties}
                                    />
                                    </>
                                ) : (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        borderRadius: "6px",
                                        background: colors.fill,
                                        overflow: "hidden",
                                        flexShrink: 0,
                                    }}>
                                        {[
                                            { key: "current_year" as ViewMode, label: "YTD" },
                                            { key: "ytd" as ViewMode, label: "YoY" },
                                            { key: "monthly" as ViewMode, label: "MoM" },
                                        ].map((m) => (
                                            <div
                                                key={m.key}
                                                onClick={() => setViewMode(m.key)}
                                                style={{
                                                    padding: "2px 8px",
                                                    fontSize: fonts.size.xs,
                                                    fontWeight: 500,
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
                                )}
                                </div>
                                {chart.legend && (
                                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap", alignItems: "center" }}>
                                        {chart.legend.map((l: { label: string; color: string; style?: "line" }) => {
                                            const isHidden = hiddenSeries[modalChartId]?.includes(l.label);
                                            return (
                                                <div
                                                    key={l.label}
                                                    onClick={l.style === "line" ? undefined : () => toggleSeries(modalChartId, l.label)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 3,
                                                        fontSize: fonts.size.xs,
                                                        color: isHidden ? colors.fg.dim : undefined,
                                                        cursor: l.style === "line" ? "default" : "pointer",
                                                        opacity: isHidden ? 0.45 : 1,
                                                        transition: "opacity 0.15s",
                                                    }}
                                                >
                                                    {l.style === "line" ? (
                                                        <span style={{ display: "inline-block", width: 14, height: 0, borderTop: `1.5px dashed ${l.color}`, flexShrink: 0 }} />
                                                    ) : (
                                                        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                                                    )}
                                                    {l.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            {renderChart(modalChartId, hiddenSeries[modalChartId] ?? [])}
                        </div>
                    </div>
                </div>
            );
        })()}
        </>
    );
}
