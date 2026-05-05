import { useState, useEffect, useRef } from "react";
import type { HistoricalEntry, HistoricalFinanceReq } from "@/api_client";
import { type HistoricalFilters } from "@/api_client/endpoints";
import { useHistoricalEntries, useUpdateHistoricalEntry, useDeleteHistoricalEntry, useImportBackup } from "@/hooks";
import { spacing, colors, radius, fonts } from "@/styles";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { HistoricalList } from "./HistoricalList";
import { HistoricalFiltersComponent } from "./HistoricalFilters";
import { FileUp, FileText, XCircle, Upload, Pencil, X, AlertCircle } from "lucide-react";

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
    const [importFile, setImportFile] = useState<File | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<HistoricalEntry | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showBulkImport = externalShowBulkImport ?? false;
    const closeBulkImport = onCloseBulkImport ?? (() => {});

    const { data, isLoading, isError, error } = useHistoricalEntries(filters);
    const updateMutation = useUpdateHistoricalEntry();
    const importMutation = useImportBackup();
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

    const validateEditForm = (): string[] => {
        const errors: string[] = [];
        const tc = editForm.exchange_rate;
        if (tc === undefined || tc === null || isNaN(tc) || tc <= 0) {
            errors.push("El tipo de cambio debe ser mayor a 0.");
        }
        const income = parseFloat(String(editForm.income_usd ?? 0));
        const incomeFixed = parseFloat(String(editForm.income_fixed_usd ?? 0));
        const incomeVariable = parseFloat(String(editForm.income_variable_usd ?? 0));
        if (isNaN(income) || isNaN(incomeFixed) || isNaN(incomeVariable)) {
            errors.push("Los valores de ingreso deben ser numéricos.");
        } else if (Math.abs(income - (incomeFixed + incomeVariable)) > 0.01) {
            errors.push(`Ingreso (${income}) debe ser igual a fijo (${incomeFixed}) + variable (${incomeVariable}).`);
        }
        const expense = parseFloat(String(editForm.expense_usd ?? 0));
        const expenseFixed = parseFloat(String(editForm.expense_fixed_usd ?? 0));
        const expenseVariable = parseFloat(String(editForm.expense_variable_usd ?? 0));
        if (isNaN(expense) || isNaN(expenseFixed) || isNaN(expenseVariable)) {
            errors.push("Los valores de gasto deben ser numéricos.");
        } else if (Math.abs(expense - (expenseFixed + expenseVariable)) > 0.01) {
            errors.push(`Gasto (${expense}) debe ser igual a fijo (${expenseFixed}) + variable (${expenseVariable}).`);
        }
        return errors;
    };

    const handleSave = () => {
        if (!editingMonth) return;
        const errors = validateEditForm();
        if (errors.length > 0) {
            toast(errors[0]);
            return;
        }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
    };

    const handleBulkImport = () => {
        if (!importFile) {
            toast("Seleccioná un archivo CSV");
            return;
        }

        importMutation.mutate(
            { resource: "historical", file: importFile },
            {
                onSuccess: () => {
                    closeBulkImport();
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    toast("CSV importado correctamente", "success");
                },
                onError: (err) => {
                    toast(getApiErrorMessage(err));
                },
            }
        );
    };

    const resetImport = () => {
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                        maxWidth: "480px",
                        width: "100%",
                        border: `1px solid ${colors.fill}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[4] }}>
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                            <Pencil size={18} color={colors.accent.teal} />
                            <h3 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Editar {editingMonth}</h3>
                        </div>
                        <button
                            onClick={handleCancelEdit}
                            style={{ background: "none", border: "none", color: colors.fg.dim, cursor: "pointer", padding: spacing[1], display: "flex" }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
                        <div>
                            <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: spacing[1] }}>
                                Tipo de cambio (ARS/USD)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editForm.exchange_rate ?? ""}
                                onChange={(e) => setEditForm((p) => ({ ...p, exchange_rate: parseFloat(e.target.value) }))}
                                style={{
                                    width: "100%",
                                    padding: spacing[2],
                                    backgroundColor: colors.bg.base,
                                    border: `1px solid ${colors.fill}`,
                                    borderRadius: radius.md,
                                    color: colors.fg.base,
                                    fontSize: fonts.size.sm,
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>

                        <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[3], border: `1px solid ${colors.fill}` }}>
                            <div style={{ fontSize: fonts.size.xs, color: colors.accent.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: spacing[2] }}>Ingreso</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[2] }}>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Total</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.income_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, income_usd: e.target.value }))}
                                        style={{
                                            width: "100%",
                                            padding: spacing[2],
                                            backgroundColor: colors.bg.surface,
                                            border: `1px solid ${colors.fill}`,
                                            borderRadius: radius.md,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Fijo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.income_fixed_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, income_fixed_usd: e.target.value }))}
                                        style={{
                                            width: "100%",
                                            padding: spacing[2],
                                            backgroundColor: colors.bg.surface,
                                            border: `1px solid ${colors.fill}`,
                                            borderRadius: radius.md,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Variable</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.income_variable_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, income_variable_usd: e.target.value }))}
                                        style={{
                                            width: "100%",
                                            padding: spacing[2],
                                            backgroundColor: colors.bg.surface,
                                            border: `1px solid ${colors.fill}`,
                                            borderRadius: radius.md,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[3], border: `1px solid ${colors.fill}` }}>
                            <div style={{ fontSize: fonts.size.xs, color: colors.accent.red, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: spacing[2] }}>Gasto</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[2] }}>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Total</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.expense_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, expense_usd: e.target.value }))}
                                        style={{
                                            width: "100%",
                                            padding: spacing[2],
                                            backgroundColor: colors.bg.surface,
                                            border: `1px solid ${colors.fill}`,
                                            borderRadius: radius.md,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Fijo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.expense_fixed_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, expense_fixed_usd: e.target.value }))}
                                        style={{
                                            width: "100%",
                                            padding: spacing[2],
                                            backgroundColor: colors.bg.surface,
                                            border: `1px solid ${colors.fill}`,
                                            borderRadius: radius.md,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Variable</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.expense_variable_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, expense_variable_usd: e.target.value }))}
                                        style={{
                                            width: "100%",
                                            padding: spacing[2],
                                            backgroundColor: colors.bg.surface,
                                            border: `1px solid ${colors.fill}`,
                                            borderRadius: radius.md,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ minHeight: "20px", display: "flex", alignItems: "center", gap: spacing[1] }}>
                            {(() => {
                                const errs = validateEditForm();
                                if (errs.length === 0) return null;
                                return (
                                    <>
                                        <AlertCircle size={12} color={colors.accent.yellow} />
                                        <span style={{ fontSize: fonts.size.xs, color: colors.accent.yellow }}>
                                            {errs[0]}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end", marginTop: spacing[4] }}>
                        <Button variant="secondary" onClick={handleCancelEdit}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={validateEditForm().length > 0}
                            loading={updateMutation.isPending}
                        >
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
                        maxWidth: "520px",
                        width: "100%",
                        border: `1px solid ${colors.fill}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[4] }}>
                        <FileUp size={20} color={colors.accent.teal} />
                        <h3 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Importar desde CSV</h3>
                    </div>

                    <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[3], marginBottom: spacing[4], border: `1px solid ${colors.fill}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
                            <FileText size={14} color={colors.fg.dim} />
                            <span style={{ fontSize: fonts.size.sm, fontWeight: 600, color: colors.fg.base }}>Formato esperado</span>
                        </div>
                        <p style={{ color: colors.fg.dim, margin: `0 0 ${spacing[2]}`, fontSize: fonts.size.sm, lineHeight: 1.5 }}>
                            Cada fila debe tener <strong style={{ color: colors.fg.base }}>9 columnas</strong> separadas por comas, sin encabezado:
                        </p>
                        <div style={{ overflowX: "auto", marginBottom: spacing[2] }}>
                            <code style={{ display: "block", fontSize: fonts.size.xs, color: colors.accent.cyan, backgroundColor: colors.bg.surface, padding: spacing[2], borderRadius: radius.sm, fontFamily: "monospace", whiteSpace: "nowrap", wordBreak: "keep-all" }}>
                                month,income,income_variable,income_fixed,expense,expense_fixed,expense_variable,exchange_rate,savings,source
                            </code>
                        </div>
                        <ul style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0, paddingLeft: spacing[4], lineHeight: 1.6 }}>
                            <li><strong>month</strong>: formato YYYY-MM (ej: 2025-01)</li>
                            <li><strong>income / expense</strong>: totales en USD. Deben ser la suma de sus componentes: <code style={{ color: colors.fg.base }}>income = income_fixed + income_variable</code> y <code style={{ color: colors.fg.base }}>expense = expense_fixed + expense_variable</code></li>
                            <li><strong>income_fixed / expense_fixed</strong>: parte fija en USD</li>
                            <li><strong>income_variable / expense_variable</strong>: parte variable en USD</li>
                            <li><strong>exchange_rate</strong>: tipo de cambio ARS/USD, mayor a 0</li>
                            <li><strong>savings</strong>: ahorro neto del mes en USD</li>
                            <li><strong>source</strong>: origen de los datos, siempre <code style={{ color: colors.fg.base }}>historical</code></li>
                        </ul>
                        <p style={{ color: colors.fg.dim, margin: `${spacing[2]} 0 0`, fontSize: fonts.size.xs }}>
                            Ejemplo: <code style={{ color: colors.fg.base }}>2025-01,1116,153,964,1316,835,481,1165,-200,manual</code>
                        </p>
                    </div>

                    <div
                        style={{
                            border: `2px dashed ${importFile ? colors.accent.teal + "80" : colors.fill}`,
                            borderRadius: radius.md,
                            padding: spacing[4],
                            textAlign: "center",
                            marginBottom: spacing[4],
                            backgroundColor: importFile ? colors.accent.teal + "0A" : colors.bg.base,
                            transition: "all 0.15s",
                            cursor: "pointer",
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                        {importFile ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: spacing[2] }}>
                                <span style={{ color: colors.fg.base, fontSize: fonts.size.sm }}>{importFile.name}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); resetImport(); }}
                                    style={{ background: "none", border: "none", color: colors.fg.dim, cursor: "pointer", padding: 0, display: "flex" }}
                                    title="Quitar archivo"
                                >
                                    <XCircle size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload size={24} color={colors.fg.dim} style={{ marginBottom: spacing[2] }} />
                                <p style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0 }}>Hacé click para elegir un archivo CSV</p>
                            </>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
                        <Button variant="secondary" onClick={() => { resetImport(); closeBulkImport(); }}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleBulkImport}
                            disabled={importMutation.isPending || !importFile}
                            loading={importMutation.isPending}
                        >
                            Importar
                        </Button>
                    </div>
                </ModalContent>
            </Modal>
        </div>
    );
}