import { useState, useCallback, useRef, useEffect } from "react";
import type { TransactionFilters, HistoricalFilters } from "@/api_client";
import type { TransactionRowDTO } from "@/api_client/types";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters as TransactionFiltersComponent } from "@/components/TransactionFilters";
import { TransactionModal } from "@/components/TransactionModal";
import { HistoricalTab } from "@/components/HistoricalTab";
import { Plus, Upload } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    useTransactionAggregates,
    useDeleteTransaction,
    useCancelInstallments,
    useHistoricalEntries,
} from "@/hooks";
import { spacing, colors } from "@/styles";
import { fonts } from "@/styles/fonts";

const ROW_HEIGHT = 52;

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [historicalFilters] = useState<HistoricalFilters>({ page: 1, limit: 20 });

    const { data, isLoading, isError, error } = useTransactionAggregates(filters);
    const { data: historicalData } = useHistoricalEntries(historicalFilters);
    const deleteMutation = useDeleteTransaction();
    const cancelMutation = useCancelInstallments();

    const transactions = data?.data ?? [];
    const total = data?.total ?? 0;
    const historicalTotal = historicalData?.total ?? 0;

    const calculateLimit = useCallback(() => {
        if (!containerRef.current) return 16;
        const rect = containerRef.current.getBoundingClientRect();
        const containerHeight = rect.height;
        const filtersHeight = 50;
        const paginationHeight = 50;
        const tableHeaderHeight = 40;
        const padding = 20;
        const buffer = 10;
        const availableHeight =
            containerHeight -
            filtersHeight -
            paginationHeight -
            tableHeaderHeight -
            padding -
            buffer;
        return Math.max(5, Math.floor(availableHeight / ROW_HEIGHT));
    }, []);

    const updateLimit = useCallback(() => {
        const newLimit = calculateLimit();
        setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    }, [calculateLimit]);

    useEffect(() => {
        const timeoutId = setTimeout(updateLimit, 0);
        window.addEventListener("resize", updateLimit);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", updateLimit);
        };
    }, [updateLimit]);

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
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.xl,
                            fontWeight: fonts.weight.semibold,
                            color: colors.fg.base,
                            margin: 0,
                            marginBottom: spacing[1],
                            cursor: "pointer",
                            userSelect: "none",
                        }}
                    >
                        {activeTab === "transacciones" ? "Transacciones" : "Histórico"}
                        <span
                            style={{
                                fontWeight: fonts.weight.regular,
                                color: colors.fg.dim,
                                fontSize: fonts.size.sm,
                                marginLeft: spacing[2],
                            }}
                        >
                            ({activeTab === "transacciones" ? total : historicalTotal})
                        </span>
                    </h1>
                </div>
                {activeTab === "transacciones" ? (
                    <Button variant="secondary" iconLeft={<Plus size={18} />} onClick={() => setTransactionModal({ open: true, type: "expense" })}>
                        Nueva Transacción
                    </Button>
                ) : (
                    <Button variant="secondary" iconLeft={<Upload size={18} />} onClick={() => setShowBulkImport(true)}>
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
                            <TransactionList
                                transactions={transactions}
                                sort={sort}
                                order={order}
                                onSort={handleSort}
                                onDelete={handleDelete}
                                onCancelInstallments={handleCancelInstallments}
                            />
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
