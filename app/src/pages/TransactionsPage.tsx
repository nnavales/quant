import { useState, useCallback, useRef, useEffect } from "react";
import type { TransactionFilters } from "@/api_client";
import type { TransactionRowDTO } from "@/api_client/types";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters as TransactionFiltersComponent } from "@/components/TransactionFilters";
import { TransactionForm } from "@/components/TransactionForm";
import { toast } from "@/components/ui/Toast";
import { useTransactionAggregates, useDeleteTransaction } from "@/hooks";
import { spacing, colors } from "@/styles";

const ROW_HEIGHT = 53;

export function TransactionsPage() {
    const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 15 });
    const [sort, setSort] = useState<"date" | "amount" | "created_at" | undefined>(undefined);
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [deleteConfirm, setDeleteConfirm] = useState<TransactionRowDTO | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isError, error } = useTransactionAggregates(filters);
    const deleteMutation = useDeleteTransaction();

    const transactions = data?.data ?? [];
    const total = data?.total ?? 0;

    const calculateLimit = useCallback(() => {
        if (!containerRef.current) return 15;
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
        setFilters(newFilters);
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
                toast("Transacción eliminada");
            },
            onError: (err) => {
                toast(err instanceof Error ? err.message : "Error al eliminar");
                setDeleteConfirm(null);
            },
        });
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
            ref={containerRef}
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing[4],
                    flexShrink: 0,
                }}
            >
                <h2
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--font-size-lg)",
                        fontWeight: 600,
                        margin: 0,
                    }}
                >
                    Transacciones
                    <span
                        style={{
                            fontWeight: 400,
                            color: colors.fg.muted,
                            fontSize: "var(--font-size-sm)",
                            marginLeft: spacing[2],
                        }}
                    >
                        ({total})
                    </span>
                </h2>
            </div>

            <TransactionForm />

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
                            color: colors.fg.muted,
                        }}
                    >
                        Cargando...
                    </div>
                ) : isError ? (
                    <div
                        style={{
                            padding: spacing[8],
                            textAlign: "center",
                            color: colors.semantic.error,
                        }}
                    >
                        {error?.message || "Error"}
                    </div>
                ) : (
                    <TransactionList
                        transactions={transactions}
                        sort={sort}
                        order={order}
                        onSort={handleSort}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {deleteConfirm && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                    }}
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div
                        style={{
                            backgroundColor: colors.bg.surface,
                            borderRadius: "var(--radius-lg)",
                            padding: spacing[6],
                            maxWidth: "400px",
                            border: `1px solid ${colors.highlight.medium}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                margin: `0 0 ${spacing[4]}`,
                                fontSize: "var(--font-size-base)",
                            }}
                        >
                            Confirmar eliminación
                        </h3>
                        <p style={{ color: colors.fg.muted, margin: `0 0 ${spacing[4]}` }}>
                            {deleteConfirm.installment_number
                                ? `¿Eliminar esta cuota (${deleteConfirm.installment_number}/${deleteConfirm.total_installments})? Se eliminarán todas las cuotas relacionadas.`
                                : "¿Eliminar esta transacción?"}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: spacing[2],
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    backgroundColor: "transparent",
                                    border: `1px solid ${colors.highlight.medium}`,
                                    borderRadius: "var(--radius-md)",
                                    color: colors.fg.default,
                                    cursor: "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    backgroundColor: colors.semantic.error,
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    color: "white",
                                    cursor: "pointer",
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
