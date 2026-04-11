import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import type { HistoricalEntry, HistoricalEntryCreate, HistoricalFinanceReq } from "@/api_client";
import { type HistoricalFilters } from "@/api_client/endpoints";
import { useHistoricalEntries, useUpdateHistoricalEntry, useBulkCreateHistoricalEntries, useDeleteHistoricalEntry } from "@/hooks";
import { spacing, colors } from "@/styles";
import { toast } from "@/components/ui/Toast";
import { HistoricalList } from "./HistoricalList";
import { HistoricalFiltersComponent } from "./HistoricalFilters";

interface HistoricalTabProps {
    externalLimit?: number;
}

export function HistoricalTab({ externalLimit }: HistoricalTabProps) {
    const [filters, setFilters] = useState<HistoricalFilters>({ page: 1, limit: externalLimit ?? 20 });
    const [sort, setSort] = useState<"month" | "income" | "expense" | undefined>(undefined);
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [editingMonth, setEditingMonth] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<HistoricalEntryCreate>({});
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<HistoricalEntry | null>(null);

    const { data, isLoading, isError, error } = useHistoricalEntries(filters);
    const updateMutation = useUpdateHistoricalEntry();
    const bulkMutation = useBulkCreateHistoricalEntries();
    const deleteMutation = useDeleteHistoricalEntry();

    const entries = data?.data ?? [];
    const total = data?.total ?? 0;
    const page = filters.page || 1;
    const limit = externalLimit ?? filters.limit ?? 20;

    useEffect(() => {
        if (externalLimit && externalLimit !== filters.limit) {
            setFilters(prev => ({ ...prev, limit: externalLimit }));
        }
    }, [externalLimit]);

    const handleFiltersChange = (newFilters: HistoricalFilters) => {
        setFilters(newFilters);
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const handleSort = (column: "month" | "income" | "expense") => {
        if (sort === column && order === "desc") {
            setOrder("asc");
            setFilters({ ...filters, sort: column, order: "asc" });
        } else if (sort === column && order === "asc") {
            setSort(undefined);
            setOrder("desc");
            const { sort: _, order: __, ...rest } = filters;
            setFilters(rest);
        } else {
            setSort(column);
            setOrder("desc");
            setFilters({ ...filters, sort: column, order: "desc" });
        }
    };

    const handleEdit = (entry: HistoricalEntry) => {
        setEditingMonth(entry.month);
        setEditForm({
            exchange_rate: entry.exchange_rate,
            income: entry.income,
            income_fixed: entry.income_fixed,
            income_variable: entry.income_variable,
            expense: entry.expense,
            expense_fixed: entry.expense_fixed,
            expense_variable: entry.expense_variable,
        });
    };

    const handleDelete = (entry: HistoricalEntry) => {
        setDeleteConfirm(entry);
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;
        deleteMutation.mutate(deleteConfirm.month, {
            onSuccess: () => {
                setDeleteConfirm(null);
                toast("Registro histórico eliminado");
            },
            onError: (err) => {
                toast(err instanceof Error ? err.message : "Error al eliminar");
                setDeleteConfirm(null);
            },
        });
    };

    const handleSave = () => {
        if (!editingMonth) return;
        updateMutation.mutate(
            { month: editingMonth, data: editForm },
            {
                onSuccess: () => {
                    setEditingMonth(null);
                    setEditForm({});
                    toast("Entrada actualizada");
                },
                onError: (err) => {
                    toast(err instanceof Error ? err.message : "Error al actualizar");
                },
            }
        );
    };

    const handleCancelEdit = () => {
        setEditingMonth(null);
        setEditForm({});
    };

    const handleBulkImport = () => {
        try {
            const lines = bulkText.trim().split("\n");
            const parsed: HistoricalFinanceReq[] = [];

            for (const line of lines) {
                const parts = line.split(",").map((p) => p.trim());
                if (parts.length < 9) continue;

                const month = parts[0];
                const tc = parseFloat(parts[1]) || 0;
                const income = parseFloat(parts[2]) || 0;
                const incomeFixed = parseFloat(parts[3]) || 0;
                const expense = parseFloat(parts[5]) || 0;
                const expenseFixed = parseFloat(parts[6]) || 0;
                const savings = parseFloat(parts[8]) || 0;

                const incomeVariable = income - incomeFixed;
                const expenseVariable = expense - expenseFixed;

                const incomeTotal = incomeFixed + incomeVariable;
                const expenseTotal = expenseFixed + expenseVariable;

                const entry: HistoricalFinanceReq = {
                    date: month + "-01",
                    exchange_rate: tc,
                    income_usd: String(incomeTotal),
                    income_fixed_usd: String(incomeFixed),
                    income_variable_usd: String(incomeVariable),
                    expense_usd: String(expenseTotal),
                    expense_fixed_usd: String(expenseFixed),
                    expense_variable_usd: String(expenseVariable),
                    savings_usd: String(savings),
                };

                if (entry.date && entry.exchange_rate) {
                    parsed.push(entry);
                }
            }

            if (parsed.length === 0) {
                toast("No se pudieron parsear entradas");
                return;
            }

            bulkMutation.mutate(parsed, {
                onSuccess: () => {
                    setShowBulkImport(false);
                    setBulkText("");
                    toast(`${parsed.length} entradas importadas`);
                },
                onError: (err) => {
                    toast(err instanceof Error ? err.message : "Error al importar");
                },
            });
        } catch {
            toast("Error al parsear datos");
        }
    };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div
                style={{
                    marginBottom: spacing[3],
                    backgroundColor: colors.bg.surface,
                    borderRadius: "var(--radius-lg)",
                    border: `3px solid ${colors.highlight.medium}`,
                }}
            >
                <button
                    onClick={() => setShowBulkImport(true)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: spacing[2],
                        padding: spacing[3],
                        backgroundColor: "transparent",
                        border: "none",
                        color: colors.fg.muted,
                        cursor: "pointer",
                        width: "100%",
                    }}
                >
                    <Upload size={16} />
                    <span style={{ fontWeight: 500, fontSize: "var(--font-size-sm)" }}>
                        Importar CSV
                    </span>
                </button>
            </div>

            <HistoricalFiltersComponent
                filters={filters}
                onChange={handleFiltersChange}
                total={total}
                page={page}
                limit={limit}
                onPageChange={handlePageChange}
            />

            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {isLoading ? (
                    <div style={{ padding: spacing[8], textAlign: "center", color: colors.fg.muted }}>
                        Cargando...
                    </div>
                ) : isError ? (
                    <div style={{ padding: spacing[8], textAlign: "center", color: colors.semantic.error }}>
                        {error?.message || "Error"}
                    </div>
                ) : (
                    <HistoricalList
                        entries={entries}
                        sort={sort}
                        order={order}
                        onSort={handleSort}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {editingMonth && (
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
                    onClick={handleCancelEdit}
                >
                    <div
                        style={{
                            backgroundColor: colors.bg.surface,
                            borderRadius: "var(--radius-lg)",
                            padding: spacing[6],
                            maxWidth: "500px",
                            width: "100%",
                            border: `1px solid ${colors.highlight.medium}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: `0 0 ${spacing[4]}` }}>Editar: {editingMonth}</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>TC (ARS/USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.exchange_rate ?? ""}
                                    onChange={(e) =>
                                        setEditForm((p) => ({ ...p, exchange_rate: parseFloat(e.target.value) }))
                                    }
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>Ingreso USD</label>
                                <input
                                    type="text"
                                    value={editForm.income ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, income: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>Fijo USD</label>
                                <input
                                    type="text"
                                    value={editForm.income_fixed ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, income_fixed: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>Variable USD</label>
                                <input
                                    type="text"
                                    value={editForm.income_variable ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, income_variable: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>Gasto USD</label>
                                <input
                                    type="text"
                                    value={editForm.expense ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expense: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>Fijo USD</label>
                                <input
                                    type="text"
                                    value={editForm.expense_fixed ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expense_fixed: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.muted }}>Variable USD</label>
                                <input
                                    type="text"
                                    value={editForm.expense_variable ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expense_variable: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.default,
                                        border: `1px solid ${colors.highlight.medium}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.default,
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end", marginTop: spacing[4] }}>
                            <button
                                onClick={handleCancelEdit}
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
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    backgroundColor: colors.accent.teal,
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    color: "white",
                                    cursor: "pointer",
                                    opacity: updateMutation.isPending ? 0.6 : 1,
                                }}
                            >
                                {updateMutation.isPending ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            ¿Eliminar el registro de {deleteConfirm.month}?
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
                                disabled={deleteMutation.isPending}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    backgroundColor: colors.semantic.error,
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    color: "white",
                                    cursor: "pointer",
                                    opacity: deleteMutation.isPending ? 0.6 : 1,
                                }}
                            >
                                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkImport && (
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
                    onClick={() => setShowBulkImport(false)}
                >
                    <div
                        style={{
                            backgroundColor: colors.bg.surface,
                            borderRadius: "var(--radius-lg)",
                            padding: spacing[6],
                            maxWidth: "600px",
                            width: "100%",
                            border: `1px solid ${colors.highlight.medium}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: `0 0 ${spacing[4]}` }}>Importar desde CSV</h3>
                        <p style={{ color: colors.fg.muted, margin: `0 0 ${spacing[2]}`, fontSize: "var(--font-size-sm)" }}>
                            Formato: YYYY-MM,tc,ingreso,fijo,variable,gasto,fijo,variable,ahorro
                        </p>
                        <p style={{ color: colors.fg.muted, margin: `0 0 ${spacing[4]}`, fontSize: "var(--font-size-sm)" }}>
                            Ejemplo: 2025-01,1165,1116,964,153,1316,481,835,-200
                        </p>
                        <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder={`2025-01,1165,1116,964,153,1316,481,835,-200\n2025-02,1185,1111,906,205,854,501,354,257`}
                            style={{
                                width: "100%",
                                height: "200px",
                                padding: spacing[2],
                                backgroundColor: colors.bg.default,
                                border: `1px solid ${colors.highlight.medium}`,
                                borderRadius: "var(--radius-md)",
                                color: colors.fg.default,
                                fontFamily: "monospace",
                                fontSize: "var(--font-size-sm)",
                                resize: "none",
                            }}
                        />
                        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end", marginTop: spacing[4] }}>
                            <button
                                onClick={() => setShowBulkImport(false)}
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
                                onClick={handleBulkImport}
                                disabled={bulkMutation.isPending || !bulkText.trim()}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    backgroundColor: colors.accent.teal,
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    color: "white",
                                    cursor: bulkText.trim() ? "pointer" : "not-allowed",
                                    opacity: bulkMutation.isPending ? 0.6 : 1,
                                }}
                            >
                                {bulkMutation.isPending ? "Importando..." : "Importar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}