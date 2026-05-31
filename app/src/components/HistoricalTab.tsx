import { useState, useRef } from "react";
import type { HistoricalEntry, HistoricalFinanceReq } from "@/api_client";
import { type HistoricalFilters } from "@/api_client/endpoints";
import { useUpdateHistoricalEntry, useDeleteHistoricalEntry, useImportBackup } from "@/hooks";
import { spacing, colors, radius, fonts, flexBetween, flexColumn, flexRow } from "@/styles";
import { inputStyle, labelStyle } from "@/styles/formStyles";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Modal, ModalContent, ModalCloseButton } from "@/components/ui/Modal";
import { HistoricalList } from "./HistoricalList";
import { formatForInput, parseLocaleNumber } from "@/utils/format";
import { FileUp, FileText, XCircle, Upload, Pencil, AlertCircle } from "lucide-react";

interface HistoricalTabProps {
    showBulkImport?: boolean;
    onCloseBulkImport?: () => void;
    filters: HistoricalFilters;
    onFiltersChange: (filters: HistoricalFilters) => void;
    entries: HistoricalEntry[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
}

export function HistoricalTab({ showBulkImport: externalShowBulkImport, onCloseBulkImport, filters, onFiltersChange, entries, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage }: HistoricalTabProps) {
    const [sort, setSort] = useState<"month" | "income" | "expense" | "savings">("month");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [editingMonth, setEditingMonth] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        exchange_rate?: string;
        income_usd?: string;
        income_fixed_usd?: string;
        income_variable_usd?: string;
        expense_usd?: string;
        expense_fixed_usd?: string;
        expense_variable_usd?: string;
    }>({});
    const [importFile, setImportFile] = useState<File | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<HistoricalEntry | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showBulkImport = externalShowBulkImport ?? false;
    const closeBulkImport = onCloseBulkImport ?? (() => {});

    const updateMutation = useUpdateHistoricalEntry();
    const importMutation = useImportBackup();
    const deleteMutation = useDeleteHistoricalEntry();

    const handleSort = (column: "month" | "income" | "expense" | "savings") => {
        if (sort === column && order === "desc") {
            setOrder("asc");
            onFiltersChange({ ...filters, sort: column, order: "asc" });
        } else {
            setSort(column);
            setOrder("desc");
            onFiltersChange({ ...filters, sort: column, order: "desc" });
        }
    };

    const handleEdit = (entry: HistoricalEntry) => {
        setEditingMonth(entry.month);
        setEditForm({
            exchange_rate: formatForInput(String(entry.exchange_rate)),
            income_usd: formatForInput(entry.income),
            income_fixed_usd: formatForInput(entry.income_fixed),
            income_variable_usd: formatForInput(entry.income_variable),
            expense_usd: formatForInput(entry.expense),
            expense_fixed_usd: formatForInput(entry.expense_fixed),
            expense_variable_usd: formatForInput(entry.expense_variable),
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
        const tc = parseLocaleNumber(editForm.exchange_rate ?? "");
        if (isNaN(tc) || tc <= 0) {
            errors.push("El tipo de cambio debe ser mayor a 0.");
        }
        const income = parseLocaleNumber(editForm.income_usd ?? "0");
        const incomeFixed = parseLocaleNumber(editForm.income_fixed_usd ?? "0");
        const incomeVariable = parseLocaleNumber(editForm.income_variable_usd ?? "0");
        if (isNaN(income) || isNaN(incomeFixed) || isNaN(incomeVariable)) {
            errors.push("Los valores de ingreso deben ser numéricos.");
        } else if (Math.abs(income - (incomeFixed + incomeVariable)) > 0.01) {
            errors.push(`Ingreso (${income}) debe ser igual a fijo (${incomeFixed}) + variable (${incomeVariable}).`);
        }
        const expense = parseLocaleNumber(editForm.expense_usd ?? "0");
        const expenseFixed = parseLocaleNumber(editForm.expense_fixed_usd ?? "0");
        const expenseVariable = parseLocaleNumber(editForm.expense_variable_usd ?? "0");
        if (isNaN(expense) || isNaN(expenseFixed) || isNaN(expenseVariable)) {
            errors.push("Los valores de egreso deben ser numéricos.");
        } else if (Math.abs(expense - (expenseFixed + expenseVariable)) > 0.01) {
            errors.push(`Egreso (${expense}) debe ser igual a fijo (${expenseFixed}) + variable (${expenseVariable}).`);
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
        const data: Partial<HistoricalFinanceReq> = {
            ...editForm,
            exchange_rate: editForm.exchange_rate ? parseLocaleNumber(editForm.exchange_rate) : undefined,
        };
        updateMutation.mutate(
            { month: editingMonth, data },
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
        <div style={{ flex: 1, minHeight: 0, ...flexColumn, gap: spacing[2] }}>

            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
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
                        onLoadMore={() => fetchNextPage()}
                        hasMore={hasNextPage}
                        isLoadingMore={isFetchingNextPage}
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
                        border: `1px solid transparent`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ ...flexBetween, marginBottom: spacing[4] }}>
                        <div style={{ ...flexRow, gap: spacing[2] }}>
                            <Pencil size={18} color={colors.accent.teal} />
                            <h3 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: fonts.weight.semibold, color: colors.fg.base }}>Editar {editingMonth}</h3>
                        </div>
                        <ModalCloseButton onClick={handleCancelEdit} />
                    </div>

                    <div style={{ ...flexColumn, gap: spacing[4] }}>
                        <div>
                            <label style={labelStyle}>
                                Tipo de cambio (ARS/USD)
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editForm.exchange_rate ?? ""}
                                onChange={(e) => setEditForm((p) => ({ ...p, exchange_rate: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[3], border: `1px solid ${colors.border}` }}>
                            <div style={{ fontSize: fonts.size.xs, color: colors.accent.green, fontWeight: fonts.weight.semibold, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: spacing[2] }}>Ingreso</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[2] }}>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Total</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editForm.income_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, income_usd: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Fijo</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editForm.income_fixed_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, income_fixed_usd: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Variable</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editForm.income_variable_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, income_variable_usd: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[3], border: `1px solid ${colors.border}` }}>
                            <div style={{ fontSize: fonts.size.xs, color: colors.accent.red, fontWeight: fonts.weight.semibold, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: spacing[2] }}>Egreso</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[2] }}>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Total</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editForm.expense_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, expense_usd: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Fijo</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editForm.expense_fixed_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, expense_fixed_usd: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1] }}>Variable</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editForm.expense_variable_usd ?? ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, expense_variable_usd: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ minHeight: "20px", ...flexRow, gap: spacing[1] }}>
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

                    <div style={{ marginTop: spacing[4] }}>
                        <SubmitButton
                            onClick={handleSave}
                            disabled={validateEditForm().length > 0}
                            loading={updateMutation.isPending}
                            fullWidth
                        >
                            Guardar
                        </SubmitButton>
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
                        border: `1px solid transparent`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ ...flexBetween, marginBottom: spacing[4] }}>
                        <div style={{ ...flexRow, gap: spacing[2] }}>
                            <FileUp size={20} color={colors.accent.teal} />
                            <h3 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: fonts.weight.semibold, color: colors.fg.base }}>Importar desde CSV</h3>
                        </div>
                        <ModalCloseButton onClick={closeBulkImport} />
                    </div>

                    <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[4], border: `1px solid ${colors.border}` }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[3], paddingBottom: spacing[3], borderBottom: `1px solid ${colors.border}` }}>
                            <FileText size={14} color={colors.fg.dim} />
                            <span style={{ fontSize: fonts.size.sm, fontWeight: fonts.weight.semibold, color: colors.fg.base }}>Formato esperado</span>
                        </div>

                        {/* Description + CSV schema */}
                        <p style={{ color: colors.fg.dim, margin: `0 0 ${spacing[2]}`, fontSize: fonts.size.sm, lineHeight: 1.5 }}>
                            Cada fila debe tener <strong style={{ color: colors.fg.base }}>9 columnas</strong> separadas por comas, sin encabezado:
                        </p>
                        <div style={{ overflowX: "auto", marginBottom: spacing[3] }}>
                            <code style={{ display: "block", fontSize: fonts.size.xs, color: colors.accent.cyan, backgroundColor: colors.bg.surface, padding: spacing[2], borderRadius: radius.sm, fontFamily: fonts.monoFamily, whiteSpace: "nowrap" }}>
                                month, income, income_variable, income_fixed, expense, expense_fixed, expense_variable, exchange_rate, savings, source
                            </code>
                        </div>

                        {/* Field reference */}
                        <div style={{ ...flexColumn, gap: "6px", marginBottom: spacing[3] }}>
                            {([
                                ["month", "Formato YYYY-MM", "ej: 2025-01"],
                                ["income / expense", "Totales en USD", "income = income_fixed + income_variable"],
                                ["income_fixed / expense_fixed", "Parte fija en USD", null],
                                ["income_variable / expense_variable", "Parte variable en USD", null],
                                ["exchange_rate", "Tipo de cambio ARS/USD", "mayor a 0"],
                                ["savings", "Ahorro neto del mes en USD", null],
                                ["source", "Origen de los datos", "siempre \"historical\""],
                            ] as [string, string, string | null][]).map(([field, desc, note]) => (
                                <div key={field} style={{ display: "flex", alignItems: "baseline", gap: spacing[2] }}>
                                    <code style={{ fontSize: fonts.size.xs, color: colors.accent.cyan, fontFamily: fonts.monoFamily, backgroundColor: `${colors.accent.cyan}14`, padding: `1px 5px`, borderRadius: radius.sm, whiteSpace: "nowrap", flexShrink: 0 }}>
                                        {field}
                                    </code>
                                    <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>
                                        {desc}{note && <span style={{ color: colors.fg.dim, opacity: 0.6 }}> — {note}</span>}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Example */}
                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing[3] }}>
                            <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim, display: "block", marginBottom: spacing[1] }}>Ejemplo</span>
                            <div style={{ overflowX: "auto" }}>
                                <code style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.base, backgroundColor: colors.bg.surface, padding: spacing[2], borderRadius: radius.sm, fontFamily: fonts.monoFamily, whiteSpace: "nowrap" }}>
                                    2025-01,1116,153,964,1316,835,481,1165,-200,manual
                                </code>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            border: `2px dashed ${importFile ? colors.accent.teal + "80" : colors.border}`,
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
                            <div style={{ ...flexRow, justifyContent: "center", gap: spacing[2] }}>
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

                    <div>
                        <SubmitButton
                            onClick={handleBulkImport}
                            disabled={importMutation.isPending || !importFile}
                            loading={importMutation.isPending}
                            fullWidth
                        >
                            Importar
                        </SubmitButton>
                    </div>
                </ModalContent>
            </Modal>
        </div>
    );
}