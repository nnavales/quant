import { useState, useMemo } from "react";
import { spacing, radius } from "@/styles/theme";
import { formatNumber } from "@/utils/format";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { useDashboard, useDashboardMetrics, useDimensionSeries } from "@/hooks";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { ModalCloseButton } from "@/components/ui/Modal";
import { Maximize2, BarChart3, GitCompare, PieChart } from "lucide-react";
import { chipTriggerStyle } from "@/styles/filters";
import ReactECharts from "echarts-for-react";
import type { MetricCell, MonthlyData } from "@/api_client/types";
import { flexBetween, flexColumn, flexRow } from "@/styles/layout";

type ViewMode = "current_year" | "ytd" | "monthly";

interface TooltipParam {
    name: string;
    seriesName: string;
    value: number;
    color: string;
}

interface ChartSeries {
    type: string;
    name?: string;
    data: (number | null)[];
    [key: string]: unknown;
}

type ChartPoint = Pick<MonthlyData, "income" | "expense" | "capital" | "savings">;

function trimData(months: string[], ...series: (number | null)[][]) {
    const start = months.findIndex((_, i) => series.some((s) => (s[i] ?? 0) !== 0));
    const idx = start >= 0 ? start : months.length;
    return {
        months: months.slice(idx),
        data: series.map((s) => s.slice(idx)),
    };
}

const formatValue = (v: number) => formatNumber(v, { trim: true });

const formatCompact = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return formatNumber(Math.round(v), { decimals: 0 });
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
    series: ChartSeries[];
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
    const visibleSeries = hiddenSeries?.length ? series.filter((s) => !hiddenSeries.includes(s.name ?? "")) : series;
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
                    backgroundColor: colors.bg.elevated,
                    borderColor: colors.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    padding: [6, 10],
                    textStyle: { color: colors.fg.base, fontSize: fonts.size.xs },
                    formatter: tooltipFormatter,
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
        id: "cashflow-capital",
        label: "Cash Flow & Capital",
        charts: [
            { id: "cashflow", title: "Cash Flow", desc: "Ingresos vs egresos.", legend: [{ label: "Ingresos", color: colors.accent.green }, { label: "Egresos", color: colors.accent.red }] },
            { id: "savings-rate", title: "Savings Rate", desc: "Porcentaje ahorrado.", legend: [{ label: "50%", color: colors.fg.dim, style: "line" as const }] },
            { id: "annual-area", title: "Acumulado", desc: "Tendencia acumulada.", legend: [{ label: "Ingresos", color: colors.accent.green }, { label: "Egresos", color: colors.accent.red }, { label: "Ahorro", color: colors.accent.cyan }] },
            { id: "capital-growth", title: "Evolución del Capital", desc: "Patrimonio neto acumulado." },
        ],
    },
    {
        id: "real-vs-plan",
        label: "Real vs Planning vs LY",
        charts: [
            { id: "real-vs-plan-capital", title: "Capital", desc: "Real vs plan vs forecast vs LY.", legend: [{ label: "Real", color: colors.accent.blue }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
            { id: "real-vs-plan-savings", title: "Ahorro", desc: "Real vs plan vs forecast vs LY.", legend: [{ label: "Real", color: colors.accent.cyan }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
            { id: "real-vs-plan-income", title: "Ingresos", desc: "Real vs plan vs forecast vs LY.", legend: [{ label: "Real", color: colors.accent.green }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
            { id: "real-vs-plan-expense", title: "Egresos", desc: "Real vs plan vs forecast vs LY.", legend: [{ label: "Real", color: colors.accent.red }, { label: "FCST", color: colors.accent.orange }, { label: "Plan", color: colors.accent.purple }, { label: "LY", color: colors.fg.dim }] },
        ],
    },
    {
        id: "composition-detail",
        label: "Composición & Detalle",
        charts: [
            { id: "expense-fixed-vs-variable", title: "Egreso Fijo vs Variable", desc: "Composición del egreso.", legend: [{ label: "Fijo", color: `${colors.accent.red}` }, { label: "Variable", color: `${colors.accent.red}66` }] },
            { id: "income-fixed-vs-variable", title: "Ingreso Fijo vs Variable", desc: "Composición del ingreso.", legend: [{ label: "Fijo", color: `${colors.accent.green}B3` }, { label: "Variable", color: `${colors.accent.green}50` }] },
            { id: "expense-by-category", title: "Distribución por Categoría", desc: "Egresos agrupados por categoría y subcategoría." },
            { id: "expense-by-channel", title: "Distribución por Canal", desc: "Egresos agrupados por canal y cuenta." },
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
    const [hiddenSeries, setHiddenSeries] = useState<Record<string, string[]>>({});
    const [modalHiddenSeries, setModalHiddenSeries] = useState<Record<string, string[]>>({});
    const [modalViewMode, setModalViewMode] = useState<ViewMode>("current_year");
    const [modalExpenseYear, setModalExpenseYear] = useState(String(new Date().getFullYear()));
    const [modalExpenseMonth, setModalExpenseMonth] = useState("all");
    const [modalChartId, setModalChartId] = useState<string | null>(null);
    const toggleSeries = (chartId: string, name: string) => {
        setHiddenSeries((prev) => {
            const current = prev[chartId] ?? [];
            const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
            return { ...prev, [chartId]: next };
        });
    };
    const toggleModalSeries = (chartId: string, name: string) => {
        setModalHiddenSeries((prev) => {
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

    function computeChartData(vm: ViewMode) {
        const isMonth = vm !== "ytd";
        const filSeries = vm === "current_year"
            ? monthlySeries.filter((m) => m.month.startsWith(String(currentYear)))
            : vm === "monthly" ? monthlySeries : [];

        const dStart = (isMonth ? filSeries : yearAgg.months.map((y, i) => ({
            month: y, income: yearAgg.income[i], expense: yearAgg.expense[i],
            capital: yearAgg.capital[i], savings: yearAgg.savings[i],
        }))).findIndex(
            (m: ChartPoint) => m.income !== 0 || m.expense !== 0 || m.capital !== 0 || m.savings !== 0,
        );
        const startIdx = dStart >= 0 ? dStart : 0;

        const mons: string[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.month)
            : yearAgg.months.slice(startIdx);

        const inc: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.income)
            : yearAgg.income.slice(startIdx);

        const exp: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.expense)
            : yearAgg.expense.slice(startIdx);

        const cap: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.capital)
            : yearAgg.capital.slice(startIdx);

        const svgs: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.savings)
            : yearAgg.savings.slice(startIdx);

        const expFix: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.expenseFixed)
            : yearAgg.expenseFixed.slice(startIdx);

        const expVar: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.expenseVariable)
            : yearAgg.expenseVariable.slice(startIdx);

        const incFix: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.incomeFixed)
            : yearAgg.incomeFixed.slice(startIdx);

        const incVar: number[] = isMonth
            ? filSeries.slice(startIdx).map((m: MonthlyData) => m.incomeVariable)
            : yearAgg.incomeVariable.slice(startIdx);

        const MIN_INCOME = 100;
        const svgsRate = inc.map((v, i) => (v >= MIN_INCOME ? (svgs[i] / v) * 100 : null));

        const cumInc = (() => { let s = 0; return inc.map((v: number) => { s += v; return s; }); })();
        const cumExp = (() => { let s = 0; return exp.map((v: number) => { s += v; return s; }); })();
        const cumSvgs = (() => { let s = 0; return svgs.map((v: number) => { s += v; return s; }); })();

        return { months: mons, income: inc, expense: exp, capital: cap, savings: svgs, expenseFixed: expFix, expenseVariable: expVar, incomeFixed: incFix, incomeVariable: incVar, savingsRate: svgsRate, cumulativeIncome: cumInc, cumulativeExpense: cumExp, cumulativeSavings: cumSvgs, isMonthly: isMonth };
    }

    const pageData = useMemo(() => computeChartData("current_year"), [monthlySeries, currentYear, yearAgg]);
    const modalData = useMemo(() => computeChartData(modalViewMode), [monthlySeries, currentYear, modalViewMode, yearAgg]);

    const { months, income, expense, capital, expenseFixed, expenseVariable, incomeFixed, incomeVariable, savingsRate, cumulativeIncome, cumulativeExpense, cumulativeSavings } = pageData;

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

    const groupIcons: Record<string, React.ReactNode> = {
        "cashflow-capital": <BarChart3 size={14} strokeWidth={1.5} />,
        "real-vs-plan": <GitCompare size={14} strokeWidth={1.5} />,
        "composition-detail": <PieChart size={14} strokeWidth={1.5} />,
    };

    if (dashLoading) {
        return <div style={{ padding: spacing[4], color: colors.fg.dim }}>Cargando evolución...</div>;
    }

    const card: React.CSSProperties = {
        backgroundColor: colors.bg.surface,
        borderRadius: radius.lg,
        border: `1px solid transparent`,
        display: "flex",
        flexDirection: "column",
    };

    const chartHeader: React.CSSProperties = {
        fontSize: fonts.size.sm,
        fontWeight: fonts.weight.semibold,
        color: colors.fg.base,
        padding: `${spacing[2]} ${spacing[3]}`,
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
    };

    function renderChart(chartId: string, hidden: string[] = [], chartOpts?: {
        viewMode?: ViewMode;
        expenseYear?: string;
        expenseMonth?: string;
        months?: string[];
        income?: number[];
        expense?: number[];
        capital?: number[];
        savings?: number[];
        expenseFixed?: number[];
        expenseVariable?: number[];
        incomeFixed?: number[];
        incomeVariable?: number[];
        savingsRate?: (number | null)[];
        cumulativeIncome?: number[];
        cumulativeExpense?: number[];
        cumulativeSavings?: number[];
        isMonthly?: boolean;
    }) {
        const effMonths = chartOpts?.months ?? months;
        const effIncome = chartOpts?.income ?? income;
        const effExpense = chartOpts?.expense ?? expense;
        const effCapital = chartOpts?.capital ?? capital;
        const effExpenseFixed = chartOpts?.expenseFixed ?? expenseFixed;
        const effExpenseVariable = chartOpts?.expenseVariable ?? expenseVariable;
        const effIncomeFixed = chartOpts?.incomeFixed ?? incomeFixed;
        const effIncomeVariable = chartOpts?.incomeVariable ?? incomeVariable;
        const effSavingsRate = chartOpts?.savingsRate ?? savingsRate;
        const effCumulativeIncome = chartOpts?.cumulativeIncome ?? cumulativeIncome;
        const effCumulativeExpense = chartOpts?.cumulativeExpense ?? cumulativeExpense;
        const effCumulativeSavings = chartOpts?.cumulativeSavings ?? cumulativeSavings;
        const effViewMode = chartOpts?.viewMode ?? "current_year";
        const effExpenseYear = chartOpts?.expenseYear ?? String(currentYear);
        const effExpenseMonth = chartOpts?.expenseMonth ?? "all";
        const effIsMonthly = chartOpts?.isMonthly ?? true;

        const emptyMsg = (msg: string) => (
            <div style={{ flex: 1, ...flexRow, justifyContent: "center", padding: spacing[4] }}>
                <span style={{ fontSize: fonts.size.sm, color: colors.fg.dim, textAlign: "center" }}>{msg}</span>
            </div>
        );

        if (effMonths.length < 2 && effIsMonthly && !["expense-by-category", "expense-by-channel"].includes(chartId)) {
            return emptyMsg("Se necesitan al menos 2 meses de datos");
        }

        switch (chartId) {
            case "cashflow": {
                return (
                    <EvoChart
                        xData={effMonths}
                        series={[
                            { type: "bar", data: effIncome, name: "Ingresos", itemStyle: { color: colors.accent.green, borderRadius: [7, 7, 7, 7] }, barMaxWidth: 28, barGap: "12%", barCategoryGap: "42%", animationDuration: 600, animationEasing: "cubicOut" },
                            { type: "bar", data: effExpense, name: "Egresos", itemStyle: { color: colors.accent.red, borderRadius: [7, 7, 7, 7] }, barMaxWidth: 28, barGap: "12%", barCategoryGap: "42%", animationDuration: 600, animationEasing: "cubicOut" },
                        ]}
                        tooltipFormatter={(params) => {
                            const inc = params.find((p) => p.seriesName === "Ingresos")?.value ?? 0;
                            const exp = params.find((p) => p.seriesName === "Egresos")?.value ?? 0;
                            const ahorro = inc - exp;
                            return `
                                <div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", effViewMode)}</div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.green}"></span>Ingresos: <b>${formatCompact(inc)}</b></div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.red}"></span>Egresos: <b>${formatCompact(exp)}</b></div>
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent.cyan}"></span>Ahorro: <b>${formatCompact(ahorro)}</b></div>
                            `;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "savings-rate":
                return (
                    <EvoChart
                        xData={effMonths}
                        series={[{
                            type: "line", data: effSavingsRate,
                            smooth: true, symbol: "circle", symbolSize: 4,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            animationDuration: 600, animationEasing: "cubicOut",
                            lineStyle: { color: colors.accent.cyan, width: 2.5 },
                            itemStyle: { color: colors.accent.cyan },
                            markLine: {
                                silent: true,
                                data: [{ yAxis: 50, label: { show: false }, lineStyle: { color: colors.fg.dim, type: "dashed" } }],
                                symbol: "none",
                            },
                        }]}
                        yFormatter={(v) => `${formatValue(v)}%`}
                        yMax={100}
                        tooltipFormatter={(params) => {
                            const v = params[0]?.value;
                            return `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", effViewMode)}</div><span style="font-size:12px"><b>${v != null ? `${formatValue(v)}%` : "Sin datos"}</b> de ahorro</span>`;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );

            case "capital-growth":
                return (
                    <EvoChart
                        xData={effMonths}
                        series={[{
                            type: "line", data: effCapital,
                            smooth: true, symbol: "circle", symbolSize: 4,
                            showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 },
                            animationDuration: 600, animationEasing: "cubicOut",
                            lineStyle: { color: colors.accent.blue, width: 2.5 },
                            itemStyle: { color: colors.accent.blue },
                            areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.blue}30` }, { offset: 1, color: `${colors.accent.blue}00` }] } },
                        }]}
                        tooltipFormatter={(params) =>
                            `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", effViewMode)}</div><span style="font-size:12px"><b>${formatCompact(params[0]?.value ?? 0)}</b></span>`
                        }
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            case "expense-fixed-vs-variable": {
                const { months: expMonths, data: [expFix, expVar] } = trimData(effMonths, effExpenseFixed, effExpenseVariable);
                return (
                    <EvoChart
                        xData={expMonths}
                        series={[
                            { type: "bar", data: expFix, name: "Fijo", itemStyle: { color: colors.accent.red, borderRadius: [7, 7, 7, 7] }, barMaxWidth: 28, barGap: "12%", barCategoryGap: "42%", animationDuration: 600, animationEasing: "cubicOut" },
                            { type: "bar", data: expVar, name: "Variable", itemStyle: { color: `${colors.accent.red}66`, borderRadius: [7, 7, 7, 7] }, barMaxWidth: 28, barGap: "12%", barCategoryGap: "42%", animationDuration: 600, animationEasing: "cubicOut" },
                        ]}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", effViewMode)}</div>`;
                            params.forEach((p) => {
                                html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: <b>${formatCompact(p.value)}</b></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "income-fixed-vs-variable": {
                const { months: incMonths, data: [incFix, incVar] } = trimData(effMonths, effIncomeFixed, effIncomeVariable);
                return (
                    <EvoChart
                        xData={incMonths}
                        series={[
                            { type: "bar", data: incFix, name: "Fijo", itemStyle: { color: `${colors.accent.green}B3`, borderRadius: [7, 7, 7, 7] }, barMaxWidth: 28, barGap: "12%", barCategoryGap: "42%", animationDuration: 600, animationEasing: "cubicOut" },
                            { type: "bar", data: incVar, name: "Variable", itemStyle: { color: `${colors.accent.green}50`, borderRadius: [7, 7, 7, 7] }, barMaxWidth: 28, barGap: "12%", barCategoryGap: "42%", animationDuration: 600, animationEasing: "cubicOut" },
                        ]}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", effViewMode)}</div>`;
                            params.forEach((p) => {
                                html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: <b>${formatCompact(p.value)}</b></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-capital": {
                const m = metrics?.capital?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.blue);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); const name = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); return name.charAt(0).toUpperCase() + name.slice(1); });
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
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, effViewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${formatNumber(Math.round(p.value), { decimals: 0 })}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-savings": {
                const m = metrics?.savings?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.cyan);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); const name = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); return name.charAt(0).toUpperCase() + name.slice(1); });
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
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, effViewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${formatNumber(Math.round(p.value), { decimals: 0 })}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-income": {
                const m = metrics?.income?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.green);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); const name = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); return name.charAt(0).toUpperCase() + name.slice(1); });
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
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, effViewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${formatNumber(Math.round(p.value), { decimals: 0 })}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "real-vs-plan-expense": {
                const m = metrics?.expense?.months;
                if (!m) return null;
                const multi = mkMultiSeries(m, colors.accent.red);
                if (multi.every((s) => s.data.every((d: number | null) => d === null))) return null;
                const labels = m.map((_, i) => { const d = new Date(); d.setMonth(i); const name = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); return name.charAt(0).toUpperCase() + name.slice(1); });
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
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0].name, effViewMode)}</div>`;
                            params.forEach((p) => {
                                if (p.value === null || p.value === undefined) return;
                                html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span><span style="font-size:12px;font-weight:600">${p.seriesName}: ${formatNumber(Math.round(p.value), { decimals: 0 })}</span></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "annual-area": {
                return (
                    <EvoChart
                        xData={effMonths}
                        series={[
                            { type: "line", data: effCumulativeIncome, name: "Ingresos", smooth: true, symbol: "circle", symbolSize: 4, showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 }, animationDuration: 600, animationEasing: "cubicOut", lineStyle: { color: colors.accent.green, width: 2 }, itemStyle: { color: colors.accent.green }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.green}30` }, { offset: 1, color: `${colors.accent.green}00` }] } } },
                            { type: "line", data: effCumulativeExpense, name: "Egresos", smooth: true, symbol: "circle", symbolSize: 4, showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 }, animationDuration: 600, animationEasing: "cubicOut", lineStyle: { color: colors.accent.red, width: 2 }, itemStyle: { color: colors.accent.red }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.red}30` }, { offset: 1, color: `${colors.accent.red}00` }] } } },
                            { type: "line", data: effCumulativeSavings, name: "Ahorro", smooth: true, symbol: "circle", symbolSize: 4, showSymbol: false, emphasis: { showSymbol: true, scale: 1.5 }, animationDuration: 600, animationEasing: "cubicOut", lineStyle: { color: colors.accent.cyan, width: 2 }, itemStyle: { color: colors.accent.cyan }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.accent.cyan}30` }, { offset: 1, color: `${colors.accent.cyan}00` }] } } },
                        ]}
                        tooltipFormatter={(params) => {
                            let html = `<div style="font-size:${fonts.size.xs};color:${colors.fg.dim};margin-bottom:4px">${formatX(params[0]?.name ?? "", effViewMode)}</div>`;
                            params.forEach((p) => {
                                html += `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: <b>${formatCompact(p.value)}</b></div>`;
                            });
                            return html;
                        }}
                        hiddenSeries={hidden}
                        viewMode={effViewMode}
                        chartKey={`${chartId}-${hidden.join(",")}`}
                    />
                );
            }

            case "expense-by-category":
            case "expense-by-channel": {
                const dimData = chartId === "expense-by-category" ? expenseByCategory : expenseByChannel;
                if (!dimData || !dimData.data.length) return emptyMsg("Sin datos");
                const allDataMonths = [...new Set(dimData.data.flatMap((s) => s.data.map((d) => d.month)))].sort();
                const targetMonths = effExpenseMonth === "all"
                    ? allDataMonths.filter((m) => m.startsWith(effExpenseYear))
                    : allDataMonths.filter((m) => m === `${effExpenseYear}-${effExpenseMonth}`);
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
                const series = [{
                    type: "bar",
                    barMaxWidth: 28,
                    barCategoryGap: "42%",
                    data: items.map((g, i) => ({
                        value: g.total,
                        itemStyle: { color: catBase[i % catBase.length], borderRadius: [0, 7, 7, 0] },
                    })),
                    label: { show: false },
                    emphasis: { label: { show: false } },
                }];
                return (
                    <ReactECharts
                        option={{
                            backgroundColor: "transparent",
                            grid: { top: 6, right: 16, bottom: 8, left: 8, containLabel: true },
                            xAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: colors.fill, type: "dashed" } }, axisLabel: { color: colors.fg.dim, fontSize: fonts.size.xs, formatter: (v: number) => formatCompact(v) } },
                            yAxis: { type: "category", data: items.map((g) => g.name), axisLine: { lineStyle: { color: colors.fill } }, axisTick: { show: false }, axisLabel: { color: colors.fg.base, fontSize: fonts.size.xs } },
                            tooltip: {
                                trigger: "axis",
                                axisPointer: { type: "shadow" },
                                backgroundColor: colors.bg.elevated,
                                borderColor: colors.border,
                                borderWidth: 2,
                                borderRadius: 8,
                                padding: [6, 10],
                                textStyle: { color: colors.fg.base, fontSize: fonts.size.xs },
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
                                    html += `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;padding-top:4px;border-top:1px solid ${colors.border};font-size:12px">Total: <b>${formatCompact(entry.total)}</b></div>`;
                                    return html;
                                },
                            },
                            series,
                        }}
                        style={{ height: "100%", width: "100%" }}
                        opts={{ renderer: "svg" }}
                        key={`${chartId}-${effExpenseYear}-${effExpenseMonth}`}
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
                ...flexColumn,
                gap: spacing[3],
                maxHeight: "calc(100vh - 80px)",
                boxSizing: "border-box",
                overflow: "auto",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            <div style={{ ...flexColumn, gap: spacing[2], flexShrink: 0, minHeight: "64px" }}>
                <h1
                    style={{
                        fontFamily: fonts.family,
                        fontSize: fonts.size.xl,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.base,
                        margin: 0,
                    }}
                >
                    Evolución
                </h1>
                <div style={{
                    display: "inline-flex",
                    borderRadius: "8px",
                    background: colors.fill,
                    overflow: "hidden",
                    cursor: "pointer",
                    userSelect: "none",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                }}>
                    {groups.map((g, i) => (
                        <div
                            key={g.id}
                            onClick={() => setGroupIdx(i)}
                            style={{
                                ...flexRow,
                                justifyContent: "center",
                                padding: "4px 14px",
                                whiteSpace: "nowrap",
                                fontSize: fonts.size.sm,
                                fontWeight: fonts.weight.medium,
                                color: groupIdx === i ? colors.fg.base : colors.fg.dim,
                                borderRadius: "7px",
                                background: groupIdx === i ? colors.bg.surface : "transparent",
                                transition: "background 0.15s ease, color 0.2s",
                                lineHeight: "18px",
                                gap: "5px",
                            }}
                        >
                            {groupIcons[g.id]}
                            {g.label}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3], flex: 1, minHeight: 0 }}>
                {groups[groupIdx].charts.map((ch: { id: string; title: string; desc?: string; legend?: { label: string; color: string }[] }) => (
                    <div key={ch.id} style={card}>
                        <div style={{ ...chartHeader, ...flexColumn, gap: 2 }}>
                            <div style={{ ...flexBetween, gap: spacing[2] }}>
                                <span>{ch.title}</span>
                                <Button variant="plain" onClick={() => { setModalChartId(ch.id); setModalHiddenSeries({}); }} title="Expandir">
                                    <Maximize2 size={14} />
                                </Button>
                            </div>
                            <div style={{ ...flexBetween, gap: spacing[2], flexWrap: "wrap" }}>
                                {ch.desc && <span style={{ fontSize: fonts.size.xs4, fontWeight: fonts.weight.medium, color: colors.fg.dim }}>{ch.desc}</span>}
                                {ch.legend && (
                                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap", justifyContent: "flex-end", paddingRight: spacing[1] }}>
                                        {ch.legend.map((l: { label: string; color: string; style?: "line" }) => {
                                            const isHidden = hiddenSeries[ch.id]?.includes(l.label);
                                            return (
                                                <div key={l.label} onClick={l.style === "line" ? undefined : () => toggleSeries(ch.id, l.label)} style={{ ...flexRow, gap: 3, fontSize: fonts.size.xs, color: isHidden ? colors.fg.dim : undefined, cursor: l.style === "line" ? "default" : "pointer", opacity: isHidden ? 0.45 : 1, transition: "opacity 0.15s" }}>
                                                    {l.style === "line" ? (
                                                        <span style={{ display: "inline-block", width: 18, height: 3, borderRadius: 2, background: l.color, flexShrink: 0 }} />
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
                        <div style={{ height: "320px", flexShrink: 0 }}>
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
                        ...flexRow,
                        justifyContent: "center",
                    }}
                >
                        <div
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
                            <div style={{ ...flexBetween }}>
                                <h2 style={{ fontSize: fonts.size.lg, fontWeight: fonts.weight.semibold, color: colors.fg.base, margin: 0 }}>
                                    {chart.title}
                                </h2>
                                <div style={{ ...flexRow, gap: spacing[2] }}>
                                    {!["expense-by-category", "expense-by-channel"].includes(modalChartId) && !modalChartId.startsWith("real-vs-plan") && (
                                        <div style={{
                                            ...flexRow,
                                            gap: 2,
                                            borderRadius: "6px",
                                            background: colors.fill,
                                            overflow: "hidden",
                                            flexShrink: 0,
                                        }}>
                                            {[
                                                { key: "current_year" as ViewMode, label: "YTD" },
                                                { key: "monthly" as ViewMode, label: "Mensual" },
                                                { key: "ytd" as ViewMode, label: "Anual" },
                                            ].map((m) => (
                                                <div
                                                    key={m.key}
                                                    onClick={() => setModalViewMode(m.key)}
                                                    style={{
                                                        padding: "2px 8px",
                                                        fontSize: fonts.size.xs,
                                                        fontWeight: fonts.weight.medium,
                                                        color: modalViewMode === m.key ? colors.fg.base : colors.fg.dim,
                                                        background: modalViewMode === m.key ? colors.bg.surface : "transparent",
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
                                    {["expense-by-category", "expense-by-channel"].includes(modalChartId) && (
                                        <>
                                        <Dropdown
                                            value={modalExpenseYear}
                                            onChange={setModalExpenseYear}
                                            options={expenseByCategory ? [...new Set(expenseByCategory.data.flatMap((s) => s.data.map((d) => d.month.split("-")[0])))].sort().reverse().map((y) => ({ id: y, label: y })) : []}
                                            triggerStyle={{ ...chipTriggerStyle(true), width: "80px" }}
                                        />
                                        <Dropdown
                                            value={modalExpenseMonth}
                                            onChange={setModalExpenseMonth}
                                            options={[{ id: "all", label: "Todo el año" }, ...["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((name, i) => ({ id: String(i + 1).padStart(2, "0"), label: name }))]}
                                            triggerStyle={{ ...chipTriggerStyle(true), width: "130px" }}
                                        />
                                        </>
                                    )}
                                    <ModalCloseButton onClick={() => setModalChartId(null)} />
                                </div>
                            </div>
                            {chart.legend && (
                                <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap", alignItems: "center" }}>
                                    {chart.legend.map((l: { label: string; color: string; style?: "line" }) => {
                                        const isHidden = modalHiddenSeries[modalChartId]?.includes(l.label);
                                        return (
                                            <div
                                                key={l.label}
                                                onClick={l.style === "line" ? undefined : () => toggleModalSeries(modalChartId, l.label)}
                                                style={{
                                                    ...flexRow,
                                                    gap: 3,
                                                    fontSize: fonts.size.sm,
                                                    fontWeight: fonts.weight.medium,
                                                    color: isHidden ? colors.fg.dim : undefined,
                                                    cursor: l.style === "line" ? "default" : "pointer",
                                                    opacity: isHidden ? 0.45 : 1,
                                                    transition: "opacity 0.15s",
                                                }}
                                            >
                                                {l.style === "line" ? (
                                                    <span style={{ display: "inline-block", width: 18, height: 3, borderRadius: 2, background: l.color, flexShrink: 0 }} />
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
                        <div style={{ flex: 1, minHeight: 0 }}>
                            {renderChart(modalChartId, modalHiddenSeries[modalChartId] ?? [], {
                                viewMode: modalViewMode,
                                expenseYear: modalExpenseYear,
                                expenseMonth: modalExpenseMonth,
                                months: modalData.months,
                                income: modalData.income,
                                expense: modalData.expense,
                                capital: modalData.capital,
                                savings: modalData.savings,
                                expenseFixed: modalData.expenseFixed,
                                expenseVariable: modalData.expenseVariable,
                                incomeFixed: modalData.incomeFixed,
                                incomeVariable: modalData.incomeVariable,
                                savingsRate: modalData.savingsRate,
                                cumulativeIncome: modalData.cumulativeIncome,
                                cumulativeExpense: modalData.cumulativeExpense,
                                cumulativeSavings: modalData.cumulativeSavings,
                                isMonthly: modalData.isMonthly,
                            })}
                        </div>
                    </div>
                </div>
            );
        })()}
        </>
    );
}
