import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TransactionFilters, HistoricalFilters } from "@/api_client";
import type { TransactionRowDTO, TransactionIDAmount } from "@/api_client/types";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters as TransactionFiltersComponent } from "@/components/TransactionFilters";
import { TransactionModal } from "@/components/TransactionModal";
import { HistoricalTab } from "@/components/HistoricalTab";
import { Plus, Upload, Trash2, X } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    useInfiniteTransactions,
    useDeleteTransaction,
    useBulkDeleteTransactions,
    useCancelInstallments,
    useHistoricalEntries,
} from "@/hooks";
import { historical, transactionAggregates } from "@/api_client";
import { spacing, colors, radius } from "@/styles";
import { fonts } from "@/styles/fonts";

const Sep = () => <span style={{ color: colors.border, width: "1px", alignSelf: "stretch", display: "inline-block" }} />;

type Tab = "transacciones" | "historico";

export function TransactionsPage() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<TransactionFilters>({ limit: 30, sort: "date", order: "desc" });
    const order = filters.order ?? "desc";
    const [deleteConfirm, setDeleteConfirm] = useState<TransactionRowDTO | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState<TransactionRowDTO | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("transacciones");
    const [transactionModal, setTransactionModal] = useState<{
        open: boolean;
        type: "income" | "expense";
    }>({ open: false, type: "expense" });
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [historicalFilters] = useState<HistoricalFilters>({ page: 1, limit: 15 });
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
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") clearSelection();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        queryClient.prefetchInfiniteQuery({
            queryKey: ["historical", "infinite", { sort: "month", order: "desc" }],
            queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
                historical.list({ sort: "month", order: "desc", page: pageParam }),
            initialPageParam: 1,
        });
    }, [queryClient]);

    const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteTransactions(filters);
    const { data: historicalData } = useHistoricalEntries(historicalFilters);
    const deleteMutation = useDeleteTransaction();
    const cancelMutation = useCancelInstallments();
    const bulkDeleteMutation = useBulkDeleteTransactions();

    const transactions = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data?.pages]);
    const total = data?.pages[0]?.total ?? 0;
    const historicalTotal = historicalData?.total ?? 0;

    const selectionSummary = useMemo(() => {
        if (selectedIds.size === 0) return null;
        const count = selectedIds.size;
        const data = (allSelectedData ?? transactions) as Pick<TransactionRowDTO, "id" | "amount" | "currency" | "exchange_rate">[];
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

    const handleToggleOrder = () => {
        const nextOrder = order === "desc" ? "asc" : "desc";
        setFilters((prev) => ({ ...prev, order: nextOrder }));
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
        bulkDeleteMutation.mutate([...selectedIds], {
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
                display: "flex",
                flexDirection: "column",
                gap: spacing[2],
                height: "100%",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexShrink: 0,
                }}
            >
                <div>
                    <h1
                        onClick={() =>
                            setActiveTab(activeTab === "transacciones" ? "historico" : "transacciones")
                        }
                        title="Clic para cambiar de tabla"
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.xl,
                            fontWeight: fonts.weight.semibold,
                            color: colors.fg.base,
                            margin: 0,
                            marginBottom: spacing[1],
                            cursor: "pointer",
                            userSelect: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: spacing[2],
                        }}
                    >
                        <span className="tab-title">
                            {activeTab === "transacciones" ? "Transacciones" : "Histórico"}
                        </span>
                        <span
                            style={{
                                fontWeight: fonts.weight.regular,
                                color: colors.fg.dim,
                                fontSize: fonts.size.sm,
                                marginLeft: spacing[1],
                            }}
                        >
                            ({activeTab === "transacciones" ? total : historicalTotal})
                        </span>
                    </h1>
                </div>
                {activeTab === "transacciones" ? (
                    <Button variant="primary" color="default" iconLeft={<Plus size={18} />} onClick={() => setTransactionModal({ open: true, type: "expense" })}>
                        Nueva Transacción
                    </Button>
                ) : (
                    <Button variant="primary" color="default" iconLeft={<Upload size={18} />} onClick={() => setShowBulkImport(true)}>
                        Importar CSV
                    </Button>
                )}
            </div>

            {activeTab === "transacciones" ? (
                <>
                    <TransactionFiltersComponent
                        filters={filters}
                        onChange={setFilters}
                    />

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
                                transactions={transactions}
                                order={order}
                                onToggleOrder={handleToggleOrder}
                                fetchNextPage={fetchNextPage}
                                hasNextPage={hasNextPage}
                                isFetchingNextPage={isFetchingNextPage}
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
                                        right: spacing[5],
                                        display: "flex",
                                        alignItems: "center",
                                        gap: spacing[2],
                                        padding: `${spacing[1]} ${spacing[3]}`,
                                        backgroundColor: colors.bg.header,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: radius.xl,
                                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                        fontSize: "12px",
                                        color: colors.fg.dim,
                                        zIndex: 1000,
                                        WebkitFontSmoothing: "antialiased",
                                        MozOsxFontSmoothing: "grayscale",
                                        lineHeight: 1,
                                    }}
                                >
                                    <span className="selectable" style={{ fontWeight: 600, color: colors.fg.base, whiteSpace: "nowrap", fontSize: "12px", lineHeight: "18px" }}>
                                        {selectionSummary.count}
                                    </span>
                                    <span style={{ lineHeight: "18px" }}>seleccionadas</span>
                                    <Sep />
                                    <span style={{
                                        color: colors.accent.cyan,
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                        fontSize: "12.5px",
                                        lineHeight: "18px",
                                        opacity: 0.55,
                                    }}>ARS</span>
                                    <span className="selectable" style={{ fontFamily: fonts.family.display, fontWeight: 700, color: colors.fg.base, whiteSpace: "nowrap", fontSize: "12.5px", lineHeight: "18px" }}>
                                        {selectionSummary.totalArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <Sep />
                                    <span style={{
                                        color: colors.accent.green,
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                        fontSize: "12.5px",
                                        lineHeight: "18px",
                                        opacity: 0.55,
                                    }}>USD</span>
                                    <span className="selectable" style={{ fontFamily: fonts.family.display, fontWeight: 700, color: colors.fg.base, whiteSpace: "nowrap", fontSize: "12.5px", lineHeight: "18px" }}>
                                        {selectionSummary.totalUsd.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span style={{ flex: 1 }} />
                                    <span style={{ display: "flex", alignItems: "center", gap: spacing[1] }}>
                                        <button
                                            onClick={() => setBulkDeleteConfirm(true)}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.45"}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                color: colors.fg.dim,
                                                padding: spacing[1],
                                                lineHeight: 1,
                                                borderRadius: radius.sm,
                                                opacity: 0.45,
                                                transition: "opacity 0.15s, background-color 0.15s",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            title="Eliminar seleccionadas"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <button
                                            onClick={clearSelection}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.45"}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                color: colors.fg.dim,
                                                padding: spacing[1],
                                                lineHeight: 1,
                                                borderRadius: radius.sm,
                                                opacity: 0.45,
                                                transition: "opacity 0.15s, background-color 0.15s",
                                                display: "flex",
                                                alignItems: "center",
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
                </>
            ) : (
                <HistoricalTab
                    showBulkImport={showBulkImport}
                    onCloseBulkImport={() => setShowBulkImport(false)}
                />
            )}

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

            <TransactionModal
                isOpen={transactionModal.open}
                onClose={() => setTransactionModal({ open: false, type: transactionModal.type })}
                type={transactionModal.type}
            />
        </div>
    );
}
