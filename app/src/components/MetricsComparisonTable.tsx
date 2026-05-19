import { useState, useRef, useLayoutEffect } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Tooltip } from "@/components/ui/Tooltip";
import type { MetricSeries, MetricCell } from "@/api_client/types";

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

const TINT_MAP: Record<string, string> = {
    [colors.accent.green]: "tint-green",
    [colors.accent.red]: "tint-red",
    [colors.accent.cyan]: "tint-cyan",
    [colors.accent.blue]: "tint-blue",
    [colors.accent.purple]: "tint-purple",
    [colors.accent.teal]: "tint-teal",
    [colors.accent.orange]: "tint-orange",
    [colors.accent.yellow]: "tint-yellow",
};

const ROW_HOVER_CSS = `
    .metric-table-row td {
        background-color: ${colors.bg.surface};
        transition: filter 0.12s ease;
    }
    .metric-table-row:hover td {
        filter: brightness(1.15);
    }
    .metric-table-row td.summary-cell {
        background-color: ${colors.bg.header};
    }
    .metric-table-row td.summary-cell.mtd-cell {
        border-left: 2px solid ${colors.border};
    }
    .metric-table-row td.tint-green { background-color: ${colors.accent.green}18; }
    .metric-table-row td.tint-red { background-color: ${colors.accent.red}18; }
    .metric-table-row td.tint-cyan { background-color: ${colors.accent.cyan}18; }
    .metric-table-row td.tint-blue { background-color: ${colors.accent.blue}18; }
    .metric-table-row td.tint-purple { background-color: ${colors.accent.purple}18; }
    .metric-table-row td.tint-teal { background-color: ${colors.accent.teal}18; }
    .metric-table-row td.tint-orange { background-color: ${colors.accent.orange}18; }
    .metric-table-row td.tint-yellow { background-color: ${colors.accent.yellow}18; }
    .metric-table-row.comparison-row td {
        background-color: ${colors.bg.header};
    }
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
    expense_fixed: "Gas. Fijo",
    expense_variable: "Gas. Variable",
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

const fmtNum = (val: number | undefined): string => {
    if (val === undefined || val === null) return "";
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);
};

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
                backgroundColor: colors.bg.header,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                padding: `${spacing[1]} ${spacing[2]}`,
                outline: `1px solid ${colors.fill}`,
                zIndex: 1000,
                minWidth: "180px",
                maxWidth: "280px",
                pointerEvents: "none",
                wordBreak: "break-word",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                lineHeight: 1.5,
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
                        fontWeight: 600,
                        fontSize: "13px",
                        color: colors.fg.base,
                        lineHeight: 1.3,
                    }}
                >
                    {data.metric}
                </div>
                <div
                    style={{
                        fontSize: "11px",
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
                    fontSize: "12.5px",
                    color: colors.fg.dim,
                    marginBottom: spacing[1],
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: spacing[2],
                }}
            >
                <span style={{ lineHeight: 1.4 }}>Real</span>
                <span
                    style={{
                        fontFamily: fonts.family.display,
                        fontWeight: 600,
                        fontSize: "12.5px",
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
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "12.5px",
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
                                        fontFamily: fonts.family.display,
                                        fontWeight: 600,
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
                { label: "vs Plan", pct: data.vsPlanPct },
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
                        { label: "vs Plan", pct: data.vsPlanPct },
                        { label: "vs LY", pct: data.vsLyPct },
                        { label: "vs LM", pct: data.vsLmPct },
                    ]
                        .filter((r) => r.pct !== undefined)
                        .map((r) => (
                            <div
                                key={r.label}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "12.5px",
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
                                        fontFamily: fonts.family.display,
                                        fontWeight: 600,
                                        color:
                                            (r.pct ?? 0) > 0
                                                ? colors.accent.green
                                                : (r.pct ?? 0) < 0
                                                  ? colors.accent.red
                                                  : colors.fg.dim,
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
    isDimmed?: boolean;
    borderBottom?: string;
    borderTop?: string;
    tintClass?: string;
    isMtd?: boolean;
}

function DataCell({
    cell,
    field,
    accentColor: _accentColor,
    isSummary,
    isPrimary,
    metricLabel,
    monthLabel,
    onHover,
    summaryBorderLeft,
    isDimmed,
    borderBottom,
    borderTop,
    tintClass,
    isMtd,
}: DataCellProps) {
    const isPct = field.toString().includes("pct");
    const val = getCell(cell, field) as number | undefined;
    const display =
        isSummary && (val === undefined || val === null || val === 0)
            ? ""
            : isPct
              ? fmtPct(val)
              : fmtNum(val);
    const isPositiveVal = val !== undefined && val !== null ? val > 0 : undefined;

    let textColor: string;
    if (isDimmed) {
        textColor = colors.fg.dim;
    } else if (val === undefined || val === null || val === 0) {
        textColor = isSummary ? "transparent" : colors.fill;
    } else if (isPct || field.toString().startsWith("vs")) {
        textColor =
            isPositiveVal === true
                ? colors.accent.green
                : isPositiveVal === false
                  ? colors.accent.red
                  : colors.fg.dim;
    } else if (isSummary) {
        textColor = colors.fg.base;
    } else {
        textColor = isPrimary ? colors.fg.base : `${colors.fg.base}d8`;
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
            accentColor: colors.fg.base,
        });
    };

    const classes = [isSummary ? "summary-cell" : "", isMtd ? "mtd-cell" : "", tintClass || ""]
        .filter(Boolean)
        .join(" ");

    return (
        <td
            className={classes || undefined}
            style={{
                padding: "5px 2px",
                textAlign: "right",
                fontSize: fonts.table.sm,
                fontFamily: fonts.family.display,
                fontWeight:
                    val !== undefined && val !== null && val !== 0
                        ? isPrimary
                            ? fonts.weight.semibold
                            : fonts.weight.medium
                        : fonts.weight.regular,
                color: textColor,
                borderBottom: borderBottom ?? `1px solid ${colors.fill}`,
                borderTop: borderTop ?? "none",
                borderLeft: summaryBorderLeft ?? "none",
                overflow: "hidden",
                minWidth: 0,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: isSummary ? "0.04em" : undefined,
                cursor: "pointer",
                transition: "filter 0.12s ease",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => onHover(null)}
        >
            <span
                style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                    width: "75%",
                    marginLeft: "auto",
                }}
            >
                {display}
            </span>
        </td>
    );
}

interface DataRowProps {
    label: string;
    values: MetricCell[];
    mtd: MetricCell | undefined;
    ytd: MetricCell | undefined;
    fy: MetricCell | undefined;
    field: keyof MetricCell;
    isPrimary?: boolean;
    isComparison?: boolean;
    accentColor: string;
    onHover: (data: TooltipData | null) => void;
    currentMonth: number;
    hideMtd?: boolean;
    hideFy?: boolean;
}

function DataRow({
    label,
    values,
    mtd,
    ytd,
    fy,
    field,
    isPrimary,
    isComparison,
    accentColor,
    onHover,
    currentMonth,
    hideMtd,
    hideFy,
}: DataRowProps) {
    const labelColor = isPrimary ? accentColor : isComparison ? colors.fg.dim : colors.fg.base;

    return (
        <tr
            className={`metric-table-row${isComparison ? " comparison-row" : ""}`}
            style={{ height: isComparison ? "24px" : "26px" }}
        >
            <td
                style={{
                    padding: isComparison ? "5px 8px 5px 16px" : "5px 8px",
                    fontSize: fonts.table.sm,
                    fontWeight: fonts.weight.regular,
                    fontStyle: isComparison ? "italic" : undefined,
                    color: labelColor,
                    borderBottom: isComparison
                        ? `1px dotted ${colors.fill}`
                        : `1px solid ${colors.fill}`,
                    borderLeft: `1px solid ${accentColor}`,
                    borderRight: `1px solid ${colors.fill}`,
                    overflow: "hidden",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                }}
            >
                <Tooltip content={isComparison ? `└ ${label}` : label}>
                    <span
                        style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
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
                    metricLabel={label}
                    monthLabel={MONTHS[i]}
                    onHover={onHover}
                    isDimmed={i > currentMonth}
                />
            ))}
            <DataCell
                cell={hideMtd ? undefined : mtd}
                field={field}
                accentColor={accentColor}
                isSummary={true}
                isPrimary={isPrimary ?? false}
                metricLabel={label}
                monthLabel="MTD"
                onHover={onHover}
                isMtd={true}
                summaryBorderLeft={`1px solid ${colors.border}`}
            />
            <DataCell
                cell={ytd}
                field={field}
                accentColor={accentColor}
                isSummary={true}
                isPrimary={isPrimary ?? false}
                metricLabel={label}
                monthLabel="YTD"
                onHover={onHover}
                summaryBorderLeft={`1px solid ${colors.fill}`}
            />
            <DataCell
                cell={hideFy ? undefined : fy}
                field={field}
                accentColor={accentColor}
                isSummary={true}
                isPrimary={isPrimary ?? false}
                metricLabel={label}
                monthLabel="FY"
                onHover={onHover}
                summaryBorderLeft={`1px solid ${colors.fill}`}
            />
        </tr>
    );
}

interface SimpleMetricBlockProps {
    label: string;
    accentColor: string;
    series: MetricSeries;
    expanded?: boolean;
    onToggle?: () => void;
    onHover: (data: TooltipData | null) => void;
    currentMonth: number;
    hideMtd?: boolean;
    hideFy?: boolean;
}

function SimpleMetricBlock({
    label,
    accentColor,
    series,
    expanded = false,
    onToggle,
    onHover,
    currentMonth,
    hideMtd,
    hideFy,
}: SimpleMetricBlockProps) {
    if (!series || !series.months) return null;

    return (
        <>
            <tr
                className="metric-table-row"
                style={{ height: "26px", cursor: "pointer" }}
                onClick={onToggle}
            >
                <td
                    className={TINT_MAP[accentColor]}
                    style={{
                        padding: "5px 8px",
                        fontSize: fonts.table.sm,
                        fontWeight: fonts.weight.semibold,
                        color: accentColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        borderTop: `1px solid ${colors.fill}`,
                        borderBottom: `1px solid ${accentColor}`,
                        borderLeft: `1px solid ${accentColor}`,
                        borderRight: `1px solid ${colors.fill}`,
                        overflow: "hidden",
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                    }}
                >
                    <Tooltip content={label}>
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing[1],
                                userSelect: "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "12.5px",
                                    height: "12.5px",
                                    borderRadius: "2px",
                                    fontSize: "9px",
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
                    </Tooltip>
                </td>
                {series.months.map((cell, i) => (
                    <DataCell
                        key={`m${i}`}
                        cell={cell}
                        field="real"
                        accentColor={accentColor}
                        isSummary={false}
                        isPrimary={true}
                        metricLabel={label}
                        monthLabel={MONTHS[i]}
                        onHover={onHover}
                        isDimmed={i > currentMonth}
                        borderBottom={`1px solid ${accentColor}`}
                        borderTop={`1px solid ${colors.fill}`}
                        tintClass={TINT_MAP[accentColor]}
                    />
                ))}
                <DataCell
                    cell={hideMtd ? undefined : series.mtd}
                    field="real"
                    accentColor={accentColor}
                    isSummary={true}
                    isPrimary={true}
                    metricLabel={label}
                    monthLabel="MTD"
                    onHover={onHover}
                    isMtd={true}
                    summaryBorderLeft={`1px solid ${colors.border}`}
                    borderBottom={`1px solid ${accentColor}`}
                    borderTop={`1px solid ${colors.fill}`}
                    tintClass={TINT_MAP[accentColor]}
                />
                <DataCell
                    cell={series.ytd}
                    field="real"
                    accentColor={accentColor}
                    isSummary={true}
                    isPrimary={true}
                    metricLabel={label}
                    monthLabel="YTD"
                    onHover={onHover}
                    summaryBorderLeft={`1px solid ${colors.fill}`}
                    borderBottom={`1px solid ${accentColor}`}
                    borderTop={`1px solid ${colors.fill}`}
                    tintClass={TINT_MAP[accentColor]}
                />
                <DataCell
                    cell={hideFy ? undefined : series.fy}
                    field="real"
                    accentColor={accentColor}
                    isSummary={true}
                    isPrimary={true}
                    metricLabel={label}
                    monthLabel="FY"
                    onHover={onHover}
                    summaryBorderLeft={`1px solid ${colors.fill}`}
                    borderBottom={`1px solid ${accentColor}`}
                    borderTop={`1px solid ${colors.fill}`}
                    tintClass={TINT_MAP[accentColor]}
                />
            </tr>

            {!expanded && (
                <>
                    <SimpleDataRow
                        label="LY"
                        values={series.months}
                        mtd={series.mtd}
                        ytd={series.ytd}
                        fy={series.fy}
                        field="ly"
                        accentColor={accentColor}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        hideMtd={hideMtd}
                        hideFy={hideFy}
                    />
                    <SimpleDataRow
                        label="LM"
                        values={series.months}
                        mtd={series.mtd}
                        ytd={series.ytd}
                        fy={series.fy}
                        field="lm"
                        accentColor={accentColor}
                        onHover={onHover}
                        currentMonth={currentMonth}
                        hideMtd={hideMtd}
                        hideFy={hideFy}
                    />
                </>
            )}

            {expanded && (
                <>
                    <SimpleDataRow
                        label="vs LY"
                        values={series.months}
                        mtd={series.mtd}
                        ytd={series.ytd}
                        fy={series.fy}
                        field="vs_ly"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        hideMtd={hideMtd}
                        hideFy={hideFy}
                    />
                    <SimpleDataRow
                        label="vs LY %"
                        values={series.months}
                        mtd={series.mtd}
                        ytd={series.ytd}
                        fy={series.fy}
                        field="vs_ly_pct"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        hideMtd={hideMtd}
                        hideFy={hideFy}
                    />
                    <SimpleDataRow
                        label="vs LM"
                        values={series.months}
                        mtd={series.mtd}
                        ytd={series.ytd}
                        fy={series.fy}
                        field="vs_lm"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        hideMtd={hideMtd}
                        hideFy={hideFy}
                    />
                    <SimpleDataRow
                        label="vs LM %"
                        values={series.months}
                        mtd={series.mtd}
                        ytd={series.ytd}
                        fy={series.fy}
                        field="vs_lm_pct"
                        accentColor={accentColor}
                        onHover={onHover}
                        isComparison={true}
                        currentMonth={currentMonth}
                        hideMtd={hideMtd}
                        hideFy={hideFy}
                    />
                </>
            )}
        </>
    );
}

function SimpleDataRow({
    label,
    values,
    mtd,
    ytd,
    fy,
    field,
    accentColor,
    onHover,
    isComparison,
    currentMonth,
    hideMtd,
    hideFy,
}: {
    label: string;
    values: MetricCell[];
    mtd: MetricCell | undefined;
    ytd: MetricCell | undefined;
    fy: MetricCell | undefined;
    field: keyof MetricCell;
    accentColor: string;
    onHover: (data: TooltipData | null) => void;
    isComparison?: boolean;
    currentMonth: number;
    hideMtd?: boolean;
    hideFy?: boolean;
}) {
    const labelColor = isComparison ? colors.fg.dim : colors.fg.base;
    return (
        <tr className="metric-table-row" style={{ height: "24px" }}>
            <td
                style={{
                    padding: isComparison ? "5px 8px 5px 16px" : "5px 8px",
                    fontSize: fonts.table.sm,
                    fontWeight: fonts.weight.regular,
                    fontStyle: isComparison ? "italic" : undefined,
                    color: labelColor,
                    borderBottom: isComparison
                        ? `1px dotted ${colors.fill}`
                        : `1px solid ${colors.fill}`,
                    borderLeft: `1px solid ${accentColor}`,
                    borderRight: `1px solid ${colors.fill}`,
                    overflow: "hidden",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                }}
            >
                <Tooltip content={isComparison ? `└ ${label}` : label}>
                    <span
                        style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
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
                    isDimmed={i > currentMonth}
                />
            ))}
            <DataCell
                cell={hideMtd ? undefined : mtd}
                field={field}
                accentColor={accentColor}
                isSummary={true}
                isPrimary={false}
                metricLabel={label}
                monthLabel="MTD"
                onHover={onHover}
                isMtd={true}
                summaryBorderLeft={`1px solid ${colors.border}`}
            />
            <DataCell
                cell={ytd}
                field={field}
                accentColor={accentColor}
                isSummary={true}
                isPrimary={false}
                metricLabel={label}
                monthLabel="YTD"
                onHover={onHover}
                summaryBorderLeft={`1px solid ${colors.fill}`}
            />
            <DataCell
                cell={hideFy ? undefined : fy}
                field={field}
                accentColor={accentColor}
                isSummary={true}
                isPrimary={false}
                metricLabel={label}
                monthLabel="FY"
                onHover={onHover}
                summaryBorderLeft={`1px solid ${colors.fill}`}
            />
        </tr>
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
    hideMtd?: boolean;
    hideFy?: boolean;
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
    hideMtd,
    hideFy,
}: MetricBlockProps) {
    if (!series || !series.months) return null;

    return (
        <>
            {/* Block header row */}
            <tr
                className="metric-table-row"
                style={{ height: "26px", cursor: "pointer" }}
                onClick={onToggle}
            >
                <td
                    className={TINT_MAP[accentColor]}
                    style={{
                        padding: "5px 8px",
                        fontSize: fonts.table.sm,
                        fontWeight: fonts.weight.semibold,
                        color: accentColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        borderTop: `1px solid ${colors.fill}`,
                        borderBottom: `1px solid ${accentColor}`,
                        borderLeft: `1px solid ${accentColor}`,
                        borderRight: `1px solid ${colors.fill}`,
                        overflow: "hidden",
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                    }}
                >
                    <Tooltip content={label}>
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing[1],
                                userSelect: "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "12.5px",
                                    height: "12.5px",
                                    borderRadius: "2px",
                                    fontSize: "9px",
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
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: accentColor,
                                        backgroundColor: `${accentColor}15`,
                                        lineHeight: 1,
                                    }}
                                >
                                    {subExpanded ? "−" : "+"}
                                </button>
                            )}
                        </span>
                    </Tooltip>
                </td>
                {series.months.map((cell, i) => (
                    <DataCell
                        key={`m${i}`}
                        cell={cell}
                        field="real"
                        accentColor={accentColor}
                        isSummary={false}
                        isPrimary={true}
                        metricLabel={label}
                        monthLabel={MONTHS[i]}
                        onHover={onHover}
                        isDimmed={i > currentMonth}
                        borderBottom={`1px solid ${accentColor}`}
                        borderTop={`1px solid ${colors.fill}`}
                        tintClass={TINT_MAP[accentColor]}
                    />
                ))}
                <DataCell
                    cell={hideMtd ? undefined : series.mtd}
                    field="real"
                    accentColor={accentColor}
                    isSummary={true}
                    isPrimary={true}
                    metricLabel={label}
                    monthLabel="MTD"
                    onHover={onHover}
                    isMtd={true}
                    summaryBorderLeft={`1px solid ${colors.border}`}
                    borderBottom={`1px solid ${accentColor}`}
                    borderTop={`1px solid ${colors.fill}`}
                    tintClass={TINT_MAP[accentColor]}
                />
                <DataCell
                    cell={series.ytd}
                    field="real"
                    accentColor={accentColor}
                    isSummary={true}
                    isPrimary={true}
                    metricLabel={label}
                    monthLabel="YTD"
                    onHover={onHover}
                    summaryBorderLeft={`1px solid ${colors.fill}`}
                    borderBottom={`1px solid ${accentColor}`}
                    borderTop={`1px solid ${colors.fill}`}
                    tintClass={TINT_MAP[accentColor]}
                />
                <DataCell
                    cell={hideFy ? undefined : series.fy}
                    field="real"
                    accentColor={accentColor}
                    isSummary={true}
                    isPrimary={true}
                    metricLabel={label}
                    monthLabel="FY"
                    onHover={onHover}
                    summaryBorderLeft={`1px solid ${colors.fill}`}
                    borderBottom={`1px solid ${accentColor}`}
                    borderTop={`1px solid ${colors.fill}`}
                    tintClass={TINT_MAP[accentColor]}
                />
            </tr>

            {!expanded && (
                <>
                    <DataRow
                        label="FCST"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="fcst"
                        accentColor={accentColor}
                        isPrimary={false}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="Plan"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="plan"
                        accentColor={accentColor}
                        isPrimary={false}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="LY"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="ly"
                        accentColor={accentColor}
                        isPrimary={false}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                </>
            )}

            {expanded && (
                <>
                    <DataRow
                        label="vs FCST"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="vs_fcst"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="vs FCST %"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="vs_fcst_pct"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="vs Plan"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="vs_plan"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="vs Plan %"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="vs_plan_pct"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="vs LY"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="vs_ly"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
                    />
                    <DataRow
                        label="vs LY %"
                        values={series.months}
                        mtd={hideMtd ? undefined : series.mtd}
                        ytd={series.ytd}
                        fy={hideFy ? undefined : series.fy}
                        field="vs_ly_pct"
                        accentColor={accentColor}
                        isPrimary={false}
                        isComparison={true}
                        onHover={onHover}
                        currentMonth={currentMonth}
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
                            hideMtd={hideMtd}
                            hideFy={hideFy}
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

    const handleToggle = (key: string) => {
        setExpandedBlock((prev) => (prev === key ? null : key));
    };

    const handleSubToggle = (key: string) => {
        setSubExpandedBlock((prev) => (prev === key ? null : key));
    };

    return (
        <div
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                overflow: "auto",
                height: "515px",
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: ROW_HOVER_CSS }} />
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                }}
            >
                <colgroup>
                    <col style={{ width: "10%" }} />
                    {MONTHS.map((m) => (
                        <col key={m} style={{ width: "6%" }} />
                    ))}
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "6%" }} />
                </colgroup>
                <thead>
                    <tr style={{ height: "32px" }}>
                        <th
                            style={{
                                padding: "6px 8px",
                                textAlign: "left",
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.dim,
                                fontSize: fonts.table.sm,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                borderBottom: `2px solid ${colors.border}`,
                                borderRight: `1px solid ${colors.fill}`,
                                backgroundColor: colors.bg.header,
                                position: "sticky",
                                left: 0,
                                top: 0,
                                zIndex: 20,
                            }}
                        >
                            Métrica
                        </th>
                        {MONTHS.map((m) => (
                            <th
                                key={m}
                                style={{
                                    padding: "6px 1px",
                                    textAlign: "right",
                                    fontWeight: fonts.weight.semibold,
                                    color: colors.fg.dim,
                                    fontSize: fonts.table.sm,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                    borderBottom: `2px solid ${colors.border}`,
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                    backgroundColor: colors.bg.header,
                                }}
                            >
                                {m}
                            </th>
                        ))}
                        <th
                            style={{
                                padding: "4px 4px",
                                textAlign: "right",
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                fontSize: fonts.table.sm,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                borderBottom: `2px solid ${colors.border}`,
                                borderLeft: `2px solid ${colors.border}`,
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                backgroundColor: colors.bg.header,
                            }}
                        >
                            MTD
                        </th>
                        <th
                            style={{
                                padding: "4px 4px",
                                textAlign: "right",
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                fontSize: fonts.table.sm,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                borderBottom: `2px solid ${colors.border}`,
                                borderLeft: `1px solid ${colors.fill}`,
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                backgroundColor: colors.bg.header,
                            }}
                        >
                            YTD
                        </th>
                        <th
                            style={{
                                padding: "4px 4px",
                                textAlign: "right",
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                fontSize: fonts.table.sm,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                borderBottom: `2px solid ${colors.border}`,
                                borderLeft: `1px solid ${colors.fill}`,
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                backgroundColor: colors.bg.header,
                            }}
                        >
                            FY
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(PALETTE).map(([key, config]) => {
                        const { accentColor, label } = config;
                        const subKeys = "subKeys" in config ? config.subKeys : undefined;
                        return (
                            <MetricBlock
                                key={key}
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
                                hideMtd={key === "capital"}
                                hideFy={key === "capital" && !data.capital?.fy?.real}
                            />
                        );
                    })}
                </tbody>
            </table>

            {hoveredCell && <CellTooltip data={hoveredCell} />}
        </div>
    );
}
