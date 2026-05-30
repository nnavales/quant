import { memo, useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Trash2, ArrowUp } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatMonthStr, getDateFormat } from "@/utils/date";
import { formatNumber } from "@/utils/format";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { useUserConfig } from "@/hooks";
import type { HistoricalEntry } from "@/api_client";
import { flexColumn, flexRow, truncate } from "@/styles/layout";
import { TableVirtuoso } from "react-virtuoso";
import type { TableVirtuosoHandle, TableProps } from "react-virtuoso";
import { thStyle, sortableThStyle, iconStyle } from "@/styles/table";

let fullMonthFormatter: Intl.DateTimeFormat | null = null;
const getFullMonthFormatter = (): Intl.DateTimeFormat => {
    if (!fullMonthFormatter) {
        fullMonthFormatter = new Intl.DateTimeFormat("es-AR", {
            month: "long",
            year: "numeric",
        });
    }
    return fullMonthFormatter;
};

const formatMonth = (
    monthStr: string,
    useFullFormat: boolean,
    dateFormat: import("@/utils/date").DateFormat
): string => {
    if (useFullFormat) {
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const formatted = getFullMonthFormatter().format(date);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return formatMonthStr(monthStr, dateFormat);
};

const formatAmount = (amount: string | undefined): string =>
    amount ? formatNumber(parseFloat(amount)) : "0";

const STORAGE_KEY = "quant-historical-month-format";

const getStoredFormat = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "full";
    } catch {
        return false;
    }
};

const HEADER_CELL_STYLE: React.CSSProperties = {
    backgroundColor: colors.bg.elevated,
    zIndex: 3,
};

const moneyStyle: React.CSSProperties = {
    fontFamily: fonts.family,
    fontWeight: fonts.weight.medium,
    fontSize: fonts.size.sm2,
    color: colors.fg.base,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const incomeStyle: React.CSSProperties = { ...moneyStyle, color: colors.accent.green };
const expenseStyle: React.CSSProperties = { ...moneyStyle, color: colors.accent.red };
const savingsStyle: React.CSSProperties = { ...moneyStyle, color: colors.accent.cyan };

const moneyAltStyle: React.CSSProperties = {
    fontFamily: fonts.family,
    fontSize: "12px",
    fontWeight: fonts.weight.medium,
    color: colors.fg.dim,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const monthSpanStyle: React.CSSProperties = {
    fontSize: fonts.size.sm2,
    fontWeight: fonts.weight.medium,
};

const tcStyle: React.CSSProperties = {
    ...truncate,
    fontFamily: fonts.family,
    fontSize: fonts.size.xs2,
    fontWeight: fonts.weight.medium,
    color: colors.fg.dim,
    display: "block",
};

const sourceStyle: React.CSSProperties = {
    fontSize: fonts.size.xs2,
    textTransform: "uppercase",
    fontWeight: fonts.weight.medium,
    letterSpacing: "0.04em",
    color: colors.fg.dim,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const optionsSpanStyle: React.CSSProperties = {
    display: "flex",
    gap: spacing[1],
    justifyContent: "center",
};

const TableRowComponent = (props: React.ComponentPropsWithRef<"tr">) => {
    const { children, style, ...rest } = props;
    return <tr {...rest} style={style}>{children}</tr>;
};

const COL_WIDTHS = ["10%", "10%", "9%", "9%", "10%", "9%", "9%", "10%", "5%", "10%", "9%"];
const TableWithCols = ({ style, children, ...rest }: TableProps) => (
    <table {...rest} style={style}>
        <colgroup>
            {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        {children}
    </table>
);

const COMPONENTS = { TableRow: TableRowComponent, Table: TableWithCols };
const VIEWPORT_INCREASE = { top: 200, bottom: 200 };

interface HistoricalRowCellsProps {
    entry: HistoricalEntry;
    useFullMonthFormat: boolean;
    userDateFormat: import("@/utils/date").DateFormat;
    onEdit?: (entry: HistoricalEntry) => void;
    onDelete?: (entry: HistoricalEntry) => void;
    onToggleFormat: () => void;
}

const HistoricalRowCells = memo(function HistoricalRowCells({
    entry,
    useFullMonthFormat,
    userDateFormat,
    onEdit,
    onDelete,
    onToggleFormat,
}: HistoricalRowCellsProps) {
    const income = formatAmount(entry.income);
    const incomeFixed = formatAmount(entry.income_fixed);
    const incomeVariable = formatAmount(entry.income_variable);
    const expense = formatAmount(entry.expense);
    const expenseFixed = formatAmount(entry.expense_fixed);
    const expenseVariable = formatAmount(entry.expense_variable);
    const savings = formatAmount(entry.savings);
    const rate = formatNumber(entry.exchange_rate, { trim: true });
    const isHistorical = entry.source === "historical";

    return (
        <>
            <td className="h-mes" onClick={onToggleFormat}>
                <span className="selectable" style={monthSpanStyle}>
                    {formatMonth(entry.month, useFullMonthFormat, userDateFormat)}
                </span>
            </td>
            <td className="h-r10">
                <Tooltip content={income}>
                    <span className="selectable" style={incomeStyle}>{income}</span>
                </Tooltip>
            </td>
            <td className="h-r9">
                <Tooltip content={incomeFixed}>
                    <span className="selectable" style={moneyAltStyle}>{incomeFixed}</span>
                </Tooltip>
            </td>
            <td className="h-r9">
                <Tooltip content={incomeVariable}>
                    <span className="selectable" style={moneyAltStyle}>{incomeVariable}</span>
                </Tooltip>
            </td>
            <td className="h-r10">
                <Tooltip content={expense}>
                    <span className="selectable" style={expenseStyle}>{expense}</span>
                </Tooltip>
            </td>
            <td className="h-r9">
                <Tooltip content={expenseFixed}>
                    <span className="selectable" style={moneyAltStyle}>{expenseFixed}</span>
                </Tooltip>
            </td>
            <td className="h-r9">
                <Tooltip content={expenseVariable}>
                    <span className="selectable" style={moneyAltStyle}>{expenseVariable}</span>
                </Tooltip>
            </td>
            <td className="h-r10">
                <Tooltip content={savings}>
                    <span className="selectable" style={savingsStyle}>{savings}</span>
                </Tooltip>
            </td>
            <td className="h-c5">
                <Tooltip content={rate}>
                    <span className="selectable" style={tcStyle}>{rate}</span>
                </Tooltip>
            </td>
            <td className="h-c10">
                <span className="selectable" style={sourceStyle}>
                    {isHistorical ? "Histórico" : "Transacciones"}
                </span>
            </td>
            <td className="h-c9">
                <span style={optionsSpanStyle}>
                    {isHistorical && onEdit && (
                        <Button variant="icon" onClick={() => onEdit(entry)} title="Editar">
                            <Pencil size={13.5} />
                        </Button>
                    )}
                    {isHistorical && onDelete && (
                        <Button variant="icon" onClick={() => onDelete(entry)} title="Eliminar">
                            <Trash2 size={13.5} />
                        </Button>
                    )}
                </span>
            </td>
        </>
    );
}, (p, n) =>
    p.entry === n.entry &&
    p.useFullMonthFormat === n.useFullMonthFormat &&
    p.userDateFormat === n.userDateFormat
);

interface HistoricalListProps {
    entries: HistoricalEntry[];
    sort?: "month" | "income" | "expense" | "savings";
    order?: "asc" | "desc";
    onSort?: (sort: "month" | "income" | "expense" | "savings") => void;
    onEdit?: (entry: HistoricalEntry) => void;
    onDelete?: (entry: HistoricalEntry) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
}

export function HistoricalList({
    entries,
    sort,
    order,
    onSort,
    onEdit,
    onDelete,
    onLoadMore,
    hasMore,
    isLoadingMore,
}: HistoricalListProps) {
    const [useFullMonthFormat, setUseFullMonthFormat] = useState<boolean>(getStoredFormat);
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);

    const virtuosoRef = useRef<TableVirtuosoHandle>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const scroller = el.firstElementChild as HTMLElement | null;
        if (!scroller) return;
        const onScroll = () => setShowScrollTop(scroller.scrollTop > 400);
        scroller.addEventListener("scroll", onScroll, { passive: true });
        return () => scroller.removeEventListener("scroll", onScroll);
    }, []);

    const sortRef = useRef(sort);
    sortRef.current = sort;
    const orderRef = useRef(order);
    orderRef.current = order;
    const onSortRef = useRef(onSort);
    onSortRef.current = onSort;
    const onEditRef = useRef(onEdit);
    onEditRef.current = onEdit;
    const onDeleteRef = useRef(onDelete);
    onDeleteRef.current = onDelete;
    const useFullMonthFormatRef = useRef(useFullMonthFormat);
    useFullMonthFormatRef.current = useFullMonthFormat;
    const userDateFormatRef = useRef(userDateFormat);
    userDateFormatRef.current = userDateFormat;

    const toggleMonthFormatRef = useRef(() => {
        setUseFullMonthFormat(prev => {
            const next = !prev;
            try { localStorage.setItem(STORAGE_KEY, next ? "full" : "default"); } catch {}
            return next;
        });
    });

    const endReached = useCallback(() => {
        if (hasMore && !isLoadingMore) onLoadMore?.();
    }, [hasMore, isLoadingMore, onLoadMore]);

    const fixedHeaderContent = useCallback(() => {
        const s = sortRef.current;
        const o = orderRef.current;
        const renderSortIcon = (column: "month" | "income" | "expense" | "savings") => {
            const icon = s !== column ? "↕" : o === "desc" ? "▼" : "▲";
            const opacity = s !== column ? 0.7 : 1;
            return <span style={{ ...iconStyle, opacity }}>{icon}</span>;
        };
        return (
            <tr>
                <th style={{ ...thStyle(!!onSortRef.current, s === "month", "left"), ...HEADER_CELL_STYLE, width: "10%", borderLeft: "none" }}
                    onClick={() => onSortRef.current?.("month")}>
                    <span style={sortableThStyle}>Mes{renderSortIcon("month")}</span>
                </th>
                <th style={{ ...thStyle(!!onSortRef.current, s === "income", "right"), ...HEADER_CELL_STYLE, width: "10%" }}
                    onClick={() => onSortRef.current?.("income")}>
                    <span style={sortableThStyle}>Ingreso{renderSortIcon("income")}</span>
                </th>
                <th style={{ ...thStyle(false, false, "right"), ...HEADER_CELL_STYLE, width: "9%" }}>Ing. Fijo</th>
                <th style={{ ...thStyle(false, false, "right"), ...HEADER_CELL_STYLE, width: "9%" }}>Ing. Variable</th>
                <th style={{ ...thStyle(!!onSortRef.current, s === "expense", "right"), ...HEADER_CELL_STYLE, width: "10%" }}
                    onClick={() => onSortRef.current?.("expense")}>
                    <span style={sortableThStyle}>Egreso{renderSortIcon("expense")}</span>
                </th>
                <th style={{ ...thStyle(false, false, "right"), ...HEADER_CELL_STYLE, width: "9%" }}>Gas. Fijo</th>
                <th style={{ ...thStyle(false, false, "right"), ...HEADER_CELL_STYLE, width: "9%" }}>Gas. Variable</th>
                <th style={{ ...thStyle(!!onSortRef.current, s === "savings", "right"), ...HEADER_CELL_STYLE, width: "10%" }}
                    onClick={() => onSortRef.current?.("savings")}>
                    <span style={sortableThStyle}>Ahorro{renderSortIcon("savings")}</span>
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "5%" }}>T.C.</th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "10%" }}>Fuente</th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "9%" }}>Opciones</th>
            </tr>
        );
    }, [sort, order]);

    const itemContent = useCallback((_index: number, entry: HistoricalEntry) => (
        <HistoricalRowCells
            entry={entry}
            useFullMonthFormat={useFullMonthFormatRef.current}
            userDateFormat={userDateFormatRef.current}
            onEdit={onEditRef.current}
            onDelete={onDeleteRef.current}
            onToggleFormat={toggleMonthFormatRef.current}
        />
    ), []);

    if (entries.length === 0) {
        return (
            <div style={{ padding: spacing[8], textAlign: "center", color: colors.fg.dim, border: `1px solid transparent`, borderRadius: radius.lg }}>
                No hay datos
            </div>
        );
    }

    return (
        <div style={{ position: "absolute", inset: "0 0 5% 0", ...flexColumn, overflow: "hidden", borderRadius: radius.lg, backgroundColor: colors.bg.surface, border: `1px solid transparent` }}>
            <style>{`
                .historical-virtuoso-wrapper table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0}
                .historical-virtuoso-wrapper.is-scrolling td{pointer-events:none}
                .historical-virtuoso-wrapper tbody tr{background:var(--bg-surface)}
                .historical-virtuoso-wrapper tbody tr:hover{background:var(--bg-hover)}
                .historical-virtuoso-wrapper tbody tr:hover td:first-child{box-shadow:inset 3px 0 0 0 ${colors.accent.cyan}80}
                .historical-virtuoso-wrapper td{padding:0 ${spacing[3]};height:30px;line-height:16px;vertical-align:middle;border-bottom:1px solid var(--fill);border-left:1px solid var(--fill)}
                .historical-virtuoso-wrapper td:first-child{border-left:none}
                .historical-virtuoso-wrapper th:first-child{border-left:none}
                .historical-virtuoso-wrapper .h-mes{width:10%;min-width:10%;max-width:10%;text-align:left;white-space:nowrap;cursor:pointer}
                .historical-virtuoso-wrapper .h-r10{width:10%;min-width:10%;max-width:10%;text-align:right}
                .historical-virtuoso-wrapper .h-r9{width:9%;min-width:9%;max-width:9%;text-align:right}
                .historical-virtuoso-wrapper .h-c5{width:5%;min-width:5%;max-width:5%;text-align:center}
                .historical-virtuoso-wrapper .h-c10{width:10%;min-width:10%;max-width:10%;text-align:center}
                .historical-virtuoso-wrapper .h-c9{width:9%;min-width:9%;max-width:9%;text-align:center}
                .historical-virtuoso-wrapper th{padding:${spacing[1]} ${spacing[3]};font-weight:500;text-transform:uppercase;font-size:${fonts.size.xs2};letter-spacing:.05em;white-space:nowrap;border-bottom:1px solid var(--fill);border-left:1px solid var(--fill);background:var(--bg-elevated);z-index:3}
                .historical-virtuoso-wrapper .th-sortable{cursor:pointer;user-select:none}
                .historical-virtuoso-wrapper ::-webkit-scrollbar{width:8px}
                .historical-virtuoso-wrapper ::-webkit-scrollbar-track{background:transparent}
                .historical-virtuoso-wrapper ::-webkit-scrollbar-thumb{background:var(--fill);border-radius:4px}
            `}</style>
            <div ref={wrapperRef} className="historical-virtuoso-wrapper" style={{ flex: 1, minHeight: 0, fontSize: fonts.size.sm2 }}>
                <TableVirtuoso<HistoricalEntry>
                    ref={virtuosoRef}
                    style={{ height: "100%" }}
                    data={entries}
                    fixedHeaderContent={fixedHeaderContent}
                    itemContent={itemContent}
                    endReached={endReached}
                    increaseViewportBy={VIEWPORT_INCREASE}
                    components={COMPONENTS}
                    fixedItemHeight={30}
                    isScrolling={(scrolling) => {
                        wrapperRef.current?.classList.toggle("is-scrolling", scrolling);
                    }}
                />
            </div>
            {isLoadingMore && (
                <div style={{ padding: spacing[2], textAlign: "center", color: colors.fg.dim, fontSize: fonts.size.sm }}>
                    Cargando más...
                </div>
            )}
            {showScrollTop && (
                <button
                    onClick={() => virtuosoRef.current?.scrollToIndex(0)}
                    style={{ position: "absolute", bottom: spacing[4], right: spacing[4], width: 36, height: 36, borderRadius: "50%", backgroundColor: colors.bg.elevated, border: `1px solid transparent`, color: colors.fg.base, cursor: "pointer", ...flexRow, justifyContent: "center", zIndex: 10, transition: "all 0.15s" }}
                    title="Volver arriba"
                >
                    <ArrowUp size={18} />
                </button>
            )}
        </div>
    );
}
