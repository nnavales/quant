import { memo, useState, useRef, useCallback } from "react";
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
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import { sortableThStyle } from "@/styles/table";

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

// CSS grid columns — replaces the old <table>/<colgroup>. Div rows with a hard
// height:30px can't be stretched by table row-height distribution (the WebKit bug).
const GRID_COLS = "10fr 10fr 9fr 9fr 10fr 9fr 9fr 10fr 5fr 10fr 9fr";
const VIEWPORT_INCREASE = { top: 200, bottom: 200 };

const STYLES = `
.hist-grid-wrapper{display:flex;flex-direction:column}
.hist-grid-header,.hist-grid-row{display:grid;grid-template-columns:${GRID_COLS};box-sizing:border-box}
.hist-grid-header{height:34px;flex-shrink:0;background:var(--bg-elevated);padding-right:8px}
.hist-grid-header>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 ${spacing[3]};border-bottom:1px solid var(--border);border-left:1px solid var(--border);font-weight:500;text-transform:uppercase;font-size:${fonts.size.xs2};letter-spacing:.05em;color:var(--fg-dim);white-space:nowrap;justify-content:center}
.hist-grid-header>div:first-child{border-left:none}
.hist-grid-header>div.th-left{justify-content:flex-start}
.hist-grid-header>div.th-right{justify-content:flex-end}
.hist-grid-header>div.th-sortable{cursor:pointer;user-select:none}
.hist-grid-row{height:30px;background:var(--bg-surface)}
.hist-grid-row:hover{background:var(--bg-hover)}
.hist-grid-row:hover>div:first-child{box-shadow:inset 3px 0 0 0 ${colors.accent.cyan}80}
.hist-grid-wrapper.is-scrolling .hist-grid-row{pointer-events:none}
.hist-grid-row>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 ${spacing[3]};line-height:16px;border-bottom:1px solid var(--border);border-left:1px solid var(--border);white-space:nowrap;justify-content:center}
.hist-grid-row>div:first-child{border-left:none}
.hist-grid-row>div.h-left{justify-content:flex-start}
.hist-grid-row>div.h-right{justify-content:flex-end}
.hist-grid-row>div.h-mes{cursor:pointer}
.hist-grid-row>div>*{min-width:0}
.hist-grid-row>div.h-left>*{flex:1 1 0;text-align:left;overflow:hidden}
.hist-grid-row>div.h-right>*{flex:1 1 0;text-align:right;overflow:hidden}
.hist-grid-wrapper ::-webkit-scrollbar{width:8px}
.hist-grid-wrapper ::-webkit-scrollbar-track{background:transparent}
.hist-grid-wrapper ::-webkit-scrollbar-thumb{background:var(--fill);border-radius:4px}
`;

interface HistoricalRowCellsProps {
    entry: HistoricalEntry;
    useFullMonthFormat: boolean;
    userDateFormat: import("@/utils/date").DateFormat;
    onEdit?: (entry: HistoricalEntry) => void;
    onDelete?: (entry: HistoricalEntry) => void;
    onToggleFormat: () => void;
}

const HistoricalRowCells = memo(
    function HistoricalRowCells({
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
                <div className="h-left h-mes" onClick={onToggleFormat}>
                    <span className="selectable" style={monthSpanStyle}>
                        {formatMonth(entry.month, useFullMonthFormat, userDateFormat)}
                    </span>
                </div>
                <div className="h-right">
                    <Tooltip content={income}>
                        <span className="selectable" style={incomeStyle}>{income}</span>
                    </Tooltip>
                </div>
                <div className="h-right">
                    <Tooltip content={incomeFixed}>
                        <span className="selectable" style={moneyAltStyle}>{incomeFixed}</span>
                    </Tooltip>
                </div>
                <div className="h-right">
                    <Tooltip content={incomeVariable}>
                        <span className="selectable" style={moneyAltStyle}>{incomeVariable}</span>
                    </Tooltip>
                </div>
                <div className="h-right">
                    <Tooltip content={expense}>
                        <span className="selectable" style={expenseStyle}>{expense}</span>
                    </Tooltip>
                </div>
                <div className="h-right">
                    <Tooltip content={expenseFixed}>
                        <span className="selectable" style={moneyAltStyle}>{expenseFixed}</span>
                    </Tooltip>
                </div>
                <div className="h-right">
                    <Tooltip content={expenseVariable}>
                        <span className="selectable" style={moneyAltStyle}>{expenseVariable}</span>
                    </Tooltip>
                </div>
                <div className="h-right">
                    <Tooltip content={savings}>
                        <span className="selectable" style={savingsStyle}>{savings}</span>
                    </Tooltip>
                </div>
                <div>
                    <Tooltip content={rate}>
                        <span className="selectable" style={tcStyle}>{rate}</span>
                    </Tooltip>
                </div>
                <div>
                    <span className="selectable" style={sourceStyle}>
                        {isHistorical ? "Histórico" : "Transacciones"}
                    </span>
                </div>
                <div>
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
                </div>
            </>
        );
    },
    (p, n) =>
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

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const onEditRef = useRef(onEdit);
    onEditRef.current = onEdit;
    const onDeleteRef = useRef(onDelete);
    onDeleteRef.current = onDelete;
    const useFullMonthFormatRef = useRef(useFullMonthFormat);
    useFullMonthFormatRef.current = useFullMonthFormat;
    const userDateFormatRef = useRef(userDateFormat);
    userDateFormatRef.current = userDateFormat;

    const toggleMonthFormatRef = useRef(() => {
        setUseFullMonthFormat((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, next ? "full" : "default");
            } catch {}
            return next;
        });
    });

    const endReached = useCallback(() => {
        if (hasMore && !isLoadingMore) onLoadMore?.();
    }, [hasMore, isLoadingMore, onLoadMore]);

    const itemContent = useCallback(
        (_index: number, entry: HistoricalEntry) => (
            <div className="hist-grid-row">
                <HistoricalRowCells
                    entry={entry}
                    useFullMonthFormat={useFullMonthFormatRef.current}
                    userDateFormat={userDateFormatRef.current}
                    onEdit={onEditRef.current}
                    onDelete={onDeleteRef.current}
                    onToggleFormat={toggleMonthFormatRef.current}
                />
            </div>
        ),
        []
    );

    const sortIcon = (column: "month" | "income" | "expense" | "savings") => {
        const active = sort === column;
        const icon = !active ? "↕" : order === "desc" ? "▼" : "▲";
        return <span style={{ marginLeft: spacing[1], opacity: active ? 1 : 0.7 }}>{icon}</span>;
    };
    const activeColor = (column: "month" | "income" | "expense" | "savings") =>
        sort === column ? colors.fg.base : undefined;

    if (entries.length === 0) {
        return (
            <div
                style={{
                    padding: spacing[8],
                    textAlign: "center",
                    color: colors.fg.dim,
                    border: `1px solid transparent`,
                    borderRadius: radius.lg,
                }}
            >
                No hay datos
            </div>
        );
    }

    return (
        <div
            style={{
                position: "absolute",
                inset: "0 0 5% 0",
                ...flexColumn,
                overflow: "hidden",
                borderRadius: radius.lg,
                backgroundColor: colors.bg.surface,
                border: `1px solid transparent`,
            }}
        >
            <style>{STYLES}</style>
            <div
                ref={wrapperRef}
                className="hist-grid-wrapper"
                style={{ flex: 1, minHeight: 0, fontSize: fonts.size.sm2 }}
            >
                <div className="hist-grid-header">
                    <div
                        className="th-left th-sortable"
                        style={{ color: activeColor("month") }}
                        onClick={() => onSort?.("month")}
                    >
                        <span style={sortableThStyle}>Mes{sortIcon("month")}</span>
                    </div>
                    <div
                        className="th-right th-sortable"
                        style={{ color: activeColor("income") }}
                        onClick={() => onSort?.("income")}
                    >
                        <span style={sortableThStyle}>Ingreso{sortIcon("income")}</span>
                    </div>
                    <div className="th-right">Ing. Fijo</div>
                    <div className="th-right">Ing. Variable</div>
                    <div
                        className="th-right th-sortable"
                        style={{ color: activeColor("expense") }}
                        onClick={() => onSort?.("expense")}
                    >
                        <span style={sortableThStyle}>Egreso{sortIcon("expense")}</span>
                    </div>
                    <div className="th-right">Gas. Fijo</div>
                    <div className="th-right">Gas. Variable</div>
                    <div
                        className="th-right th-sortable"
                        style={{ color: activeColor("savings") }}
                        onClick={() => onSort?.("savings")}
                    >
                        <span style={sortableThStyle}>Ahorro{sortIcon("savings")}</span>
                    </div>
                    <div>T.C.</div>
                    <div>Fuente</div>
                    <div>Opciones</div>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Virtuoso<HistoricalEntry>
                        ref={virtuosoRef}
                        style={{ height: "100%", overflowY: "scroll" }}
                        data={entries}
                        itemContent={itemContent}
                        endReached={endReached}
                        increaseViewportBy={VIEWPORT_INCREASE}
                        defaultItemHeight={30}
                        atTopThreshold={400}
                        atTopStateChange={(atTop) => setShowScrollTop(!atTop)}
                        isScrolling={(scrolling) => {
                            wrapperRef.current?.classList.toggle("is-scrolling", scrolling);
                        }}
                    />
                </div>
            </div>
            {isLoadingMore && (
                <div
                    style={{
                        padding: spacing[2],
                        textAlign: "center",
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                    }}
                >
                    Cargando más...
                </div>
            )}
            {showScrollTop && (
                <button
                    onClick={() => virtuosoRef.current?.scrollToIndex(0)}
                    style={{
                        position: "absolute",
                        bottom: spacing[4],
                        right: spacing[4],
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: colors.bg.elevated,
                        border: `1px solid transparent`,
                        color: colors.fg.base,
                        cursor: "pointer",
                        ...flexRow,
                        justifyContent: "center",
                        zIndex: 10,
                        transition: "all 0.15s",
                    }}
                    title="Volver arriba"
                >
                    <ArrowUp size={18} />
                </button>
            )}
        </div>
    );
}
