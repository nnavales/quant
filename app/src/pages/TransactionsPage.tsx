import { useState, useEffect, useMemo } from "react";
import type { TransactionFilters, HistoricalFilters } from "@/api_client";
import type { TransactionRowDTO } from "@/api_client/types";
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
    useTransactionAggregates,
    useDeleteTransaction,
    useBulkDeleteTransactions,
    useCancelInstallments,
    useHistoricalEntries,
} from "@/hooks";
import { spacing, colors, radius } from "@/styles";
import { fonts } from "@/styles/fonts";

const Sep = () => <span style={{ color: colors.border, width: "1px", height: "18px", display: "inline-block" }} />;

type Tab = "transacciones" | "historico";

export function TransactionsPage() {
    const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 15 });
    const [sort, setSort] = useState<"date" | "amount" | "created_at" | undefined>(undefined);
    const [order, setOrder] = useState<"asc" | "desc">("desc");
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

    const { data, isLoading, isError, error } = useTransactionAggregates(filters);
    const { data: historicalData } = useHistoricalEntries(historicalFilters);
    const deleteMutation = useDeleteTransaction();
    const cancelMutation = useCancelInstallments();
    const bulkDeleteMutation = useBulkDeleteTransactions();

    const transactions = data?.data ?? [];
    const total = data?.total ?? 0;
    const historicalTotal = historicalData?.total ?? 0;

    const selectionSummary = useMemo(() => {
        if (selectedIds.size === 0) return null;
        const selected = transactions.filter((t) => selectedIds.has(t.id));
        let arsSum = 0;
        let usdSum = 0;
        for (const t of selected) {
            const amount = parseFloat(t.amount);
            if (t.currency === "ARS") arsSum += amount;
            else usdSum += amount;
        }
        const arsUsdConverted = selected
            .filter((t) => t.currency === "USD")
            .reduce((sum, t) => sum + parseFloat(t.amount) * t.exchange_rate, 0);
        return { count: selected.length, arsSum, usdSum, totalArs: arsSum + arsUsdConverted };
    }, [selectedIds, transactions]);
    const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length;
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map((t) => t.id)));
        }
    };

    const handleFiltersChange = (newFilters: TransactionFilters) => {
        setFilters((prev) => ({ ...newFilters, limit: prev.limit }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const handleSort = (column: "date" | "amount" | "created_at") => {
        if (sort === column && order === "desc") {
            setOrder("asc");
            setFilters((prev) => ({ ...prev, sort: column, order: "asc" }));
        } else if (sort === column && order === "asc") {
            setSort(undefined);
            setOrder("desc");
            const newFilters = { ...filters };
            delete newFilters.sort;
            delete newFilters.order;
            setFilters(newFilters);
        } else {
            setSort(column);
            setOrder("desc");
            setFilters((prev) => ({ ...prev, sort: column, order: "desc" }));
        }
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

    useEffect(() => {
        if (!filters.sort) {
            setSort(undefined);
        }
        if (filters.sort && filters.order) {
            setSort(filters.sort);
            setOrder(filters.order);
        }
    }, [filters.sort, filters.order]);

    return (
        <div
            style={{
                padding: spacing[3],
                display: "flex",
                flexDirection: "column",
                gap: spacing[2],
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
                        onChange={handleFiltersChange}
                        total={total}
                        page={filters.page || 1}
                        limit={filters.limit || 20}
                        onPageChange={handlePageChange}
                    />

                    <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
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
                                sort={sort}
                                order={order}
                                onSort={handleSort}
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
                                        bottom: spacing[4],
                                        right: spacing[4],
                                        display: "flex",
                                        alignItems: "center",
                                        gap: spacing[4],
                                        padding: `${spacing[2]} ${spacing[4]}`,
                                        backgroundColor: colors.bg.header,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: radius.md,
                                        outline: `1px solid ${colors.fill}`,
                                        fontSize: "13px",
                                        color: colors.fg.dim,
                                        zIndex: 1000,
                                        WebkitFontSmoothing: "antialiased",
                                        MozOsxFontSmoothing: "grayscale",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: spacing[1] }}>
                                        <span className="selectable" style={{ fontWeight: 600, color: colors.fg.base, whiteSpace: "nowrap" }}>
                                            {selectionSummary.count}
                                        </span>
                                        <span>seleccionadas</span>
                                    </span>
                                    <Sep />
                                    <span style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                                        <span style={{ color: colors.fg.base, fontWeight: 500 }}>ARS</span>
                                        <span className="selectable" style={{ fontFamily: fonts.family.display, fontWeight: 700, color: colors.fg.base, whiteSpace: "nowrap" }}>
                                            {selectionSummary.totalArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </span>
                                    <span style={{ flex: 1 }} />
                                    <span style={{ display: "flex", alignItems: "center", gap: spacing[1], marginLeft: spacing[2] }}>
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
                    externalLimit={filters.limit}
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
