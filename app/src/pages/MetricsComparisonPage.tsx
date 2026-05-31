import { useState, useMemo, Fragment } from "react";
import { BarChart2 } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { useDashboardMetrics } from "@/hooks";
import { MetricsComparisonTable } from "@/components/MetricsComparisonTable";
import { KPIEvolutionModal } from "@/components/KPIEvolutionModal";
import { formatNumber } from "@/utils/format";
import type { MetricCell, MetricSeries, MetricComparisonDashboard } from "@/api_client";
import { flexColumn } from "@/styles/layout";

type TabKey = "mtd" | "ytd" | "fy";

interface AccumulatedData {
    ytdPlanPct?: number;
    ytdPlanDiff?: number;
    ytdFcstPct?: number;
    ytdFcstDiff?: number;
    closedPlanPct?: number;
    closedPlanDiff?: number;
    closedFcstPct?: number;
    closedFcstDiff?: number;
}

const fmtPct = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return "—";
    return `${val >= 0 ? "+" : ""}${(val * 100).toFixed(1)}%`;
};

const fmtNum = (val: number | undefined | null): string =>
    val === undefined || val === null ? "—" : formatNumber(val, { decimals: 0 });

function MetricSummaryCard({
    label,
    accentColor,
    series,
    accumulated,
    onClick,
    inverseTrend = false,
    hideMtd = false,
}: {
    label: string;
    accentColor: string;
    series: MetricSeries | undefined;
    accumulated: AccumulatedData;
    onClick: () => void;
    inverseTrend?: boolean;
    hideMtd?: boolean;
}) {
    const [tab, setTab] = useState<TabKey>("ytd");
    const cell = tab === "mtd" ? series?.mtd : tab === "ytd" ? series?.ytd : series?.fy;

    const vsColor = (pct: number | undefined | null) => {
        if (pct === undefined || pct === null) return colors.fg.dim;
        return (inverseTrend ? pct < 0 : pct > 0) ? colors.accent.green : colors.accent.red;
    };

    const comparisonRows = [
        { label: "FCST", value: cell?.fcst, vsPct: cell?.vs_fcst_pct },
        { label: "PLAN", value: cell?.plan, vsPct: cell?.vs_plan_pct },
        { label: "LY",   value: cell?.ly,   vsPct: cell?.vs_ly_pct  },
    ];

    const accumulatedRows = [
        { label: "vs PLAN", actualDiff: accumulated.ytdPlanDiff,  actualPct: accumulated.ytdPlanPct,  closedDiff: accumulated.closedPlanDiff,  closedPct: accumulated.closedPlanPct  },
        { label: "vs FCST", actualDiff: accumulated.ytdFcstDiff,  actualPct: accumulated.ytdFcstPct,  closedDiff: accumulated.closedFcstDiff,  closedPct: accumulated.closedFcstPct  },
    ];

    const grid3 = (cols: string): React.CSSProperties => ({
        display: "grid",
        gridTemplateColumns: cols,
        columnGap: "10px",
        rowGap: "3px",
        alignItems: "center",
    });

    const num: React.CSSProperties = {
        fontFamily: fonts.family,
        fontVariantNumeric: "tabular-nums",
        fontSize: fonts.size.sm,
        fontWeight: fonts.weight.medium,
        textAlign: "right",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
    };

    const colHead: React.CSSProperties = {
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.semibold,
        color: colors.fg.dim,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textAlign: "right",
    };

    return (
        <div
            style={{
                backgroundColor: colors.bg.elevated,
                borderRadius: radius.xl,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px 4px",
                }}
            >
                <span
                    style={{
                        color: accentColor,
                        fontWeight: fonts.weight.semibold,
                        fontSize: fonts.size.sm,
                        textTransform: "uppercase",
                        flex: 1,
                    }}
                >
                    {label}
                </span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: colors.fill,
                        borderRadius: radius.md,
                        padding: "2px",
                        gap: "1px",
                        height: "22px",
                        boxSizing: "border-box",
                    }}
                >
                    {(["mtd", "ytd", "fy"] as TabKey[]).filter(t => !(hideMtd && t === "mtd")).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                background: tab === t ? colors.bg.base : "transparent",
                                border: "none",
                                borderRadius: radius.base,
                                padding: "3px 9px",
                                fontSize: fonts.size.xs,
                                fontWeight: tab === t ? fonts.weight.semibold : fonts.weight.medium,
                                color: tab === t ? colors.fg.base : colors.fg.dim,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                transition: "color 0.1s ease",
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClick}
                    title="Ver evolución"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: colors.fill,
                        border: "none",
                        borderRadius: radius.md,
                        padding: "0 6px",
                        height: "22px",
                        boxSizing: "border-box",
                        cursor: "pointer",
                        color: colors.fg.dim,
                        flexShrink: 0,
                        transition: "color 0.12s ease",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = accentColor; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = colors.fg.dim; }}
                >
                    <BarChart2 size={13} strokeWidth={2} />
                </button>
            </div>

            {/* Hero value */}
            <div
                style={{
                    padding: "0 12px 8px",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    overflow: "hidden",
                }}
            >
                <span
                    style={{
                        fontFamily: fonts.family,
                        fontSize: fonts.size.sm,
                        fontWeight: fonts.weight.medium,
                        color: colors.fg.dim,
                        flexShrink: 0,
                    }}
                >
                    REAL
                </span>
                <span
                    style={{
                        fontSize: fonts.size.lg,
                        fontWeight: fonts.weight.bold,
                        color: colors.fg.base,
                        fontFamily: fonts.family,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                    }}
                >
                    {cell?.real !== undefined && cell?.real !== null
                        ? formatNumber(cell.real, { decimals: 0 })
                        : "—"}
                </span>
            </div>

            {/* FCST / PLAN / LY */}
            <div
                style={{
                    borderTop: `1px solid ${colors.border}`,
                    padding: "8px 12px",
                    ...grid3("max-content 1fr 1fr"),
                }}
            >
                <span style={{ ...colHead, textAlign: "left" }}>MÉTRICA</span>
                <span style={colHead}>VALOR</span>
                <span style={colHead}>VS % REAL</span>
                {comparisonRows.map((row) => (
                    <Fragment key={row.label}>
                        <span style={{ fontFamily: fonts.family, fontSize: fonts.size.sm, fontWeight: fonts.weight.medium, color: colors.fg.dim }}>
                            {row.label}
                        </span>
                        <span style={{ ...num, color: colors.fg.base }}>
                            {row.value !== undefined && row.value !== null
                                ? formatNumber(row.value, { decimals: 0 })
                                : "—"}
                        </span>
                        <span style={{ ...num, color: vsColor(row.vsPct) }}>
                            {fmtPct(row.vsPct)}
                        </span>
                    </Fragment>
                ))}
            </div>

            {/* Accumulated */}
            <div
                style={{
                    borderTop: `1px solid ${colors.border}`,
                    padding: "8px 12px",
                    ...grid3("max-content 1fr 1fr"),
                }}
            >
                <span style={{ ...colHead, textAlign: "left" }}>ACUM.</span>
                <span style={colHead}>ACTUAL</span>
                <span style={colHead}>CERRADO</span>
                {accumulatedRows.map((row) => (
                    <Fragment key={row.label}>
                        <span style={{ fontFamily: fonts.family, fontSize: fonts.size.sm, fontWeight: fonts.weight.medium, color: colors.fg.dim }}>
                            {row.label}
                        </span>
                        <span style={{ ...num, color: vsColor(row.actualPct) }}>
                            {fmtNum(row.actualDiff)}
                        </span>
                        <span style={{ ...num, color: vsColor(row.closedPct) }}>
                            {fmtNum(row.closedDiff)}
                        </span>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

export function MetricsComparisonPage() {
    const currentYear = new Date().getFullYear();
    const [year] = useState(currentYear);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

    const { data: metricsData, isLoading, isError } = useDashboardMetrics(year);

    const currentMonth = new Date().getMonth();

    const kpiModalConfig =
        selectedKPI === "Capital"
            ? { months: metricsData?.capital?.months, color: colors.accent.blue }
            : selectedKPI === "Ahorro"
              ? { months: metricsData?.savings?.months, color: colors.accent.cyan }
              : selectedKPI === "Egresos"
                ? { months: metricsData?.expense?.months, color: colors.accent.red }
                : selectedKPI === "Ingresos"
                  ? { months: metricsData?.income?.months, color: colors.accent.green }
                  : undefined;

    const accumulated = useMemo(() => {
        const empty: AccumulatedData = {};

        if (!metricsData) {
            return { income: empty, expense: empty, savings: empty, capital: empty };
        }

        const flowClosed = (months: MetricCell[] | undefined) => {
            if (!months?.length || currentMonth === 0) return empty;
            const limit = Math.min(currentMonth, months.length);
            let sumReal = 0, sumPlan = 0, sumFcst = 0;
            for (let i = 0; i < limit; i++) {
                sumReal += months[i].real ?? 0;
                sumPlan += months[i].plan ?? 0;
                sumFcst += months[i].fcst ?? 0;
            }
            const planDiff = sumReal - sumPlan;
            const fcstDiff = sumReal - sumFcst;
            return {
                closedPlanDiff: planDiff,
                closedFcstDiff: fcstDiff,
                closedPlanPct: sumPlan !== 0 ? planDiff / sumPlan : undefined,
                closedFcstPct: sumFcst !== 0 ? fcstDiff / sumFcst : undefined,
            };
        };

        const capitalClosed = (months: MetricCell[] | undefined) => {
            if (!months?.length || currentMonth === 0) return empty;
            const m = months[Math.min(currentMonth - 1, months.length - 1)];
            return {
                closedPlanDiff: m.vs_plan,
                closedFcstDiff: m.vs_fcst,
                closedPlanPct: m.vs_plan_pct,
                closedFcstPct: m.vs_fcst_pct,
            };
        };

        const build = (series: MetricSeries | undefined, isCapital: boolean): AccumulatedData => {
            const closed = isCapital
                ? capitalClosed(series?.months)
                : flowClosed(series?.months);
            const ytd = series?.ytd;
            return {
                ytdPlanPct: ytd?.vs_plan_pct,
                ytdPlanDiff: ytd?.vs_plan,
                ytdFcstPct: ytd?.vs_fcst_pct,
                ytdFcstDiff: ytd?.vs_fcst,
                ...closed,
            };
        };

        return {
            income: build(metricsData.income, false),
            expense: build(metricsData.expense, false),
            savings: build(metricsData.savings, false),
            capital: build(metricsData.capital, true),
        };
    }, [metricsData, currentMonth]);

    return (
        <div
            style={{
                padding: spacing[3],
                ...flexColumn,
                gap: spacing[3],
                height: "calc(100vh - 80px)",
                overflow: "hidden",
                boxSizing: "border-box",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            {selectedKPI && kpiModalConfig ? (
                <KPIEvolutionModal
                    kpi={selectedKPI}
                    onClose={() => setSelectedKPI(null)}
                    metricMonths={kpiModalConfig.months}
                    accentColor={kpiModalConfig.color}
                />
            ) : selectedKPI ? (
                <KPIEvolutionModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />
            ) : null}

            <div style={{ flexShrink: 0, minHeight: "64px" }}>
                <h1
                    style={{
                        fontFamily: fonts.family,
                        fontSize: fonts.size.xl,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.base,
                        margin: 0,
                        marginBottom: spacing[1],
                    }}
                >
                    Métricas
                </h1>
                <p
                    style={{
                        fontFamily: fonts.family,
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        margin: 0,
                        minHeight: "1.4em",
                    }}
                >
                    {isLoading ? "Cargando..." : isError ? "Error al cargar" : "Resumen financiero"}
                </p>
            </div>

            {!isLoading && !isError && (
                <>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: spacing[3],
                            flexShrink: 0,
                        }}
                    >
                        <MetricSummaryCard
                            label="Ingresos"
                            accentColor={colors.accent.green}
                            series={metricsData?.income}
                            accumulated={accumulated.income}
                            onClick={() => setSelectedKPI("Ingresos")}
                        />
                        <MetricSummaryCard
                            label="Egresos"
                            accentColor={colors.accent.red}
                            series={metricsData?.expense}
                            accumulated={accumulated.expense}
                            onClick={() => setSelectedKPI("Egresos")}
                            inverseTrend
                        />
                        <MetricSummaryCard
                            label="Ahorro"
                            accentColor={colors.accent.cyan}
                            series={metricsData?.savings}
                            accumulated={accumulated.savings}
                            onClick={() => setSelectedKPI("Ahorro")}
                        />
                        <MetricSummaryCard
                            label="Capital"
                            accentColor={colors.accent.blue}
                            series={metricsData?.capital}
                            accumulated={accumulated.capital}
                            onClick={() => setSelectedKPI("Capital")}
                            hideMtd
                        />
                    </div>

                    <div style={{ flex: "0 1 auto", minHeight: 0, borderRadius: radius.lg, backgroundColor: colors.bg.surface }}>
                        <MetricsComparisonTable
                            data={metricsData ?? ({} as MetricComparisonDashboard)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
