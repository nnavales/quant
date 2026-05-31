import { useState, useRef, useLayoutEffect, memo, useCallback, Fragment } from "react";
import { formatNumber } from "@/utils/format";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Tooltip } from "@/components/ui/Tooltip";
import type { MetricSeries, MetricCell } from "@/api_client/types";
import { flexBetween, truncate } from "@/styles/layout";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_FULL = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];


const ROW_HOVER_CSS = `
    .metric-table-row td {
        background-color: ${colors.bg.surface};
        transition: background-color 0.12s ease;
    }
    .metric-table-row:hover td {
        background-color: ${colors.bg.hover};
    }
    .metric-table-row td.summary-cell {
        background-color: ${colors.bg.elevated};
    }
    .metric-table-row:hover td.summary-cell {
        background-color: ${colors.bg.hover};
    }
    .metrics-table-wrapper::-webkit-scrollbar { width: 8px; height: 8px; }
    .metrics-table-wrapper::-webkit-scrollbar-track { background: transparent; }
    .metrics-table-wrapper::-webkit-scrollbar-thumb { background: var(--fill); border-radius: 4px; }
`;

const PALETTE = {
    income: {
        accentColor: colors.accent.green,
        label: "Ingresos",
        subKeys: ["income_fixed", "income_variable"] as const,
    },
    expense: {
        accentColor: colors.accent.red,
        label: "Egresos",
        subKeys: ["expense_fixed", "expense_variable"] as const,
    },
    savings: { accentColor: colors.accent.cyan, label: "Ahorro" },
    capital: { accentColor: colors.accent.blue, label: "Capital" },
} as const;

const SUB_LABELS: Record<string, string> = {
    income_fixed: "Ing. Fijo",
    income_variable: "Ing. Variable",
    expense_fixed: "Egr. Fijo",
    expense_variable: "Egr. Variable",
};

const SUB_COLORS: Record<string, string> = {
    income_fixed: colors.accent.green,
    income_variable: colors.accent.green,
    expense_fixed: colors.accent.red,
    expense_variable: colors.accent.red,
};

const getCell = (cell: MetricCell | undefined, field: keyof MetricCell): number | undefined => {
    if (!cell) return undefined;
    return cell[field];
};

const fmtNum = (val: number | undefined): string =>
    val === undefined || val === null ? "" : formatNumber(val, { decimals: 0 });

const fmtPct = (val: number | undefined): string => {
    if (val === undefined || val === null) return "";
    return `${val >= 0 ? "+" : ""}${(val * 100).toFixed(1)}%`;
};

interface TooltipData {
    x: number;
    y: number;
    metric: string;
    month: string;
    real?: number;
    fcst?: number;
    plan?: number;
    ly?: number;
    lm?: number;
    vsFcstPct?: number;
    vsPlanPct?: number;
    vsLyPct?: number;
    vsLmPct?: number;
    accentColor: string;
}

function CellTooltip({ data }: { data: TooltipData }) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const pad = 12;
        let left = data.x - rect.width / 2;
        let top = data.y + 10;
        if (left < pad) left = pad;
        if (left + rect.width > window.innerWidth - pad)
            left = window.innerWidth - rect.width - pad;
        if (top + rect.height > window.innerHeight - pad) top = data.y - rect.height - 10;
        if (top < pad) top = pad;
        ref.current.style.left = `${Math.round(left)}px`;
        ref.current.style.top = `${Math.round(top)}px`;
    }, [data]);

    return (
        <div
            ref={ref}
            style={{
                position: "fixed",
                left: 0,
                top: 0,
                backgroundColor: colors.bg.elevated,
                border: `2px solid ${colors.border}`,
                borderRadius: radius.lg,
                padding: `${spacing[1]} ${spacing[2]}`,
                zIndex: 9999,
                minWidth: "180px",
                maxWidth: "280px",
                pointerEvents: "none",
                wordBreak: "break-word",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                lineHeight: 1.6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
        >
            <div
                style={{
                    marginBottom: spacing[1],
                    borderBottom: `1px solid ${colors.border}`,
                    paddingBottom: spacing[1],
                }}
            >
                <div
                    style={{
                        fontWeight: fonts.weight.semibold,
                        fontSize: fonts.size.sm,
                        color: colors.fg.base,
                        lineHeight: 1.3,
                    }}
                >
                    {data.metric}
                </div>
                <div
                    style={{
                        fontSize: fonts.size.xs,
                        color: colors.fg.dim,
                        marginTop: "1px",
                        lineHeight: 1.3,
                    }}
                >
                    {MONTHS_FULL[MONTHS.indexOf(data.month)] ?? data.month}
                </div>
            </div>
            <div
                style={{
                    fontSize: fonts.size.xs4,
                    color: colors.fg.dim,
                    marginBottom: spacing[1],
                    ...flexBetween,
                    gap: spacing[2],
                }}
            >
                <span style={{ lineHeight: 1.4 }}>REAL</span>
                <span
                    style={{
                        fontFamily: fonts.family,
                        fontWeight: fonts.weight.semibold,
                        fontSize: fonts.size.xs4,
                        color: colors.fg.base,
                        whiteSpace: "nowrap",
                        textAlign: "right",
                    }}
                >
                    {fmtNum(data.real)}
                </span>
            </div>
            {[
                { label: "FCST", val: data.fcst },
                { label: "PLAN", val: data.plan },
                { label: "LY", val: data.ly },
                { label: "LM", val: data.lm },
            ].filter((r) => r.val !== undefined).length > 0 && (
                <div
                    style={{
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: spacing[1],
                        marginTop: spacing[1],
                    }}
                >
                    {[
                        { label: "FCST", val: data.fcst },
                        { label: "PLAN", val: data.plan },
                        { label: "LY", val: data.ly },
                        { label: "LM", val: data.lm },
                    ]
                        .filter((r) => r.val !== undefined)
                        .map((r) => (
                            <div
                                key={r.label}
                                style={{
                                    ...flexBetween,
                                    fontSize: fonts.size.xs4,
                                    padding: "1px 0",
                                    gap: spacing[2],
                                }}
                            >
                                <span
                                    style={{
                                        color: colors.fg.dim,
                                        lineHeight: 1.4,
                                        flex: 1,
                                    }}
                                >
                                    {r.label}
                                </span>
                                <span
                                    style={{
                                        fontFamily: fonts.family,
                                        fontWeight: fonts.weight.semibold,
                                        color: colors.fg.base,
                                        whiteSpace: "nowrap",
                                        textAlign: "right",
                                    }}
                                >
                                    {fmtNum(r.val)}
                                </span>
                            </div>
                        ))}
                </div>
            )}
            {[
                { label: "vs FCST", pct: data.vsFcstPct },
                { label: "vs PLAN", pct: data.vsPlanPct },
                { label: "vs LY", pct: data.vsLyPct },
                { label: "vs LM", pct: data.vsLmPct },
            ].filter((r) => r.pct !== undefined).length > 0 && (
                <div
                    style={{
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: spacing[1],
                        marginTop: spacing[1],
                    }}
                >
                    {[
                        { label: "vs FCST", pct: data.vsFcstPct },
                        { label: "vs PLAN", pct: data.vsPlanPct },
                        { label: "vs LY", pct: data.vsLyPct },
                        { label: "vs LM", pct: data.vsLmPct },
                    ]
                        .filter((r) => r.pct !== undefined)
                        .map((r) => (
                            <div
                                key={r.label}
                                style={{
                                    ...flexBetween,
                                    fontSize: fonts.size.xs4,
                                    padding: "1px 0",
                                    gap: spacing[2],
                                }}
                            >
                                <span
                                    style={{
                                        color: colors.fg.base,
                                        lineHeight: 1.4,
                                        flex: 1,
                                    }}
                                >
                                    {r.label}
                                </span>
                                <span
                                    style={{
                                        fontFamily: fonts.family,
                                        fontWeight: fonts.weight.semibold,
                                        color: (() => {
                                            if (r.pct === null || r.pct === undefined)
                                                return colors.fg.dim;
                                            const isExpense =
                                                data.accentColor === colors.accent.red;
                                            const isGood = isExpense ? r.pct < 0 : r.pct > 0;
                                            return isGood ? colors.accent.green : colors.accent.red;
                                        })(),
                                        whiteSpace: "nowrap",
                                        textAlign: "right",
                                    }}
                                >
                                    {fmtPct(r.pct)}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

interface DataCellProps {
    cell: MetricCell | undefined;
    field: keyof MetricCell;
    accentColor: string;
    isSummary: boolean;
    isPrimary: boolean;
    metricLabel: string;
    monthLabel: string;
    onHover: (data: TooltipData | null) => void;
    summaryBorderLeft?: string;
    borderLeft?: string;
    borderBottom?: string;
    borderTop?: string;
    tintClass?: string;
    inverseTrend?: boolean;
}

const DataCell = memo(function DataCell({
    cell,
    field,
    accentColor,
    isSummary,
    isPrimary,
    metricLabel,
    monthLabel,
    onHover,
    summaryBorderLeft,
    borderLeft: borderLeftProp,
    borderBottom,
    borderTop,
    tintClass,
    inverseTrend = false,
}: DataCellProps) {
    const isPct = field.toString().includes("pct");
    const val = getCell(cell, field) as number | undefined;
    const isEmpty = val === undefined || val === null;
    const display = isEmpty ? "—" : isSummary && val === 0 ? "" : isPct ? fmtPct(val) : fmtNum(val);
    const isPositiveVal = val !== undefined && val !== null ? val > 0 : undefined;

    let textColor: string;
    if (isEmpty) {
        textColor = colors.fg.dim;
    } else if (val === 0 && isSummary) {
        textColor = "transparent";
    } else if (isPct || field.toString().startsWith("vs")) {
        textColor =
            isPositiveVal === true
                ? inverseTrend
                    ? colors.accent.red
                    : colors.accent.green
                : isPositiveVal === false
                  ? inverseTrend
                      ? colors.accent.green
                      : colors.accent.red
                  : colors.fg.dim;
    } else if (isSummary) {
        textColor = colors.fg.base;
    } else {
        textColor = isPrimary ? colors.fg.base : colors.fg.dim;
    }

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (field !== "real") return;
        if (val === undefined || val === null || val === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onHover({
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.bottom),
            metric: metricLabel,
            month: monthLabel,
            real: getCell(cell, "real"),
            fcst: getCell(cell, "fcst"),
            plan: getCell(cell, "plan"),
            ly: getCell(cell, "ly"),
            lm: getCell(cell, "lm"),
            vsFcstPct: getCell(cell, "vs_fcst_pct"),
            vsPlanPct: getCell(cell, "vs_plan_pct"),
            vsLyPct: getCell(cell, "vs_ly_pct"),
            vsLmPct: getCell(cell, "vs_lm_pct"),
            accentColor,
        });
    };

    const classes = [isSummary ? "summary-cell" : "", tintClass || ""]
        .filter(Boolean)
        .join(" ");

    return (
        <td
            className={classes || undefined}
            style={{
                padding: isSummary ? "3px 6px" : "3px 2px",
                textAlign: "right",
                fontSize: fonts.size.xs4,
                fontFamily: fonts.family,
                fontWeight: isSummary ? fonts.weight.semibold : fonts.weight.medium,
                color: textColor,
                borderBottom: borderBottom ?? "none",
                borderTop: borderTop ?? "none",
                borderLeft: borderLeftProp ?? summaryBorderLeft ?? "none",
                overflow: "hidden",
                minWidth: 0,
                fontVariantNumeric: "tabular-nums",
                cursor: "pointer",
                transition: "background-color 0.12s ease, filter 0.12s ease",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => onHover(null)}
        >
            <span
                className="selectable"
                style={{...truncate, display: "block",
                    textAlign: "right",
                    width: "75%",
                    marginLeft: "auto"}}
            >
                {display}
            </span>
        </td>
    );
});

interface DataRowProps {
    label: string;
    values: MetricCell[];
    field: keyof MetricCell;
    isPrimary?: boolean;
    isComparison?: boolean;
    accentColor: string;
    onHover: (data: TooltipData | null) => void;
    currentMonth: number;
    inverseTrend?: boolean;
    metricLabel?: string;
}

const DataRow = memo(function DataRow({
    label,
    values,
    field,
    isPrimary,
    isComparison,
    accentColor,
    onHover,
    inverseTrend = false,
    metricLabel,
}: DataRowProps) {
    const labelColor = isComparison ? colors.fg.dim : colors.fg.base;

    return (
        <tr
            className={`metric-table-row${isComparison ? " comparison-row" : ""}`}
            style={{ height: "24px" }}
        >
            <td
                style={{
                    padding: isComparison ? "3px 8px 3px 16px" : "3px 8px",
                    fontSize: fonts.size.xs4,
                    fontWeight: fonts.weight.medium,
                    fontStyle: isComparison ? "italic" : undefined,
                    color: labelColor,
                    overflow: "hidden",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                }}
            >
                <Tooltip content={isComparison ? `└ ${label}` : label}>
                    <span
                        style={{...truncate, display: "block"}}
                    >
                        {isComparison ? `└ ${label}` : label}
                    </span>
                </Tooltip>
            </td>
            {values.map((cell, i) => (
                <DataCell
                    key={`m${i}`}
                    cell={cell}
                    field={field}
                    accentColor={accentColor}
                    isSummary={false}
                    isPrimary={isPrimary ?? false}
                    metricLabel={metricLabel ?? label}
                    monthLabel={MONTHS[i]}
                    onHover={onHover}
                    inverseTrend={inverseTrend}
                />
            ))}
        </tr>
    );
});

interface SimpleMetricBlockProps {
    label: string;
    accentColor: string;
    series: MetricSeries;
    expanded?: boolean;
    onToggle?: () => void;
    onHover: (data: TooltipData | null) => void;
    currentMonth: number;
    inverseTrend?: boolean;
}

function SimpleMetricBlock({
    label,
    accentColor,
    series,
    expanded = false,
    onToggle,
    onHover,
    currentMonth,
    inverseTrend = false,
}: SimpleMetricBlockProps) {
    if (!series || !series.months) return null;

    return (
        <>
            <tr style={{ cursor: "pointer" }} onClick={onToggle}>
                <td
                    colSpan={MONTHS.length + 1}
                    style={{
                        padding: "4px 8px 4px",
                        fontSize: fonts.size.sm,
                        fontWeight: fonts.weight.semibold,
                        color: accentColor,
                        textTransform: "uppercase",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        userSelect: "none",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: spacing[1] }}>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "10px",
                                height: "10px",
                                fontSize: "7px",
                                color: accentColor,
                                transition: "transform 0.15s",
                                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                flexShrink: 0,
                            }}
                        >
                            ▶
                        </span>
                        {label}
                    </span>
                </td>
            </tr>
            <DataRow
                label="REAL"
                metricLabel={label}
                values={series.months}
                field="real"
                isPrimary={true}
                accentColor={accentColor}
                onHover={onHover}
                currentMonth={currentMonth}
                inverseTrend={inverseTrend}
            />

            {!expanded && (
                <>
                    <SimpleDataRow
                        label="LY"
                        values={series.months}
                        field="ly"
                        accentColor={accentColor}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <SimpleDataRow
                        label="LM"
                        values={series.months}
                        field="lm"
                        accentColor={accentColor}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                </>
            )}

            {expanded && (
                <>
                    <SimpleDataRow
                        label="vs LY"
                        values={series.months}
                        field="vs_ly"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <SimpleDataRow
                        label="vs LY %"
                        values={series.months}
                        field="vs_ly_pct"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <SimpleDataRow
                        label="vs LM"
                        values={series.months}
                        field="vs_lm"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <SimpleDataRow
                        label="vs LM %"
                        values={series.months}
                        field="vs_lm_pct"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                </>
            )}
        </>
    );
}

const SimpleDataRow = memo(function SimpleDataRow({
    label,
    values,
    field,
    accentColor,
    onHover,
    isComparison,
    inverseTrend,
}: {
    label: string;
    values: MetricCell[];
    field: keyof MetricCell;
    accentColor: string;
    onHover: (data: TooltipData | null) => void;
    isComparison?: boolean;
    currentMonth: number;
    inverseTrend?: boolean;
}) {
    const labelColor = isComparison ? colors.fg.dim : colors.fg.base;
    return (
        <tr className="metric-table-row" style={{ height: "24px" }}>
            <td
                style={{
                    padding: isComparison ? "3px 8px 3px 16px" : "3px 8px",
                    fontSize: fonts.size.xs4,
                    fontWeight: fonts.weight.medium,
                    fontStyle: isComparison ? "italic" : undefined,
                    color: labelColor,
                    overflow: "hidden",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                }}
            >
                <Tooltip content={isComparison ? `└ ${label}` : label}>
                    <span
                        style={{...truncate, display: "block"}}
                    >
                        {isComparison ? `└ ${label}` : label}
                    </span>
                </Tooltip>
            </td>
            {values.map((cell, i) => (
                <DataCell
                    key={`m${i}`}
                    cell={cell}
                    field={field}
                    accentColor={accentColor}
                    isSummary={false}
                    isPrimary={false}
                    metricLabel={label}
                    monthLabel={MONTHS[i]}
                    onHover={onHover}
                    inverseTrend={inverseTrend}
                />
            ))}
        </tr>
    );
});

interface MetricBlockProps {
    label: string;
    accentColor: string;
    series: MetricSeries;
    expanded: boolean;
    onToggle: () => void;
    onHover: (data: TooltipData | null) => void;
    subKeys?: readonly string[];
    subExpanded: boolean;
    onSubToggle: () => void;
    data: MetricsComparisonTableProps["data"];
    expandedBlock: string | null;
    handleToggle: (key: string) => void;
    currentMonth: number;
    inverseTrend?: boolean;
    isFirst?: boolean;
}

function MetricBlock({
    label,
    accentColor,
    series,
    expanded,
    onToggle,
    onHover,
    subKeys,
    subExpanded,
    onSubToggle,
    data,
    expandedBlock,
    handleToggle,
    currentMonth,
    inverseTrend = false,
    isFirst = false,
}: MetricBlockProps) {
    if (!series || !series.months) return null;

    return (
        <>
            {/* Block title row */}
            <tr style={{ cursor: "pointer" }} onClick={onToggle}>
                <td
                    colSpan={MONTHS.length + 1}
                    style={{
                        padding: "4px 8px 4px",
                        fontSize: fonts.size.sm,
                        fontWeight: fonts.weight.semibold,
                        color: accentColor,
                        textTransform: "uppercase",
                        borderTop: isFirst ? "none" : `1px solid ${colors.border}`,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        userSelect: "none",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: spacing[1] }}>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "10px",
                                height: "10px",
                                fontSize: "7px",
                                color: accentColor,
                                transition: "transform 0.15s",
                                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                flexShrink: 0,
                            }}
                        >
                            ▶
                        </span>
                        {label}
                        {subKeys && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubToggle();
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0 2px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "2px",
                                    fontSize: fonts.size.xs,
                                    fontWeight: fonts.weight.semibold,
                                    color: accentColor,
                                    backgroundColor: `${accentColor}15`,
                                    lineHeight: 1,
                                }}
                            >
                                {subExpanded ? "−" : "+"}
                            </button>
                        )}
                    </span>
                </td>
            </tr>
            {/* Real values row */}
            <DataRow
                label="REAL"
                metricLabel={label}
                values={series.months}
                field="real"
                isPrimary={true}
                accentColor={accentColor}
                onHover={onHover}
                currentMonth={currentMonth}
                inverseTrend={inverseTrend}
            />

            {!expanded && (
                <>
                    <DataRow
                        label="FCST"
                        values={series.months}
                        field="fcst"
                        accentColor={accentColor}
                        isPrimary={false}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="PLAN"
                        values={series.months}
                        field="plan"
                        accentColor={accentColor}
                        isPrimary={false}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="LY"
                        values={series.months}
                        field="ly"
                        accentColor={accentColor}
                        isPrimary={false}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                </>
            )}

            {expanded && (
                <>
                    <DataRow
                        label="vs FCST"
                        values={series.months}
                        field="vs_fcst"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="vs FCST %"
                        values={series.months}
                        field="vs_fcst_pct"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="vs PLAN"
                        values={series.months}
                        field="vs_plan"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="vs PLAN %"
                        values={series.months}
                        field="vs_plan_pct"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="vs LY"
                        values={series.months}
                        field="vs_ly"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                    <DataRow
                        label="vs LY %"
                        values={series.months}
                        field="vs_ly_pct"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        inverseTrend={inverseTrend}
                    />
                </>
            )}

            {subExpanded &&
                subKeys &&
                subKeys.map((subKey) => {
                    const subSeries = data[subKey as keyof typeof data] as MetricSeries | undefined;
                    if (!subSeries || !subSeries.months) return null;
                    const subLabel = SUB_LABELS[subKey] || subKey;
                    const subColor = SUB_COLORS[subKey] || accentColor;
                    return (
                        <SimpleMetricBlock
                            key={subKey}
                            label={subLabel}
                            accentColor={subColor}
                            series={subSeries}
                            expanded={expandedBlock === subKey}
                            onToggle={() => handleToggle(subKey)}
                            onHover={onHover}
                            currentMonth={currentMonth}
                            inverseTrend={subKey.startsWith("expense")}
                        />
                    );
                })}
        </>
    );
}

interface MetricsComparisonTableProps {
    data: {
        year: number;
        income?: MetricSeries;
        expense?: MetricSeries;
        savings?: MetricSeries;
        capital?: MetricSeries;
        income_fixed?: MetricSeries;
        expense_fixed?: MetricSeries;
        income_variable?: MetricSeries;
        expense_variable?: MetricSeries;
    };
}

export function MetricsComparisonTable({ data }: MetricsComparisonTableProps) {
    const [hoveredCell, setHoveredCell] = useState<TooltipData | null>(null);
    const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
    const [subExpandedBlock, setSubExpandedBlock] = useState<string | null>(null);
    const currentMonth = new Date().getMonth();

    const handleToggle = useCallback((key: string) => {
        setExpandedBlock((prev) => (prev === key ? null : key));
    }, []);

    const handleSubToggle = useCallback((key: string) => {
        setSubExpandedBlock((prev) => (prev === key ? null : key));
    }, []);

    return (
        <div style={{ borderRadius: radius.lg, overflow: "hidden", height: "100%" }}>
        <div className="metrics-table-wrapper" style={{ overflow: "auto", height: "100%" }}>
                <style dangerouslySetInnerHTML={{ __html: ROW_HOVER_CSS }} />
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        tableLayout: "fixed",
                    }}
                >
                    <colgroup>
                        <col style={{ width: "7%" }} />
                        {MONTHS.map((m) => (
                            <col key={m} style={{ width: "6%" }} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr style={{ height: "32px" }}>
                            <th
                                style={{
                                    padding: "6px 8px",
                                    textAlign: "left",
                                    fontWeight: fonts.weight.semibold,
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.xs2,
                                    textTransform: "uppercase",
                                    borderBottom: `1px solid ${colors.border}`,
                                    backgroundColor: colors.bg.elevated,
                                    position: "sticky",
                                    left: 0,
                                    top: 0,
                                    zIndex: 20,
                                }}
                            >
                                Métrica
                            </th>
                            {MONTHS.map((m, i) => (
                                <th
                                    key={m}
                                    style={{
                                        padding: "6px 1px",
                                        textAlign: "right",
                                        fontWeight: fonts.weight.semibold,
                                        color: i === currentMonth ? colors.fg.base : colors.fg.dim,
                                        fontSize: fonts.size.xs3,
                                        textTransform: "uppercase",
                                        borderBottom: `1px solid ${colors.border}`,
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 10,
                                        backgroundColor: colors.bg.elevated,
                                    }}
                                >
                                    {m}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(PALETTE).map(([key, config], index) => {
                            const { accentColor, label } = config;
                            const subKeys = "subKeys" in config ? config.subKeys : undefined;
                            return (
                                <Fragment key={key}>
                                    <MetricBlock
                                        label={label}
                                        accentColor={accentColor}
                                        series={data[key as keyof typeof data] as MetricSeries}
                                        expanded={expandedBlock === key}
                                        onToggle={() => handleToggle(key)}
                                        onHover={setHoveredCell}
                                        subKeys={subKeys}
                                        subExpanded={subExpandedBlock === key}
                                        onSubToggle={() => handleSubToggle(key)}
                                        data={data}
                                        expandedBlock={expandedBlock}
                                        handleToggle={handleToggle}
                                        currentMonth={currentMonth}
                                        inverseTrend={key === "expense"}
                                        isFirst={index === 0}
                                    />
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
        {hoveredCell && <CellTooltip data={hoveredCell} />}
        </div>
        </div>
    );
}
