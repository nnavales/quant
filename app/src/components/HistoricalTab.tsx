import { useState, useEffect } from "react";
import type { HistoricalEntry, HistoricalFinanceReq } from "@/api_client";
import { type HistoricalFilters } from "@/api_client/endpoints";
import { useHistoricalEntries, useUpdateHistoricalEntry, useBulkCreateHistoricalEntries, useDeleteHistoricalEntry } from "@/hooks";
import { spacing, colors, radius, fonts } from "@/styles";
import { toast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { HistoricalList } from "./HistoricalList";
import { HistoricalFiltersComponent } from "./HistoricalFilters";

interface HistoricalTabProps {
    externalLimit?: number;
    showBulkImport?: boolean;
    onCloseBulkImport?: () => void;
}

export function HistoricalTab({ externalLimit, showBulkImport: externalShowBulkImport, onCloseBulkImport }: HistoricalTabProps) {
    const [filters, setFilters] = useState<HistoricalFilters>({ page: 1, limit: externalLimit ?? 20 });
    const [sort, setSort] = useState<"month" | "income" | "expense" | undefined>(undefined);
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [editingMonth, setEditingMonth] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<HistoricalFinanceReq>>({});
    const [bulkText, setBulkText] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<HistoricalEntry | null>(null);

    const showBulkImport = externalShowBulkImport ?? false;
    const closeBulkImport = onCloseBulkImport ?? (() => {});

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
            income_usd: entry.income,
            income_fixed_usd: entry.income_fixed,
            income_variable_usd: entry.income_variable,
            expense_usd: entry.expense,
            expense_fixed_usd: entry.expense_fixed,
            expense_variable_usd: entry.expense_variable,
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
                toast("Registro histórico eliminado", "success");
            },
            onError: (err) => {
                toast(getApiErrorMessage(err));
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
                    toast("Entrada actualizada", "success");
                },
                onError: (err) => {
                    toast(getApiErrorMessage(err));
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
                    closeBulkImport();
                    setBulkText("");
                    toast(`${parsed.length} entradas importadas`, "success");
                },
                onError: (err) => {
                    toast(getApiErrorMessage(err));
                },
            });
        } catch {
            toast("Error al parsear datos");
        }
    };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: spacing[2] }}>
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
                    <div style={{ padding: spacing[8], textAlign: "center", color: colors.fg.dim }}>
                        Cargando...
                    </div>
                ) : isError ? (
                    <div style={{ padding: spacing[8], textAlign: "center", color: colors.accent.red }}>
                        {getApiErrorMessage(error) || "Error"}
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

            <Modal isOpen={!!editingMonth} onClose={handleCancelEdit}>
                <ModalContent
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[6],
                        maxWidth: "500px",
                        width: "100%",
                        border: `1px solid ${colors.fill}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 style={{ margin: `0 0 ${spacing[4]}`, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Editar: {editingMonth}</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>TC (ARS/USD)</label>
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
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>Ingreso USD</label>
                                <input
                                    type="text"
                                    value={editForm.income_usd ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, income_usd: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>Fijo USD</label>
                                <input
                                    type="text"
                                    value={editForm.income_fixed_usd ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, income_fixed_usd: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>Variable USD</label>
                                <input
                                    type="text"
                                    value={editForm.income_variable_usd ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, income_variable_usd: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>Gasto USD</label>
                                <input
                                    type="text"
                                    value={editForm.expense_usd ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expense_usd: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>Fijo USD</label>
                                <input
                                    type="text"
                                    value={editForm.expense_fixed_usd ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expense_fixed_usd: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                                <label style={{ width: "120px", color: colors.fg.dim }}>Variable USD</label>
                                <input
                                    type="text"
                                    value={editForm.expense_variable_usd ?? ""}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expense_variable_usd: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: spacing[2],
                                        backgroundColor: colors.bg.base,
                                        border: `1px solid ${colors.fill}`,
                                        borderRadius: "var(--radius-md)",
                                        color: colors.fg.base,
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end", marginTop: spacing[4] }}>
                            <Button variant="secondary" onClick={handleCancelEdit}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSave} loading={updateMutation.isPending}>
                                Guardar
                            </Button>
                        </div>
                    </ModalContent>
                </Modal>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={`¿Eliminar el registro de ${deleteConfirm?.month}?`}
                isLoading={deleteMutation.isPending}
            />

            <Modal isOpen={showBulkImport} onClose={closeBulkImport}>
                <ModalContent
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[6],
                        maxWidth: "600px",
                        width: "100%",
                        border: `1px solid ${colors.fill}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 style={{ margin: `0 0 ${spacing[4]}`, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Importar desde CSV</h3>
                        <p style={{ color: colors.fg.dim, margin: `0 0 ${spacing[2]}`, fontSize: "var(--font-size-sm)" }}>
                            Formato: YYYY-MM,tc,ingreso,fijo,variable,gasto,fijo,variable,ahorro
                        </p>
                        <p style={{ color: colors.fg.dim, margin: `0 0 ${spacing[4]}`, fontSize: "var(--font-size-sm)" }}>
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
                                backgroundColor: colors.bg.base,
                                border: `1px solid ${colors.fill}`,
                                borderRadius: "var(--radius-md)",
                                color: colors.fg.base,
                                fontFamily: "monospace",
                                fontSize: "var(--font-size-sm)",
                                resize: "none",
                            }}
                        />
                        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end", marginTop: spacing[4] }}>
                            <Button variant="secondary" onClick={closeBulkImport}>
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleBulkImport}
                                disabled={bulkMutation.isPending || !bulkText.trim()}
                                loading={bulkMutation.isPending}
                            >
                                Importar
                            </Button>
                        </div>
                    </ModalContent>
                </Modal>
        </div>
    );
}