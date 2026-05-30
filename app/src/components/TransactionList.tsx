import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { TableVirtuoso } from "react-virtuoso";
import type { TableVirtuosoHandle, TableProps } from "react-virtuoso";
import { TransactionRowCells } from "./TransactionRow";
import { TransactionRowEditCells } from "./TransactionRowEdit";
import { Check, Minus, ArrowUp, ArrowUpDown } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { thStyle, sortableThStyle } from "@/styles/table";
import { useUserConfig } from "@/hooks";
import { getDateFormat } from "@/utils/date";
import { flexColumn, flexRow } from "@/styles/layout";

const HEADER_CELL_STYLE: React.CSSProperties = {
    backgroundColor: colors.bg.elevated,
    zIndex: 3,
};

const TableRowComponent = (props: React.ComponentPropsWithRef<"tr">) => {
    const { children, style, ...rest } = props;
    return (
        <tr {...rest} style={style}>
            {children}
        </tr>
    );
};

const COL_WIDTHS = ["36px", "9%", "4%", "17%", "4%", "9%", "4%", "4%", "4%", "17%", "17%", "3%", "8%"];
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

export interface TransactionListHandle {
    notifyNewTransaction: (id: string, installmentGroupId: string | null) => void;
}

interface TransactionListProps {
    transactions: TransactionRowDTO[];
    sortField: "date" | "amount" | null;
    sortOrder: "asc" | "desc";
    onSortChange: (field: "date" | "amount" | null, order: "asc" | "desc") => void;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError?: boolean;
    onDelete?: (transaction: TransactionRowDTO) => void;
    onCancelInstallments?: (transaction: TransactionRowDTO) => void;
    selectedIds?: Set<string>;
    onToggleSelect?: (id: string, idx: number, shiftKey: boolean) => void;
    onToggleSelectAll?: () => void;
    isAllSelected?: boolean;
}


export const TransactionList = forwardRef<TransactionListHandle, TransactionListProps>(function TransactionList({
    transactions,
    sortField,
    sortOrder,
    onSortChange,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    onDelete,
    onCancelInstallments,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    isAllSelected,
}, ref) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const virtuosoRef = useRef<TableVirtuosoHandle>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const newIdsRef = useRef<Set<string>>(new Set());
    const newGroupIdsRef = useRef<Set<string>>(new Set());

    useImperativeHandle(ref, () => ({
        notifyNewTransaction: (id, installmentGroupId) => {
            newIdsRef.current.add(id);
            if (installmentGroupId) newGroupIdsRef.current.add(installmentGroupId);
            setTimeout(() => {
                newIdsRef.current.delete(id);
                if (installmentGroupId) newGroupIdsRef.current.delete(installmentGroupId);
            }, 3500);
        },
    }));

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const scroller = el.firstElementChild as HTMLElement | null;
        if (!scroller) return;
        const onScroll = () => setShowScrollTop(scroller.scrollTop > 400);
        scroller.addEventListener("scroll", onScroll, { passive: true });
        return () => scroller.removeEventListener("scroll", onScroll);
    }, []);


    const { data: userConfig } = useUserConfig();
    const userDateFormat = useMemo(
        () => getDateFormat(userConfig?.date_format),
        [userConfig?.date_format]
    );
    const userDateFormatRef = useRef(userDateFormat);
    userDateFormatRef.current = userDateFormat;

    const [textFormat, setTextFormat] = useState<"default" | "full">(() => {
        try {
            return (
                (localStorage.getItem("quant-date-text-format") as "default" | "full") || "default"
            );
        } catch {
            return "default";
        }
    });
    const textFormatRef = useRef(textFormat);
    textFormatRef.current = textFormat;

    const handleFormatClickRef = useRef(() => {
        setTextFormat((prev) => {
            const next = prev === "default" ? "full" : "default";
            try {
                localStorage.setItem("quant-date-text-format", next);
            } catch {}
            return next;
        });
    });

    useEffect(() => {
        const handle = () => {
            try {
                const stored =
                    (localStorage.getItem("quant-date-text-format") as "default" | "full") ||
                    "default";
                setTextFormat(stored);
            } catch {}
        };
        window.addEventListener("date-text-format-changed", handle);
        return () => window.removeEventListener("date-text-format-changed", handle);
    }, []);

    const editingIdRef = useRef(editingId);
    editingIdRef.current = editingId;

    const selectedIdsRef = useRef<Set<string>>(new Set());
    selectedIdsRef.current = selectedIds ?? new Set();

    const onDeleteRef = useRef(onDelete);
    onDeleteRef.current = onDelete;

    const onCancelInstallmentsRef = useRef(onCancelInstallments);
    onCancelInstallmentsRef.current = onCancelInstallments;

    const onToggleSelectRef = useRef(onToggleSelect);
    onToggleSelectRef.current = onToggleSelect;

    const onSortChangeRef = useRef(onSortChange);
    onSortChangeRef.current = onSortChange;

    const onToggleSelectAllRef = useRef(onToggleSelectAll);
    onToggleSelectAllRef.current = onToggleSelectAll;


    const sortFieldRef = useRef(sortField);
    sortFieldRef.current = sortField;

    const sortOrderRef = useRef(sortOrder);
    sortOrderRef.current = sortOrder;

    const fetchNextPageRef = useRef(fetchNextPage);
    fetchNextPageRef.current = fetchNextPage;

    const fixedHeaderContent = useCallback(() => {
        const hasPartial = !!selectedIds?.size && !isAllSelected;
        const dateActive = sortFieldRef.current === "date";
        const amountActive = sortFieldRef.current === "amount";
        const dateIcon = dateActive
            ? <span className="th-sort-icon">{sortOrderRef.current === "desc" ? "▼" : "▲"}</span>
            : <span className="th-sort-icon th-sort-idle"><ArrowUpDown size={11} /></span>;
        const amountIcon = amountActive
            ? <span className="th-sort-icon">{sortOrderRef.current === "desc" ? "▼" : "▲"}</span>
            : <span className="th-sort-icon th-sort-idle"><ArrowUpDown size={11} /></span>;
        return (
            <tr>
                <th
                    className="th-checkbox"
                    style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, position: "relative", borderLeft: "none", boxSizing: "border-box" }}
                >
                    <div className="checkbox-center">
                        <div className="checkbox-wrap">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={() => onToggleSelectAllRef.current?.()}
                                className="checkbox-input"
                                ref={el => { if (el) el.indeterminate = hasPartial; }}
                            />
                            <div
                                className="checkbox-vis"
                                style={{
                                    border: `1.5px solid ${isAllSelected || selectedIds?.size ? colors.fg.base : `${colors.fg.dim}40`}`,
                                    backgroundColor: isAllSelected
                                        ? colors.fg.base
                                        : selectedIds?.size
                                          ? `${colors.fg.base}20`
                                          : "transparent",
                                }}
                            >
                                {isAllSelected && (
                                    <span style={{ lineHeight: 0 }}>
                                        <Check size={10} color={colors.bg.base} strokeWidth={3} />
                                    </span>
                                )}
                                {hasPartial && (
                                    <span style={{ lineHeight: 0 }}>
                                        <Minus size={10} color={colors.fg.base} strokeWidth={3} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </th>
                <th
                    className="th-sortable th-left"
                    style={{ ...thStyle(true, dateActive, "left"), ...HEADER_CELL_STYLE, width: "9%" }}
                    onClick={() => {
                        const current = sortFieldRef.current;
                        const currentOrder = sortOrderRef.current;
                        if (current !== "date") {
                            onSortChangeRef.current("date", "desc");
                        } else if (currentOrder === "desc") {
                            onSortChangeRef.current("date", "asc");
                        } else {
                            onSortChangeRef.current(null, "desc");
                        }
                    }}
                >
                    <span style={sortableThStyle}>Fecha{dateIcon}</span>
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "4%" }}>
                    Tipo
                </th>
                <th
                    className="th-left"
                    style={{ ...thStyle(false, false, "left"), ...HEADER_CELL_STYLE, width: "17%" }}
                >
                    Descripción
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "4%" }}>
                    Ctas.
                </th>
                <th
                    className="th-sortable th-right"
                    style={{
                        ...thStyle(true, amountActive, "right"),
                        ...HEADER_CELL_STYLE,
                        width: "9%",
                    }}
                    onClick={() => {
                        const current = sortFieldRef.current;
                        const currentOrder = sortOrderRef.current;
                        if (current !== "amount") {
                            onSortChangeRef.current("amount", "desc");
                        } else if (currentOrder === "desc") {
                            onSortChangeRef.current("amount", "asc");
                        } else {
                            onSortChangeRef.current(null, "desc");
                        }
                    }}
                >
                    <span style={sortableThStyle}>Monto{amountIcon}</span>
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "4%" }}>
                    Mon.
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "4%" }}>
                    T.C.
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "4%" }}>
                    Frec.
                </th>
                <th
                    className="th-left"
                    style={{ ...thStyle(false, false, "left"), ...HEADER_CELL_STYLE, width: "17%" }}
                >
                    Categoría
                </th>
                <th
                    className="th-left"
                    style={{ ...thStyle(false, false, "left"), ...HEADER_CELL_STYLE, width: "17%" }}
                >
                    Método de pago
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "3%" }}>
                    Est.
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "8%" }}>
                    Opciones
                </th>
            </tr>
        );
    }, [isAllSelected, selectedIds?.size]);

    const itemContent = useCallback(
        (_index: number, tx: TransactionRowDTO) => {
            const editId = editingIdRef.current;
            if (editId === tx.id) {
                return (
                    <TransactionRowEditCells
                        transaction={tx}
                        onSave={() => {
                            editingIdRef.current = null;
                            setEditingId(null);
                        }}
                        onCancel={() => {
                            editingIdRef.current = null;
                            setEditingId(null);
                        }}
                    />
                );
            }

            return (
                <TransactionRowCells
                    transaction={tx}
                    onDelete={onDeleteRef.current}
                    onCancelInstallments={onCancelInstallmentsRef.current}
                    onStartEdit={() => {
                        editingIdRef.current = tx.id;
                        setEditingId(tx.id);
                    }}
                    isSelected={selectedIdsRef.current.has(tx.id)}
                    onToggleSelect={(shiftKey) =>
                        onToggleSelectRef.current?.(tx.id, _index, shiftKey)
                    }
                    userDateFormat={userDateFormatRef.current}
                    textFormat={textFormatRef.current}
                    onFormatClick={() => handleFormatClickRef.current()}
                    isNew={
                        newIdsRef.current.has(tx.id) ||
                        (!!tx.installment_group_id && newGroupIdsRef.current.has(tx.installment_group_id))
                    }
                />
            );
        },
        []
    );

    const endReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPageRef.current();
        }
    }, [hasNextPage, isFetchingNextPage]);

    if (transactions.length === 0) {
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
                No hay transacciones
            </div>
        );
    }

    return (
        <div style={{ height: "95%", ...flexColumn }}>
            <div
                style={{
                    borderRadius: radius.lg,
                    overflow: "hidden",
                    backgroundColor: colors.bg.surface,
                    border: `1px solid transparent`,
                    flex: 1,
                    ...flexColumn,
                    position: "relative",
                }}
            >
                <style>
                    {`.virtuoso-table-wrapper table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0}
.virtuoso-table-wrapper.is-scrolling td{pointer-events:none}
.virtuoso-table-wrapper tbody tr{background:var(--bg-surface)}
.virtuoso-table-wrapper tbody tr:hover{background:var(--bg-hover)}
.virtuoso-table-wrapper tbody tr:hover td:first-child{box-shadow:inset 3px 0 0 0 ${colors.accent.cyan}80}
.virtuoso-table-wrapper td{padding:0 ${spacing[2]};height:30px;line-height:16px;vertical-align:middle;text-align:center;border-bottom:1px solid var(--fill);border-left:1px solid var(--fill)}
.virtuoso-table-wrapper td:first-child{border-left:none}
.virtuoso-table-wrapper th:first-child{border-left:none}
.virtuoso-table-wrapper .td-center{text-align:center}
.virtuoso-table-wrapper .td-left{text-align:left}
.virtuoso-table-wrapper .td-right{text-align:right}
.virtuoso-table-wrapper .badge{font-size:${fonts.size.xs2};padding:${spacing[1]} ${spacing[2]};border-radius:${radius.md};text-transform:uppercase;font-weight:500}
.virtuoso-table-wrapper .text-sub{font-size:11.5px;color:var(--fg-dim)}
.virtuoso-table-wrapper .text-trunc{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.virtuoso-table-wrapper .amount{font-family:${fonts.family};font-weight:500;font-size:${fonts.size.sm2};color:var(--fg-base)}
.virtuoso-table-wrapper .amount-alt{font-family:${fonts.family};font-size:11.5px;color:var(--fg-dim)}
.virtuoso-table-wrapper .checkbox-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);line-height:0}
.virtuoso-table-wrapper .checkbox-wrap{position:relative;width:17px;height:17px;display:flex;align-items:center;justify-content:center}
.virtuoso-table-wrapper .checkbox-input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;margin:0}
.virtuoso-table-wrapper .checkbox-vis{width:14px;height:14px;border-radius:4px;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:background-color .12s,border-color .12s}
.virtuoso-table-wrapper .td-checkbox{width:36px;min-width:36px;max-width:36px;position:relative}
.virtuoso-table-wrapper .td-fecha{width:9%;min-width:9%;max-width:9%;cursor:pointer;font-size:${fonts.size.sm2}}
.virtuoso-table-wrapper .td-desc{width:17%;min-width:17%;max-width:17%}
.virtuoso-table-wrapper .td-cuotas{width:4%;min-width:4%;max-width:4%}
.virtuoso-table-wrapper .td-tipo{width:4%;min-width:4%;max-width:4%}
.virtuoso-table-wrapper .td-cat{width:17%;min-width:17%;max-width:17%}
.virtuoso-table-wrapper .td-canal{width:17%;min-width:17%;max-width:17%}
.virtuoso-table-wrapper .td-monto{width:9%;min-width:9%;max-width:9%}
.virtuoso-table-wrapper .td-mon{width:4%;min-width:4%;max-width:4%}
.virtuoso-table-wrapper .td-tc{width:4%;min-width:4%;max-width:4%}
.virtuoso-table-wrapper .td-frec{width:4%;min-width:4%;max-width:4%}
.virtuoso-table-wrapper .td-estado{width:3%;min-width:3%;max-width:3%}
.virtuoso-table-wrapper .td-opciones{width:8%;min-width:8%;max-width:8%}
.virtuoso-table-wrapper .th-checkbox{width:36px;min-width:36px;max-width:36px;position:relative}
.virtuoso-table-wrapper th{padding:${spacing[1]} ${spacing[2]};font-weight:500;text-transform:uppercase;font-size:${fonts.size.xs2};letter-spacing:.05em;white-space:nowrap;border-bottom:1px solid var(--fill);border-left:1px solid var(--fill);background:var(--bg-elevated);z-index:3}
.virtuoso-table-wrapper .th-sortable{cursor:pointer;user-select:none}
.virtuoso-table-wrapper .th-sort-icon{font-size:11px;line-height:1;margin-left:${spacing[1]};vertical-align:middle;display:inline-flex}
.virtuoso-table-wrapper .th-sort-idle{opacity:0.5}
.virtuoso-table-wrapper .th-left{text-align:left}
.virtuoso-table-wrapper .th-right{text-align:right}
.virtuoso-table-wrapper ::-webkit-scrollbar{width:8px}
.virtuoso-table-wrapper ::-webkit-scrollbar-track{background:transparent}
.virtuoso-table-wrapper ::-webkit-scrollbar-thumb{background:var(--fill);border-radius:4px}
@keyframes row-new-border{0%,65%{box-shadow:inset 4px 0 0 0 ${colors.accent.purple}}100%{box-shadow:inset 4px 0 0 0 transparent}}
@keyframes row-new-bg{0%,65%{background-color:${colors.bg.elevated}}100%{background-color:transparent}}
.virtuoso-table-wrapper .td-new{animation:row-new-border 3s ease-out forwards,row-new-bg 3s ease-out forwards}
.virtuoso-table-wrapper .td-new~td{animation:row-new-bg 3s ease-out forwards}`}
                </style>
                <div
                    ref={wrapperRef}
                    className="virtuoso-table-wrapper"
                    style={{ flex: 1, minHeight: 0, fontSize: fonts.size.sm2, fontWeight: fonts.weight.medium }}
                >
                    <TableVirtuoso<TransactionRowDTO>
                        ref={virtuosoRef}
                        style={{ height: "100%" }}
                        data={transactions}
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
                {isFetchNextPageError && (
                    <div style={{
                        position: "absolute",
                        bottom: spacing[4],
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: colors.bg.elevated,
                        border: `1px solid ${colors.accent.red}40`,
                        borderRadius: "8px",
                        padding: `${spacing[2]} ${spacing[3]}`,
                        fontSize: fonts.size.xs,
                        color: colors.accent.red,
                        zIndex: 10,
                        cursor: "pointer",
                    }}
                    onClick={() => fetchNextPageRef.current()}
                    title="Reintentar"
                    >
                        Error al cargar más — clic para reintentar
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
        </div>
    );
});
