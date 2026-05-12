import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, Plus, RotateCcw, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import type { Preset, PresetReq, TransactionFrequency, Currency } from "@/api_client/types";
import {
    usePresets,
    useCreatePreset,
    useDeletePreset,
    useRestorePreset,
    useUpdatePreset,
    useCategories,
    useSubcategories,
    useChannels,
    useAccounts,
    useCategoryGroups,
    useAccountGroups,
} from "@/hooks";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { cardStyle } from "@/styles/layout";
import { toast } from "@/utils/toast";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { getApiErrorMessage } from "@/utils/apiErrors";

const inputStyle: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.bg.base,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    width: "100%",
    height: "32px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
};

const fieldRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
};

const fieldLabelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    minWidth: "100px",
    flexShrink: 0,
};

const fieldValueStyle: React.CSSProperties = {
    flex: 1,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const fieldLabelAbove: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    fontWeight: 500,
    marginBottom: spacing[1],
    display: "block",
};

function TypeToggle({
    value,
    onChange,
}: {
    value: "expense" | "income" | undefined;
    onChange: (v: "expense" | "income") => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                backgroundColor: colors.bg.base,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                padding: "2px",
                height: "32px",
                flexShrink: 0,
                boxSizing: "border-box",
            }}
        >
            <Button
                type="button"
                variant="tab"
                color="red"
                active={value === "expense"}
                onClick={() => onChange("expense")}
                iconLeft={<TrendingDown size={14} />}
                style={{ fontSize: fonts.size.sm }}
            >
                Gasto
            </Button>
            <Button
                type="button"
                variant="tab"
                color="green"
                active={value === "income"}
                onClick={() => onChange("income")}
                iconLeft={<TrendingUp size={14} />}
                style={{ fontSize: fonts.size.sm }}
            >
                Ingreso
            </Button>
        </div>
    );
}

type StringField = keyof Omit<Preset, "id" | "type" | "is_paid" | "created_at" | "updated_at" | "deleted_at">;
type BooleanField = "is_paid";

const detailFields: { key: StringField | BooleanField; label: string }[] = [
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "frequency", label: "Frecuencia" },
    { key: "currency", label: "Moneda" },
    { key: "is_paid", label: "Pagado" },
    { key: "category_id", label: "Categoría" },
    { key: "subcategory_id", label: "Subcategoría" },
    { key: "account_id", label: "Método de pago" },
    { key: "channel_id", label: "Canal" },
];

const freqLabels: Record<string, string> = {
    fixed: "Fijo",
    variable: "Variable",
};

function formatValue(
    preset: Preset,
    key: StringField | BooleanField,
    categories: { id: string; name: string }[],
    subcategories: { id: string; name: string }[],
    channels: { id: string; name: string }[],
    accounts: { id: string; name: string }[]
): string {
    const value = preset[key];
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? (preset.type === "income" ? "Recibido" : "Pagado") : "Pendiente";
    if (key === "category_id") return categories.find((c) => c.id === value)?.name || String(value);
    if (key === "subcategory_id") return subcategories.find((s) => s.id === value)?.name || String(value);
    if (key === "channel_id") return channels.find((c) => c.id === value)?.name || String(value);
    if (key === "account_id") return accounts.find((a) => a.id === value)?.name || String(value);
    if (key === "frequency") return freqLabels[String(value)] || String(value);
    return String(value);
}

const emptyForm: PresetReq = {
    name: "",
    type: "expense",
    description: "",
    frequency: undefined,
    category_id: "",
    subcategory_id: "",
    channel_id: "",
    account_id: "",
    is_paid: false,
    currency: undefined,
};

/* ─── Main component ─── */
export function PresetManager() {
    const queryClient = useQueryClient();

    const { data: presetsList, isLoading } = usePresets();
    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const { groups: categoryGroups, getCategoryId } = useCategoryGroups(categoriesList, subcategoriesList);
    const { groups: accountGroups, getChannelId } = useAccountGroups(channelsList, accountsList);

    const createPresetMutation = useCreatePreset();
    const deletePresetMutation = useDeletePreset();
    const restorePresetMutation = useRestorePreset();
    const updatePresetMutation = useUpdatePreset();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [createFormData, setCreateFormData] = useState<PresetReq>({ ...emptyForm });
    const [editFormData, setEditFormData] = useState<PresetReq>({ ...emptyForm });
    const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    function refetch() {
        queryClient.invalidateQueries({ queryKey: ["presets"] });
    }

    const closeCreateForm = () => {
        setShowCreateForm(false);
        setCreateFormData({ ...emptyForm });
    };

    const openCreateForm = () => {
        setEditingPresetId(null);
        setCreateFormData({ ...emptyForm });
        setShowCreateForm(true);
    };

    const openEditForm = (preset: Preset) => {
        setShowCreateForm(false);
        setEditingPresetId(preset.id);
        setEditFormData({
            name: preset.name,
            type: preset.type,
            description: preset.description ?? "",
            frequency: preset.frequency ?? undefined,
            category_id: preset.category_id ?? "",
            subcategory_id: preset.subcategory_id ?? "",
            channel_id: preset.channel_id ?? "",
            account_id: preset.account_id ?? "",
            is_paid: preset.is_paid ?? false,
            currency: preset.currency ?? undefined,
        });
    };

    const closeEditForm = () => {
        setEditingPresetId(null);
        setEditFormData({ ...emptyForm });
    };

    const buildPresetPayload = (form: PresetReq): PresetReq => {
        const data: PresetReq = {
            name: form.name?.trim() ?? "",
            type: form.type,
        };
        if (form.description?.trim()) data.description = form.description.trim();
        if (form.frequency) data.frequency = form.frequency;
        if (form.category_id?.trim()) data.category_id = form.category_id.trim();
        if (form.subcategory_id?.trim()) data.subcategory_id = form.subcategory_id.trim();
        if (form.channel_id?.trim()) data.channel_id = form.channel_id.trim();
        if (form.account_id?.trim()) data.account_id = form.account_id.trim();
        if (form.is_paid !== undefined && form.is_paid !== null) data.is_paid = form.is_paid;
        if (form.currency) data.currency = form.currency;
        return data;
    };

    const handleCreate = () => {
        const name = createFormData.name?.trim();
        if (!name) return;
        const exists = presetsList?.some((p) => p.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            toast(`El preset "${name}" ya existe`);
            return;
        }
        createPresetMutation.mutate(buildPresetPayload(createFormData), {
            onSuccess: () => {
                closeCreateForm();
                refetch();
                toast("Preset creado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleUpdate = () => {
        const name = editFormData.name?.trim();
        if (!editingPresetId || !name) return;
        const exists = presetsList?.some((p) => p.id !== editingPresetId && p.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            toast(`El preset "${name}" ya existe`);
            return;
        }
        const originalPreset = presetsList?.find((p) => p.id === editingPresetId);
        if (originalPreset) {
            const changed =
                name !== originalPreset.name ||
                editFormData.type !== originalPreset.type ||
                (editFormData.description?.trim() ?? "") !== (originalPreset.description ?? "") ||
                editFormData.frequency !== originalPreset.frequency ||
                (editFormData.category_id?.trim() ?? "") !== (originalPreset.category_id ?? "") ||
                (editFormData.subcategory_id?.trim() ?? "") !== (originalPreset.subcategory_id ?? "") ||
                (editFormData.channel_id?.trim() ?? "") !== (originalPreset.channel_id ?? "") ||
                (editFormData.account_id?.trim() ?? "") !== (originalPreset.account_id ?? "") ||
                (editFormData.is_paid ?? false) !== (originalPreset.is_paid ?? false) ||
                (editFormData.currency ?? "") !== (originalPreset.currency ?? "");
            if (!changed) {
                closeEditForm();
                return;
            }
        }
        updatePresetMutation.mutate(
            { id: editingPresetId, data: buildPresetPayload(editFormData) },
            {
                onSuccess: () => {
                    closeEditForm();
                    refetch();
                    toast("Preset actualizado", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleDeletePreset = (id: string) => {
        setDeleteConfirm(id);
    };

    const confirmDeletePreset = () => {
        if (!deleteConfirm) return;
        deletePresetMutation.mutate(deleteConfirm, {
            onSuccess: () => {
                setDeleteConfirm(null);
                refetch();
                toast("Preset eliminado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleRestorePreset = (id: string) => {
        restorePresetMutation.mutate(id, {
            onSuccess: () => {
                refetch();
                toast("Preset restaurado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedPresets);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedPresets(newExpanded);
    };

    const isLoadingSubmit = createPresetMutation.isPending || updatePresetMutation.isPending;

    if (isLoading) {
        return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;
    }

    const activePresets = presetsList?.filter((p) => !p.deleted_at) ?? [];
    const deletedPresets = presetsList?.filter((p) => p.deleted_at) ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {/* ── Create button ── */}
            {!showCreateForm && (
                <button
                    type="button"
                    onClick={openCreateForm}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: spacing[1],
                        padding: `${spacing[1]} ${spacing[2]}`,
                        fontSize: fonts.size.xs,
                        backgroundColor: "transparent",
                        border: "none",
                        color: colors.fg.dim,
                        cursor: "pointer",
                        fontWeight: 500,
                        fontFamily: fonts.family.text,
                        whiteSpace: "nowrap",
                    }}
                >
                    <Plus size={12} />
                    Nuevo preset
                </button>
            )}

            {/* ── Create form (inline) ── */}
            {showCreateForm && (
                <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: spacing[3] }}>
                    {/* Header row: name + type + actions */}
                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "nowrap", alignItems: "flex-end" }}>
                        <div style={{ flex: "1 1 0", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Nombre del Preset</span>
                            <input
                                type="text"
                                value={createFormData.name}
                                onChange={(e) => setCreateFormData((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Ej: Supermercado"
                                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") closeCreateForm(); }}
                                autoFocus
                                style={{ ...inputStyle, height: "28px" }}
                            />
                        </div>
                        <TypeToggle
                            value={createFormData.type}
                            onChange={(type) => setCreateFormData((p) => ({ ...p, type }))}
                        />
                        <div style={{ display: "flex", gap: spacing[1], flexShrink: 0, marginBottom: "1px" }}>
                            <Button variant="icon" onClick={handleCreate} disabled={!createFormData.name?.trim() || isLoadingSubmit}>
                                <Check size={14} />
                            </Button>
                            <Button variant="icon" onClick={closeCreateForm}>
                                <X size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Description row */}
                    <div style={{ display: "flex", gap: spacing[2] }}>
                        <div style={{ flex: "1 1 0", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Descripción</span>
                            <input
                                type="text"
                                value={createFormData.description ?? ""}
                                onChange={(e) => setCreateFormData((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Ej: Compras semanales"
                                style={{ ...inputStyle, height: "28px" }}
                            />
                        </div>
                    </div>

                    {/* Fields row 1 */}
                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Frecuencia</span>
                            <Dropdown
                                options={[
                                    { id: "fixed", label: "Fijo" },
                                    { id: "variable", label: "Variable" },
                                ]}
                                value={createFormData.frequency ?? ""}
                                onChange={(f) => setCreateFormData((p) => ({ ...p, frequency: (f || undefined) as TransactionFrequency | undefined }))}
                                placeholder="—"
                                clearable
                                clearLabel="—"
                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                            />
                        </div>
                        <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Moneda</span>
                            <Dropdown
                                options={[
                                    { id: "ARS", label: "ARS" },
                                    { id: "USD", label: "USD" },
                                ]}
                                value={createFormData.currency ?? ""}
                                onChange={(c) => setCreateFormData((p) => ({ ...p, currency: (c || undefined) as Currency | undefined }))}
                                placeholder="—"
                                clearable
                                clearLabel="—"
                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                            />
                        </div>
                        <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Estado</span>
                            <Dropdown
                                options={[
                                    { id: "false", label: "Pendiente" },
                                    { id: "true", label: createFormData.type === "income" ? "Recibido" : "Pagado" },
                                ]}
                                value={createFormData.is_paid ? "true" : "false"}
                                onChange={(v) => setCreateFormData((p) => ({ ...p, is_paid: v === "true" }))}
                                placeholder="—"
                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                            />
                        </div>
                    </div>

                    {/* Fields row 2 */}
                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                        <div style={{ flex: "2 1 200px", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Categoría</span>
                            <Dropdown
                                groups={categoryGroups}
                                value={createFormData.subcategory_id ?? ""}
                                onChange={(subId) => setCreateFormData((p) => ({ ...p, subcategory_id: subId, category_id: getCategoryId(subId) }))}
                                placeholder="Seleccionar..."
                                searchable
                                clearable
                                clearLabel="—"
                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                            />
                        </div>
                        <div style={{ flex: "2 1 200px", minWidth: 0 }}>
                            <span style={fieldLabelAbove}>Método de pago</span>
                            <Dropdown
                                groups={accountGroups}
                                value={createFormData.account_id ?? ""}
                                onChange={(accId) => setCreateFormData((p) => ({ ...p, account_id: accId, channel_id: getChannelId(accId) }))}
                                placeholder="Seleccionar..."
                                searchable
                                clearable
                                clearLabel="—"
                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Presets list ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {activePresets.map((preset) => {
                    const isEditing = editingPresetId === preset.id;
                    const isExpanded = expandedPresets.has(preset.id);

                    return (
                        <div
                            key={preset.id}
                            style={cardStyle}
                        >
                            {/* Card header */}
                            {isEditing ? (
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: spacing[2] }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[2], flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "flex-end", gap: spacing[2] }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <span style={fieldLabelAbove}>Nombre del Preset</span>
                                                <input
                                                    type="text"
                                                    value={editFormData.name}
                                                    onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
                                                placeholder="Ej: Supermercado"
                                                onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(); if (e.key === "Escape") closeEditForm(); }}
                                                autoFocus
                                                style={{ ...inputStyle, height: "28px", width: "100%" }}
                                            />
                                        </div>
                                        <TypeToggle
                                            value={editFormData.type}
                                            onChange={(type) => setEditFormData((p) => ({ ...p, type }))}
                                        />
                                    </div>
                                    <div>
                                        <span style={fieldLabelAbove}>Descripción</span>
                                        <input
                                            type="text"
                                            value={editFormData.description ?? ""}
                                            onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                                            placeholder="Ej: Compras semanales"
                                            style={{ ...inputStyle, height: "28px", width: "100%" }}
                                        />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: spacing[1], flexShrink: 0, marginTop: "18px" }}>
                                        <Button variant="icon" onClick={handleUpdate} disabled={!editFormData.name?.trim() || isLoadingSubmit}>
                                            <Check size={14} />
                                        </Button>
                                        <Button variant="icon" onClick={closeEditForm}>
                                            <X size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: spacing[5],
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: spacing[2],
                                            cursor: "pointer",
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                        onClick={() => toggleExpand(preset.id)}
                                    >
                                        <span style={{ color: colors.fg.dim, display: "flex", flexShrink: 0 }}>
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            paddingRight: spacing[2],
                                        }}>
                                            {preset.name}
                                        </span>
                                        <span
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                backgroundColor: preset.type === "income" ? colors.accent.green : colors.accent.red,
                                                display: "inline-block",
                                                flexShrink: 0,
                                            }}
                                            title={preset.type === "income" ? "Ingreso" : "Gasto"}
                                        />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: spacing[1], flexShrink: 0 }}>
                                        <Button
                                            variant="icon"
                                            title="Editar"
                                            onClick={() => openEditForm(preset)}
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                        <Button
                                            variant="icon"
                                            title="Eliminar"
                                            onClick={() => handleDeletePreset(preset.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Expanded content */}
                            {isExpanded && !isEditing && (
                                <div style={{ marginTop: spacing[3], display: "flex", flexDirection: "column", gap: spacing[2] }}>
                                {detailFields.map(({ key, label }) => {
                                    const displayLabel = key === "is_paid"
                                        ? (preset.type === "income" ? "Recibido" : "Pagado")
                                        : label;
                                    return (
                                        <div key={key} style={{ ...fieldRowStyle, gap: spacing[5] }}>
                                            <span style={fieldLabelStyle}>{displayLabel}:</span>
                                            <span style={fieldValueStyle}>
                                                {formatValue(preset, key, categoriesList, subcategoriesList, channelsList, accountsList)}
                                            </span>
                                        </div>
                                    );
                                })}
                                </div>
                            )}

                            {/* Inline edit form body */}
                            {isEditing && (
                                <div style={{ marginTop: spacing[3], display: "flex", flexDirection: "column", gap: spacing[3] }}>
                                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                                        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                                            <span style={fieldLabelAbove}>Frecuencia</span>
                                            <Dropdown
                                                options={[
                                                    { id: "fixed", label: "Fijo" },
                                                    { id: "variable", label: "Variable" },
                                                ]}
                                                value={editFormData.frequency ?? ""}
                                                onChange={(f) => setEditFormData((p) => ({ ...p, frequency: (f || undefined) as TransactionFrequency | undefined }))}
                                                placeholder="—"
                                                clearable
                                                clearLabel="—"
                                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                            />
                                        </div>
                                        <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                                            <span style={fieldLabelAbove}>Moneda</span>
                                            <Dropdown
                                                options={[
                                                    { id: "ARS", label: "ARS" },
                                                    { id: "USD", label: "USD" },
                                                ]}
                                                value={editFormData.currency ?? ""}
                                                onChange={(c) => setEditFormData((p) => ({ ...p, currency: (c || undefined) as Currency | undefined }))}
                                                placeholder="—"
                                                clearable
                                                clearLabel="—"
                                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                            />
                                        </div>
                                        <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                                            <span style={fieldLabelAbove}>Estado</span>
                                            <Dropdown
                                                options={[
                                                    { id: "false", label: "Pendiente" },
                                                    { id: "true", label: editFormData.type === "income" ? "Recibido" : "Pagado" },
                                                ]}
                                                value={editFormData.is_paid ? "true" : "false"}
                                                onChange={(v) => setEditFormData((p) => ({ ...p, is_paid: v === "true" }))}
                                                placeholder="—"
                                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                                        <div style={{ flex: "2 1 200px", minWidth: 0 }}>
                                            <span style={fieldLabelAbove}>Categoría</span>
                                            <Dropdown
                                                groups={categoryGroups}
                                                value={editFormData.subcategory_id ?? ""}
                                                onChange={(subId) => setEditFormData((p) => ({ ...p, subcategory_id: subId, category_id: getCategoryId(subId) }))}
                                                placeholder="Seleccionar..."
                                                searchable
                                                clearable
                                                clearLabel="—"
                                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                            />
                                        </div>
                                        <div style={{ flex: "2 1 200px", minWidth: 0 }}>
                                            <span style={fieldLabelAbove}>Método de pago</span>
                                            <Dropdown
                                                groups={accountGroups}
                                                value={editFormData.account_id ?? ""}
                                                onChange={(accId) => setEditFormData((p) => ({ ...p, account_id: accId, channel_id: getChannelId(accId) }))}
                                                placeholder="Seleccionar..."
                                                searchable
                                                clearable
                                                clearLabel="—"
                                                triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {deletedPresets.length > 0 && (
                <div style={{ marginTop: spacing[6] }}>
                    <h4 style={{ color: colors.fg.dim, fontSize: fonts.size.sm, marginBottom: spacing[3], fontWeight: 500 }}>
                        Presets borrados
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                        {deletedPresets.map((preset) => (
                            <div
                                key={preset.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: `${spacing[3]} ${spacing[4]}`,
                                    backgroundColor: colors.bg.surface,
                                    border: `1px dashed ${colors.border}`,
                                    borderRadius: radius.md,
                                    opacity: 0.6,
                                }}
                            >
                                <span style={{ fontSize: fonts.size.sm }}>{preset.name}</span>
                                <Button
                                    variant="icon"
                                    onClick={() => handleRestorePreset(preset.id)}
                                    title="Restaurar"
                                >
                                    <RotateCcw size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDeletePreset}
                title="Confirmar eliminación"
                description="¿Eliminar este preset?"
                isLoading={deletePresetMutation.isPending}
            />
        </div>
    );
}
