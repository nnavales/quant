import {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useMemo,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from "react";
import type { TransactionRowDTO } from "@/api_client";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import { TransactionRowCells } from "./TransactionRow";
import { TransactionRowEditCells } from "./TransactionRowEdit";
import { Check, Minus, ArrowUp, ArrowUpDown } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { sortableThStyle } from "@/styles/table";
import { useUserConfig } from "@/hooks";
import { getDateFormat } from "@/utils/date";
import { flexColumn, flexRow } from "@/styles/layout";

// CSS grid columns — replaces the old <colgroup>/table-layout:fixed. The grid is
// what makes this immune to the WebKit table row-height-distribution bug: div rows
// with a hard height:30px cannot be stretched by any table layout algorithm.
const GRID_COLS = "36px 7fr 5fr 17fr 4fr 9fr 4fr 5fr 4fr 17fr 17fr 3fr 8fr";

const VIEWPORT_INCREASE = { top: 200, bottom: 200 };

const STYLES = `
.tx-grid-wrapper{display:flex;flex-direction:column}
.tx-grid-header,.tx-grid-row{display:grid;grid-template-columns:${GRID_COLS};box-sizing:border-box}
.tx-grid-header{height:34px;flex-shrink:0;background:var(--bg-elevated);padding-right:8px}
.tx-grid-header>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 ${spacing[2]};border-bottom:1px solid var(--border);border-left:1px solid var(--border);font-weight:500;text-transform:uppercase;font-size:${fonts.size.xs2};letter-spacing:.05em;color:var(--fg-dim);white-space:nowrap;justify-content:center}
.tx-grid-header>div:first-child{border-left:none;position:relative}
.tx-grid-header>div.th-left{justify-content:flex-start}
.tx-grid-header>div.th-right{justify-content:flex-end}
.tx-grid-header>div.th-sortable{cursor:pointer;user-select:none}
.tx-grid-row{height:30px;background:var(--bg-surface)}
.tx-grid-row:hover{background:var(--bg-hover)}
.tx-grid-row:hover>div:first-child{box-shadow:inset 3px 0 0 0 ${colors.accent.cyan}80}
.tx-grid-wrapper.is-scrolling .tx-grid-row{pointer-events:none}
.tx-grid-row>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 ${spacing[2]};line-height:16px;border-bottom:1px solid var(--border);border-left:1px solid var(--border);white-space:nowrap;justify-content:center}
.tx-grid-row>div:first-child{border-left:none}
.tx-grid-row>div.td-left{justify-content:flex-start}
.tx-grid-row>div.td-right{justify-content:flex-end}
.tx-grid-row>div.td-checkbox{position:relative}
.tx-grid-row>div>*{min-width:0}
.tx-grid-row>div.td-left>*{flex:1 1 0;text-align:left;overflow:hidden}
.tx-grid-row>div.td-right>*{flex:1 1 0;text-align:right;overflow:hidden}
.tx-grid-wrapper .text-sub{font-size:${fonts.size.xs2};color:var(--fg-dim)}
.tx-grid-wrapper .text-trunc{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-grid-wrapper .amount{font-family:${fonts.family};font-weight:500;font-size:${fonts.size.sm2};color:var(--fg-base);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-grid-wrapper .amount-alt{font-family:${fonts.family};font-size:11.5px;color:var(--fg-dim)}
.tx-grid-row>div.td-right .text-trunc,.tx-grid-row>div.td-right .amount{text-align:right}
.tx-grid-wrapper .checkbox-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);line-height:0}
.tx-grid-wrapper .checkbox-wrap{position:relative;width:17px;height:17px;display:flex;align-items:center;justify-content:center}
.tx-grid-wrapper .checkbox-input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;margin:0}
.tx-grid-wrapper .checkbox-vis{width:14px;height:14px;border-radius:4px;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:background-color .12s,border-color .12s}
.tx-grid-wrapper ::-webkit-scrollbar{width:8px}
.tx-grid-wrapper ::-webkit-scrollbar-track{background:transparent}
.tx-grid-wrapper ::-webkit-scrollbar-thumb{background:var(--fill);border-radius:4px}
@keyframes row-new-border{0%,65%{box-shadow:inset 4px 0 0 0 ${colors.accent.purple}}100%{box-shadow:inset 4px 0 0 0 transparent}}
@keyframes row-new-bg{0%,65%{background-color:${colors.bg.elevated}}100%{background-color:transparent}}
.tx-grid-row>div.td-new{animation:row-new-border 3s ease-out forwards,row-new-bg 3s ease-out forwards}
.tx-grid-row>div.td-new~div{animation:row-new-bg 3s ease-out forwards}
`;

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

export const TransactionList = forwardRef<TransactionListHandle, TransactionListProps>(
    function TransactionList(
        {
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
        },
        ref
    ) {
        const [editingId, setEditingId] = useState<string | null>(null);
        const virtuosoRef = useRef<VirtuosoHandle>(null);
        const wrapperRef = useRef<HTMLDivElement>(null);
        const [showScrollTop, setShowScrollTop] = useState(false);
        const newIdsRef = useRef<Set<string>>(new Set());
        const newGroupIdsRef = useRef<Set<string>>(new Set());

        // Snap the table height so the scroller holds a whole number of 30px rows (no half-row at
        // the bottom) while leaving ~7% breathing room. chrome (header + borders) is measured live
        // so it stays correct regardless of styling; measuring pre-paint avoids a first-frame flash,
        // and we skip while hidden (offsetParent null).
        const rootRef = useRef<HTMLDivElement>(null);
        const scrollerRef = useRef<HTMLDivElement>(null);
        const [snapH, setSnapH] = useState<number>();
        const recomputeHeight = useCallback(() => {
            const el = rootRef.current, sc = scrollerRef.current;
            if (!el || !el.offsetParent || !sc) return;
            const ROW = 30;
            const chrome = el.getBoundingClientRect().height - sc.getBoundingClientRect().height;
            const avail = (window.innerHeight - el.getBoundingClientRect().top) * 0.93;
            const rows = Math.max(ROW, Math.floor((avail - chrome) / ROW) * ROW);
            setSnapH(chrome + rows);
        }, []);
        useLayoutEffect(() => { recomputeHeight(); });
        useLayoutEffect(() => {
            const el = rootRef.current;
            if (!el) return;
            const ro = new ResizeObserver(recomputeHeight);
            if (el.parentElement) ro.observe(el.parentElement);
            window.addEventListener("resize", recomputeHeight);
            return () => { ro.disconnect(); window.removeEventListener("resize", recomputeHeight); };
        }, [recomputeHeight]);

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
                    (localStorage.getItem("quant-date-text-format") as "default" | "full") ||
                    "default"
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

        const fetchNextPageRef = useRef(fetchNextPage);
        fetchNextPageRef.current = fetchNextPage;

        const handleSort = (field: "date" | "amount") => {
            if (sortField !== field) {
                onSortChange(field, "desc");
            } else if (sortOrder === "desc") {
                onSortChange(field, "asc");
            } else {
                onSortChange(null, "desc");
            }
        };

        const itemContent = useCallback((index: number, tx: TransactionRowDTO) => {
            const isEditing = editingIdRef.current === tx.id;
            return (
                <div className="tx-grid-row" style={isEditing ? { height: "30px", backgroundColor: colors.bg.elevated } : undefined}>
                    {isEditing ? (
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
                    ) : (
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
                                onToggleSelectRef.current?.(tx.id, index, shiftKey)
                            }
                            userDateFormat={userDateFormatRef.current}
                            textFormat={textFormatRef.current}
                            onFormatClick={() => handleFormatClickRef.current()}
                            isNew={
                                newIdsRef.current.has(tx.id) ||
                                (!!tx.installment_group_id &&
                                    newGroupIdsRef.current.has(tx.installment_group_id))
                            }
                        />
                    )}
                </div>
            );
        }, []);

        const endReached = useCallback(() => {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPageRef.current();
            }
        }, [hasNextPage, isFetchingNextPage]);

        const hasPartial = !!selectedIds?.size && !isAllSelected;
        const dateActive = sortField === "date";
        const amountActive = sortField === "amount";
        const sortIcon = (active: boolean) =>
            active ? (
                <span className="th-sort-icon" style={{ marginLeft: spacing[1] }}>
                    {sortOrder === "desc" ? "▼" : "▲"}
                </span>
            ) : (
                <span style={{ marginLeft: spacing[1], opacity: 0.5, display: "inline-flex" }}>
                    <ArrowUpDown size={11} strokeWidth={2.5} />
                </span>
            );

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
            <div ref={rootRef} style={{ height: snapH ?? "93%", ...flexColumn }}>
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
                    <style>{STYLES}</style>
                    <div
                        ref={wrapperRef}
                        className="tx-grid-wrapper"
                        style={{
                            flex: 1,
                            minHeight: 0,
                            fontSize: fonts.size.sm2,
                            fontWeight: fonts.weight.medium,
                        }}
                    >
                        <div className="tx-grid-header">
                            <div className="th-checkbox">
                                <div className="checkbox-center">
                                    <div className="checkbox-wrap">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={() => onToggleSelectAll?.()}
                                            className="checkbox-input"
                                            ref={(el) => {
                                                if (el) el.indeterminate = hasPartial;
                                            }}
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
                                                    <Check size={10} strokeWidth={2.5} color={colors.bg.base} />
                                                </span>
                                            )}
                                            {hasPartial && (
                                                <span style={{ lineHeight: 0 }}>
                                                    <Minus size={10} strokeWidth={2.5} color={colors.fg.base} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="th-left th-sortable"
                                style={{ color: dateActive ? colors.fg.base : undefined }}
                                onClick={() => handleSort("date")}
                            >
                                <span style={sortableThStyle}>Fecha{sortIcon(dateActive)}</span>
                            </div>
                            <div>Tipo</div>
                            <div className="th-left">Descripción</div>
                            <div>Ctas.</div>
                            <div
                                className="th-right th-sortable"
                                style={{ color: amountActive ? colors.fg.base : undefined }}
                                onClick={() => handleSort("amount")}
                            >
                                <span style={sortableThStyle}>Monto{sortIcon(amountActive)}</span>
                            </div>
                            <div>Mon.</div>
                            <div className="th-right">T.C.</div>
                            <div>Frec.</div>
                            <div className="th-left">Categoría</div>
                            <div className="th-left">Método de pago</div>
                            <div>Est.</div>
                            <div>Opciones</div>
                        </div>
                        <div ref={scrollerRef} style={{ flex: 1, minHeight: 0 }}>
                            <Virtuoso<TransactionRowDTO>
                                ref={virtuosoRef}
                                style={{ height: "100%", overflowY: "scroll" }}
                                data={transactions}
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
                    {isFetchNextPageError && (
                        <div
                            style={{
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
                            <ArrowUp size={18} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>
        );
    }
);
