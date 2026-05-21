import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { GroupedTableVirtuoso } from "react-virtuoso";
import type { GroupedTableVirtuosoHandle } from "react-virtuoso";
import { TransactionRowCells } from "./TransactionRow";
import { TransactionRowEditCells } from "./TransactionRowEdit";
import { Check, Minus } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { thStyle, sortableThStyle } from "@/styles/table";
import { useUserConfig } from "@/hooks";
import { getDateFormat } from "@/utils/date";

const HEADER_CELL_STYLE: React.CSSProperties = {
    backgroundColor: colors.bg.header,
    zIndex: 3,
};

const TableRowComponent = (props: any) => {
    const { children, style, ...rest } = props;
    return (
        <tr {...rest} style={style}>
            {children}
        </tr>
    );
};

const COMPONENTS = { TableRow: TableRowComponent };

const VIEWPORT_INCREASE = { top: 200, bottom: 200 };

interface TransactionListProps {
    transactions: TransactionRowDTO[];
    order: "asc" | "desc";
    onToggleOrder: () => void;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onDelete?: (transaction: TransactionRowDTO) => void;
    onCancelInstallments?: (transaction: TransactionRowDTO) => void;
    selectedIds?: Set<string>;
    onToggleSelect?: (id: string, idx: number, shiftKey: boolean) => void;
    onToggleSelectAll?: () => void;
    isAllSelected?: boolean;
}

const monthNames = [
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

function formatMonth(month: string): string {
    const [year, num] = month.split("-");
    const m = monthNames[parseInt(num, 10) - 1];
    return `${m} ${year}`;
}

function calcGroupCounts(txns: TransactionRowDTO[]): number[] {
    if (txns.length === 0) return [];
    const counts: number[] = [];
    let currentMonth = txns[0].date.substring(0, 7);
    let count = 0;
    for (const tx of txns) {
        const m = tx.date.substring(0, 7);
        if (m !== currentMonth) {
            counts.push(count);
            currentMonth = m;
            count = 1;
        } else {
            count++;
        }
    }
    counts.push(count);
    return counts;
}

export function TransactionList({
    transactions,
    order,
    onToggleOrder,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onDelete,
    onCancelInstallments,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    isAllSelected,
}: TransactionListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const virtuosoRef = useRef<GroupedTableVirtuosoHandle>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

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

    const onToggleOrderRef = useRef(onToggleOrder);
    onToggleOrderRef.current = onToggleOrder;

    const onToggleSelectAllRef = useRef(onToggleSelectAll);
    onToggleSelectAllRef.current = onToggleSelectAll;

    const isAllSelectedRef = useRef(isAllSelected);
    isAllSelectedRef.current = isAllSelected;

    const orderRef = useRef(order);
    orderRef.current = order;

    const checkboxInputRef = useRef<HTMLInputElement>(null);
    const checkboxVisualRef = useRef<HTMLDivElement>(null);
    const checkIconWrapperRef = useRef<HTMLSpanElement>(null);
    const minusIconWrapperRef = useRef<HTMLSpanElement>(null);

    const fetchNextPageRef = useRef(fetchNextPage);
    fetchNextPageRef.current = fetchNextPage;

    const groupCounts = useMemo(() => calcGroupCounts(transactions), [transactions]);

    const groupMonths = useMemo(() => {
        const months: string[] = [];
        let idx = 0;
        for (const count of groupCounts) {
            months.push(transactions[idx].date.substring(0, 7));
            idx += count;
        }
        return months;
    }, [groupCounts, transactions]);

    const groupMonthsRef = useRef(groupMonths);
    groupMonthsRef.current = groupMonths;

    const monthCache = useMemo(() => {
        const cache = new Map<string, string>();
        for (const m of groupMonths) cache.set(m, formatMonth(m));
        return cache;
    }, [groupMonths]);

    const monthCacheRef = useRef(monthCache);
    monthCacheRef.current = monthCache;

    useEffect(() => {
        const input = checkboxInputRef.current;
        const visual = checkboxVisualRef.current;
        if (!input || !visual) return;

        const hasPartial = !!selectedIds?.size && !isAllSelected;
        input.indeterminate = hasPartial;
        input.checked = !!isAllSelected;

        visual.style.border = `1.5px solid ${isAllSelected || selectedIds?.size ? colors.fg.base : colors.border}`;
        visual.style.backgroundColor = isAllSelected
            ? colors.fg.base
            : selectedIds?.size
              ? `${colors.fg.base}20`
              : "transparent";

        const checkEl = checkIconWrapperRef.current;
        const minusEl = minusIconWrapperRef.current;
        if (checkEl) checkEl.style.display = isAllSelected ? "" : "none";
        if (minusEl) minusEl.style.display = !!selectedIds?.size && !isAllSelected ? "" : "none";
    }, [isAllSelected, selectedIds?.size]);

    const fixedHeaderContent = useCallback(() => {
        const icon = (
            <span className="th-sort-icon">{orderRef.current === "desc" ? "▼" : "▲"}</span>
        );
        return (
            <tr>
                <th
                    className="th-checkbox"
                    style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, position: "relative" }}
                >
                    <div className="checkbox-center">
                        <div className="checkbox-wrap">
                            <input
                                type="checkbox"
                                ref={checkboxInputRef}
                                onChange={() => onToggleSelectAllRef.current?.()}
                                className="checkbox-input"
                            />
                            <div
                                ref={checkboxVisualRef}
                                className="checkbox-vis"
                                style={{
                                    border: `1.5px solid ${colors.border}`,
                                    backgroundColor: "transparent",
                                }}
                            >
                                <span
                                    ref={checkIconWrapperRef}
                                    style={{
                                        display: isAllSelectedRef.current ? "" : "none",
                                        lineHeight: 0,
                                    }}
                                >
                                    <Check size={10} color={colors.bg.base} strokeWidth={3} />
                                </span>
                                <span
                                    ref={minusIconWrapperRef}
                                    style={{
                                        display:
                                            !!selectedIdsRef.current.size &&
                                            !isAllSelectedRef.current
                                                ? ""
                                                : "none",
                                        lineHeight: 0,
                                    }}
                                >
                                    <Minus size={10} color={colors.fg.base} strokeWidth={3} />
                                </span>
                            </div>
                        </div>
                    </div>
                </th>
                <th
                    className="th-sortable th-left"
                    style={{ ...thStyle(true, true, "left"), ...HEADER_CELL_STYLE, width: "9%" }}
                    onClick={() => onToggleOrderRef.current()}
                >
                    <span style={sortableThStyle}>Fecha{icon}</span>
                </th>
                <th
                    className="th-left"
                    style={{ ...thStyle(false, false, "left"), ...HEADER_CELL_STYLE, width: "18%" }}
                >
                    Descripción
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "6%" }}>
                    Tipo
                </th>
                <th
                    className="th-left"
                    style={{ ...thStyle(false, false, "left"), ...HEADER_CELL_STYLE, width: "12%" }}
                >
                    Categoría
                </th>
                <th
                    className="th-left"
                    style={{ ...thStyle(false, false, "left"), ...HEADER_CELL_STYLE, width: "12%" }}
                >
                    Canal
                </th>
                <th
                    className="th-right"
                    style={{
                        ...thStyle(false, false, "right"),
                        ...HEADER_CELL_STYLE,
                        width: "12%",
                    }}
                >
                    Monto
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "5%" }}>
                    Mon.
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "6%" }}>
                    T.C.
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "5%" }}>
                    Frec.
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "7%" }}>
                    Estado
                </th>
                <th style={{ ...thStyle(false, false), ...HEADER_CELL_STYLE, width: "8%" }}>
                    Opciones
                </th>
            </tr>
        );
    }, []);

    const groupContent = useCallback((groupIndex: number) => {
        const month = groupMonthsRef.current[groupIndex];
        return (
            <th
                colSpan={12}
                className="group-cell"
                style={{ fontSize: fonts.table.header, paddingLeft: "48px", textAlign: "left" }}
            >
                {monthCacheRef.current.get(month) ?? month}
            </th>
        );
    }, []);

    const itemContent = useCallback(
        (_index: number, _groupIndex: number, tx: TransactionRowDTO) => {
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
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                }}
            >
                No hay transacciones
            </div>
        );
    }

    return (
        <div style={{ height: "100%", maxHeight: 755, display: "flex", flexDirection: "column" }}>
            <div
                style={{
                    borderRadius: radius.lg,
                    overflow: "hidden",
                    backgroundColor: colors.bg.surface,
                    border: `1px solid ${colors.fill}`,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
            }}
        >
            <style>
                {`.virtuoso-table-wrapper table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0}
.virtuoso-table-wrapper.is-scrolling td{pointer-events:none}
.virtuoso-table-wrapper tbody tr{background:var(--bg-surface)}
.virtuoso-table-wrapper tbody tr:hover{background:var(--bg-hover)}
.virtuoso-table-wrapper td{height:48px;padding:${spacing[1]} ${spacing[3]};vertical-align:middle;text-align:center;border-bottom:1px solid var(--fill);border-left:1px solid var(--fill)}
.virtuoso-table-wrapper td:first-child{border-left:none}
.virtuoso-table-wrapper .td-center{text-align:center}
.virtuoso-table-wrapper .td-left{text-align:left}
.virtuoso-table-wrapper .td-right{text-align:right}
.virtuoso-table-wrapper .badge{font-size:${fonts.table.badge};padding:${spacing[1]} ${spacing[2]};border-radius:${radius.md};text-transform:uppercase;font-weight:500}
.virtuoso-table-wrapper .text-sub{font-size:${fonts.table.meta};color:var(--fg-dim)}
.virtuoso-table-wrapper .text-trunc{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.virtuoso-table-wrapper .amount{font-family:${fonts.family.display};font-weight:500;font-size:${fonts.table.amount};color:var(--fg-base)}
.virtuoso-table-wrapper .amount-alt{font-family:${fonts.family.display};font-size:${fonts.table.meta};color:var(--fg-dim);opacity:.7}
.virtuoso-table-wrapper .checkbox-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);line-height:0}
.virtuoso-table-wrapper .checkbox-wrap{position:relative;width:17px;height:17px;display:flex;align-items:center;justify-content:center}
.virtuoso-table-wrapper .checkbox-input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;margin:0}
.virtuoso-table-wrapper .checkbox-vis{width:14px;height:14px;border-radius:4px;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:background-color .12s,border-color .12s}
.virtuoso-table-wrapper .td-checkbox{width:36px;min-width:36px;max-width:36px;position:relative}
.virtuoso-table-wrapper .td-fecha{width:9%;min-width:9%;max-width:9%;cursor:pointer}
.virtuoso-table-wrapper .td-desc{width:18%;min-width:18%;max-width:18%}
.virtuoso-table-wrapper .td-tipo{width:6%;min-width:6%;max-width:6%}
.virtuoso-table-wrapper .td-cat{width:12%;min-width:12%;max-width:12%}
.virtuoso-table-wrapper .td-canal{width:12%;min-width:12%;max-width:12%}
.virtuoso-table-wrapper .td-monto{width:12%;min-width:12%;max-width:12%}
.virtuoso-table-wrapper .td-mon{width:5%;min-width:5%;max-width:5%}
.virtuoso-table-wrapper .td-tc{width:6%;min-width:6%;max-width:6%}
.virtuoso-table-wrapper .td-frec{width:5%;min-width:5%;max-width:5%}
.virtuoso-table-wrapper .td-estado{width:7%;min-width:7%;max-width:7%}
.virtuoso-table-wrapper .td-opciones{width:8%;min-width:8%;max-width:8%}
.virtuoso-table-wrapper .th-checkbox{width:36px;min-width:36px;max-width:36px;position:relative}
.virtuoso-table-wrapper .group-cell{height:32px;padding:${spacing[1]} ${spacing[3]};background:var(--bg-header);font-weight:500;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--fill);color:var(--fg-dim);border-left:none}
.virtuoso-table-wrapper th{padding:${spacing[2]} ${spacing[3]};font-weight:500;text-transform:uppercase;font-size:${fonts.table.header};letter-spacing:.05em;white-space:nowrap;border-bottom:1px solid var(--fill);border-left:1px solid var(--fill);background:var(--bg-header);z-index:3}
.virtuoso-table-wrapper .th-sortable{cursor:pointer;user-select:none}
.virtuoso-table-wrapper .th-sort-icon{font-size:11px;line-height:1;margin-left:${spacing[1]}}
.virtuoso-table-wrapper .th-left{text-align:left}
.virtuoso-table-wrapper .th-right{text-align:right}
.virtuoso-table-wrapper ::-webkit-scrollbar{width:8px}
.virtuoso-table-wrapper ::-webkit-scrollbar-track{background:transparent}
.virtuoso-table-wrapper ::-webkit-scrollbar-thumb{background:var(--fill);border-radius:4px}`}
            </style>
            <div
                ref={wrapperRef}
                className="virtuoso-table-wrapper"
                style={{ flex: 1, minHeight: 0, fontSize: fonts.table.body }}
            >
                <GroupedTableVirtuoso<TransactionRowDTO>
                    ref={virtuosoRef}
                    style={{ height: "100%" }}
                    data={transactions}
                    groupCounts={groupCounts}
                    fixedHeaderContent={fixedHeaderContent}
                    groupContent={groupContent}
                    itemContent={itemContent}
                    endReached={endReached}
                    increaseViewportBy={VIEWPORT_INCREASE}
                    components={COMPONENTS}
                    fixedItemHeight={48}
                    isScrolling={(scrolling) => {
                        wrapperRef.current?.classList.toggle("is-scrolling", scrolling);
                    }}
                />
            </div>
            </div>
        </div>
    );
}
