import { useState, useEffect, useMemo, useRef } from "react";
import type { TransactionFilters } from "@/api_client";
import type { TransactionRowDTO, TransactionIDAmount } from "@/api_client/types";
import { TransactionList } from "@/components/TransactionList";
import type { TransactionListHandle } from "@/components/TransactionList";
import { TransactionFilters as TransactionFiltersComponent } from "@/components/TransactionFilters";
import { TransactionFlowModal } from "@/components/TransactionFlowModal";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    useInfiniteTransactions,
    useDeleteTransaction,
    useBulkDeleteTransactions,
    useCancelInstallments,
} from "@/hooks";
import { transactionAggregates } from "@/api_client";
import { formatNumber } from "@/utils/format";
import { spacing, colors, radius, flexColumn, flexRow } from "@/styles";
import { fonts } from "@/styles/fonts";

const Sep = () => (
    <span
        style={{
            color: colors.border,
            width: "1px",
            alignSelf: "stretch",
            display: "inline-block",
        }}
    />
);

export function TransactionsPage() {
    const [filters, setFilters] = useState<TransactionFilters>({ limit: 30 });
    const sortField: "date" | "amount" | null =
        filters.sort === "date" || filters.sort === "amount" ? filters.sort : null;
    const sortOrder = filters.order ?? "desc";
    const [deleteConfirm, setDeleteConfirm] = useState<TransactionRowDTO | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState<TransactionRowDTO | null>(null);
    const [flowModal, setFlowModal] = useState<"picker" | "transaction" | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [allSelectedData, setAllSelectedData] = useState<TransactionIDAmount[] | null>(null);
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

    const toggleSelect = (id: string, idx: number, shiftKey: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (shiftKey && lastClickedIndex !== null) {
                const start = Math.min(lastClickedIndex, idx);
                const end = Math.max(lastClickedIndex, idx);
                let allSelected = true;
                for (let i = start; i <= end; i++) {
                    if (!next.has(transactions[i].id)) {
                        allSelected = false;
                        break;
                    }
                }
                for (let i = start; i <= end; i++) {
                    if (allSelected) next.delete(transactions[i].id);
                    else next.add(transactions[i].id);
                }
            } else {
                if (next.has(id)) next.delete(id);
                else next.add(id);
            }
            return next;
        });
        if (!shiftKey) {
            setLastClickedIndex(idx);
        }
    };

    const clearSelection = () => setSelectedIds(new Set());

    useEffect(() => {
        setLastClickedIndex(null);
    }, [filters]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") clearSelection();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } =
        useInfiniteTransactions(filters);
    const deleteMutation = useDeleteTransaction();
    const cancelMutation = useCancelInstallments();
    const bulkDeleteMutation = useBulkDeleteTransactions();

    const transactions = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data?.pages]);
    const total = data?.pages[0]?.total ?? 0;

    const selectionSummary = useMemo(() => {
        if (selectedIds.size === 0) return null;
        const count = selectedIds.size;
        const data = (allSelectedData ?? transactions) as Pick<
            TransactionRowDTO,
            "id" | "amount" | "currency" | "exchange_rate"
        >[];
        const selected = data.filter((t) => selectedIds.has(t.id));
        let arsSum = 0;
        let usdSum = 0;
        for (const t of selected) {
            const amount = parseFloat(t.amount);
            if (t.currency === "ARS") arsSum += amount;
            else usdSum += amount;
        }
        const usdToArs = selected
            .filter((t) => t.currency === "USD")
            .reduce((sum, t) => sum + parseFloat(t.amount) * t.exchange_rate, 0);
        const arsToUsd = selected
            .filter((t) => t.currency === "ARS")
            .reduce((sum, t) => sum + parseFloat(t.amount) / (t.exchange_rate || 1), 0);
        return { count, arsSum, usdSum, totalArs: arsSum + usdToArs, totalUsd: usdSum + arsToUsd };
    }, [selectedIds, transactions, allSelectedData]);
    const isAllSelected = total > 0 && selectedIds.size === total;
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const txListRef = useRef<TransactionListHandle>(null);

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
            setAllSelectedData(null);
            return;
        }
        transactionAggregates.listIds(filters).then((rows) => {
            setSelectedIds(new Set(rows.map((r) => r.id)));
            setAllSelectedData(rows);
        });
    };

    const handleSortChange = (field: "date" | "amount" | null, order: "asc" | "desc") => {
        setFilters((prev) => {
            const next = { ...prev };
            if (field) {
                next.sort = field;
                next.order = order;
            } else {
                delete next.sort;
                delete next.order;
            }
            return next;
        });
    };

    const handleDelete = (transaction: TransactionRowDTO) => {
        setDeleteConfirm(transaction);
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;
        deleteMutation.mutate(deleteConfirm.id, {
            onSuccess: () => {
                setDeleteConfirm(null);
                toast("Transacción eliminada", "success");
            },
            onError: (err) => {
                toast(getApiErrorMessage(err));
                setDeleteConfirm(null);
            },
        });
    };

    const confirmBulkDelete = () => {
        const seenGroups = new Set<string>();
        const deduped = [...selectedIds].filter((id) => {
            const tx = transactions.find((t) => t.id === id);
            if (!tx?.installment_group_id) return true;
            if (seenGroups.has(tx.installment_group_id)) return false;
            seenGroups.add(tx.installment_group_id);
            return true;
        });
        bulkDeleteMutation.mutate(deduped, {
            onSuccess: () => {
                setBulkDeleteConfirm(false);
                setSelectedIds(new Set());
                toast(`${selectionSummary?.count} transacciones eliminadas`, "success");
            },
            onError: (err) => {
                toast(getApiErrorMessage(err));
                setBulkDeleteConfirm(false);
            },
        });
    };

    const handleCancelInstallments = (transaction: TransactionRowDTO) => {
        setCancelConfirm(transaction);
    };

    const confirmCancelInstallments = () => {
        if (!cancelConfirm || !cancelConfirm.installment_group_id) return;
        cancelMutation.mutate(
            {
                installment_group_id: cancelConfirm.installment_group_id,
                from_installment: cancelConfirm.installment_number || 1,
            },
            {
                onSuccess: () => {
                    setCancelConfirm(null);
                    toast("Cuotas canceladas", "success");
                },
                onError: (err) => {
                    toast(getApiErrorMessage(err));
                    setCancelConfirm(null);
                },
            }
        );
    };

    return (
        <div
            style={{
                padding: spacing[3],
                ...flexColumn,
                gap: spacing[3],
                height: "100%",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            <div
                style={{
                    ...flexColumn,
                    gap: spacing[2],
                    flexShrink: 0,
                    minHeight: "64px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1
                            style={{
                                fontFamily: fonts.family,
                                fontSize: fonts.size.xl,
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                margin: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: spacing[2],
                            }}
                        >
                            <span>Transacciones</span>
                            <span
                                style={{
                                    fontWeight: fonts.weight.regular,
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.sm,
                                    marginLeft: spacing[1],
                                }}
                            >
                                ({total})
                            </span>
                        </h1>
                    </div>
                    <div style={{ display: "flex", gap: spacing[2] }}>
                        <Button
                            variant="chip"
                            size="sm"
                            color="default"
                            iconLeft={<Plus size={14} />}
                            style={{
                                height: "30px",
                                padding: "0 14px",
                                fontSize: fonts.size.sm,
                                border: "none",
                                borderRadius: "8px",
                                transition: "filter 0.15s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = ""; }}
                            onClick={() => setFlowModal("picker")}
                        >
                            Nueva Transacción
                        </Button>
                    </div>
                </div>
                <TransactionFiltersComponent filters={filters} onChange={setFilters} noMargin />
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                        {isLoading ? (
                            <div
                                style={{
                                    padding: spacing[8],
                                    textAlign: "center",
                                    color: colors.fg.dim,
                                }}
                            >
                                Cargando...
                            </div>
                        ) : isError ? (
                            <div
                                style={{
                                    padding: spacing[8],
                                    textAlign: "center",
                                    color: colors.accent.red,
                                }}
                            >
                                {getApiErrorMessage(error) || "Error"}
                            </div>
                        ) : (
                            <>
                                <TransactionList
                                    ref={txListRef}
                                    transactions={transactions}
                                    sortField={sortField}
                                    sortOrder={sortOrder}
                                    onSortChange={handleSortChange}
                                    fetchNextPage={fetchNextPage}
                                    hasNextPage={hasNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
                                    isFetchNextPageError={isFetchNextPageError}
                                    onDelete={handleDelete}
                                    onCancelInstallments={handleCancelInstallments}
                                    selectedIds={selectedIds}
                                    onToggleSelect={toggleSelect}
                                    onToggleSelectAll={toggleSelectAll}
                                    isAllSelected={isAllSelected}
                                />
                                {selectionSummary && (
                                    <div
                                        style={{
                                            position: "fixed",
                                            bottom: spacing[5],
                                            right: "calc(1.5rem + 0.75rem)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: spacing[2],
                                            padding: `${spacing[1]} ${spacing[3]}`,
                                            backgroundColor: colors.bg.elevated,
                                            borderRadius: radius.xl,
                                            fontSize: fonts.size.xs3,
                                            color: colors.fg.dim,
                                            zIndex: 1000,
                                            WebkitFontSmoothing: "antialiased",
                                            MozOsxFontSmoothing: "grayscale",
                                            lineHeight: 1,
                                        }}
                                    >
                                        <span
                                            className="selectable"
                                            style={{
                                                fontWeight: fonts.weight.semibold,
                                                color: colors.fg.base,
                                                whiteSpace: "nowrap",
                                                fontSize: fonts.size.xs3,
                                                lineHeight: "18px",
                                            }}
                                        >
                                            {selectionSummary.count}
                                        </span>
                                        <span style={{ lineHeight: "18px" }}>seleccionadas</span>
                                        <Sep />
                                        <span
                                            style={{
                                                color: colors.accent.cyan,
                                                textTransform: "uppercase",
                                                fontWeight: fonts.weight.semibold,
                                                fontSize: fonts.size.xs4,
                                                lineHeight: "18px",
                                                opacity: 0.55,
                                            }}
                                        >
                                            ARS
                                        </span>
                                        <span
                                            className="selectable"
                                            style={{
                                                fontFamily: fonts.family,
                                                fontWeight: fonts.weight.bold,
                                                color: colors.fg.base,
                                                whiteSpace: "nowrap",
                                                fontSize: fonts.size.xs4,
                                                lineHeight: "18px",
                                            }}
                                        >
                                            {formatNumber(selectionSummary.totalArs)}
                                        </span>
                                        <Sep />
                                        <span
                                            style={{
                                                color: colors.accent.green,
                                                textTransform: "uppercase",
                                                fontWeight: fonts.weight.semibold,
                                                fontSize: fonts.size.xs4,
                                                lineHeight: "18px",
                                                opacity: 0.55,
                                            }}
                                        >
                                            USD
                                        </span>
                                        <span
                                            className="selectable"
                                            style={{
                                                fontFamily: fonts.family,
                                                fontWeight: fonts.weight.bold,
                                                color: colors.fg.base,
                                                whiteSpace: "nowrap",
                                                fontSize: fonts.size.xs4,
                                                lineHeight: "18px",
                                            }}
                                        >
                                            {selectionSummary.totalUsd.toLocaleString("es-AR", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                        <span style={{ flex: 1 }} />
                                        <span
                                            style={{
                                                ...flexRow,
                                                gap: spacing[1],
                                            }}
                                        >
                                            <button
                                                onClick={() => setBulkDeleteConfirm(true)}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.opacity = "1")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.opacity = "0.45")
                                                }
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: colors.fg.dim,
                                                    padding: spacing[1],
                                                    lineHeight: 1,
                                                    borderRadius: radius.sm,
                                                    opacity: 0.45,
                                                    transition:
                                                        "opacity 0.15s, background-color 0.15s",
                                                    ...flexRow,
                                                    justifyContent: "center",
                                                }}
                                                title="Eliminar seleccionadas"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                onClick={clearSelection}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.opacity = "1")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.opacity = "0.45")
                                                }
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: colors.fg.dim,
                                                    padding: spacing[1],
                                                    lineHeight: 1,
                                                    borderRadius: radius.sm,
                                                    opacity: 0.45,
                                                    transition:
                                                        "opacity 0.15s, background-color 0.15s",
                                                    ...flexRow,
                                                    justifyContent: "center",
                                                }}
                                                title="Limpiar selección"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={
                    deleteConfirm?.installment_number
                        ? `¿Eliminar esta cuota (${deleteConfirm.installment_number}/${deleteConfirm.total_installments})? Se eliminarán todas las cuotas relacionadas.`
                        : "¿Eliminar esta transacción?"
                }
            />

            <ConfirmDialog
                isOpen={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={confirmBulkDelete}
                title="Confirmar eliminación"
                description={`¿Eliminar ${selectionSummary?.count} transacciones? Esta acción no se puede deshacer.`}
                isLoading={bulkDeleteMutation.isPending}
                destructive
                requireHold
            />

            <ConfirmDialog
                isOpen={!!cancelConfirm}
                onClose={() => setCancelConfirm(null)}
                onConfirm={confirmCancelInstallments}
                title="Cancelar cuotas"
                description={
                    cancelConfirm?.installment_number
                        ? `¿Cancelar cuotas desde la ${cancelConfirm.installment_number}/${cancelConfirm.total_installments}? Se marcarán como pagadas.`
                        : "¿Cancelar las cuotas restantes?"
                }
                confirmLabel="Confirmar"
                isLoading={cancelMutation.isPending}
            />

            <TransactionFlowModal
                isOpen={flowModal !== null}
                onClose={() => setFlowModal(null)}
                initialView={flowModal ?? "picker"}
                onTransactionCreated={(id, installmentGroupId) => {
                    txListRef.current?.notifyNewTransaction(id, installmentGroupId);
                }}
            />
        </div>
    );
}
