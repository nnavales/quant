import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Preset, PresetReq, TransactionFrequency, Currency } from "@/api_client/types";
import {
    usePresets,
    useCreatePreset,
    useDeletePreset,
    useUpdatePreset,
    useSubcategories,
    useAccounts,
    useChannels,
    useCategories,
    useCategoryGroups,
    useAccountGroups,
} from "@/hooks";
import { Modal, ModalContent, ModalCloseButton } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { colors, hoverFill } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { spacing, radius } from "@/styles/theme";
import { inputStyle, flexColumn, flexRow, truncate } from "@/styles/layout";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { PenLine, Plus, Pencil, Trash2, ChevronLeft, TrendingUp, TrendingDown, Search } from "lucide-react";

type Filter = "all" | "income" | "expense";
type View = "grid" | "create" | "edit";

interface PresetPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPreset: (preset: Preset) => void;
    onManual: () => void;
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

const labelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    fontWeight: fonts.weight.medium,
    marginBottom: spacing[1],
    display: "block",
};

function TypeToggle({ value, onChange }: { value: "expense" | "income" | undefined; onChange: (v: "expense" | "income") => void }) {
    const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: fonts.size.xs,
        fontWeight: active ? fonts.weight.semibold : fonts.weight.regular,
        color: active ? color : colors.fg.dim,
        backgroundColor: active ? `${color}20` : "transparent",
        border: "none",
        borderRadius: radius.md,
        padding: "0 10px",
        cursor: "pointer",
        transition: "all 0.12s ease",
        whiteSpace: "nowrap" as const,
    });
    return (
        <div style={{ display: "flex", backgroundColor: colors.bg.base, borderRadius: radius.lg, padding: 2, flexShrink: 0, height: 34, boxSizing: "border-box", alignItems: "stretch" }}>
            <button style={tabStyle(value === "expense", colors.accent.red)} onClick={() => onChange("expense")}>
                <TrendingDown size={12} strokeWidth={2.5} /> Egreso
            </button>
            <button style={tabStyle(value === "income", colors.accent.green)} onClick={() => onChange("income")}>
                <TrendingUp size={12} strokeWidth={2.5} /> Ingreso
            </button>
        </div>
    );
}

function PresetCard({
    preset,
    categoryDisplay,
    accountDisplay,
    onClick,
    onEdit,
    onDelete,
}: {
    preset: Preset;
    categoryDisplay: string | null;
    accountDisplay: string | null;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const isIncome = preset.type === "income";
    const accentColor = isIncome ? colors.accent.green : colors.accent.red;
    const initials = preset.name.split(/[\s/]+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
    const metaParts = [categoryDisplay, accountDisplay].filter(Boolean);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === "Enter" && onClick()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: hovered ? colors.bg.hover : colors.bg.surface,
                borderRadius: radius.xl,
                padding: "14px",
                cursor: "pointer",
                ...flexColumn,
                gap: spacing[2],
                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: hovered ? "translateY(-2px)" : "translateY(0)",
                height: 160,
                outline: "none",
                position: "relative",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{
                    width: 30, height: 30,
                    borderRadius: radius.lg,
                    backgroundColor: `${accentColor}1a`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: fonts.size.xs,
                    fontWeight: fonts.weight.bold,
                    color: accentColor,
                    flexShrink: 0,
                    letterSpacing: "0.02em",
                }}>
                    {initials}
                </div>
                {hovered ? (
                    <div style={{ display: "flex", gap: 2 }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            title="Editar"
                            style={{
                                ...flexRow, justifyContent: "center",
                                width: 24, height: 24,
                                borderRadius: radius.md,
                                border: "none",
                                backgroundColor: colors.fill,
                                color: colors.fg.dim,
                                cursor: "pointer",
                                transition: "all 0.1s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverFill(colors.fill); e.currentTarget.style.color = colors.fg.base; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.dim; }}
                        >
                            <Pencil size={11} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            title="Eliminar"
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 24, height: 24,
                                borderRadius: radius.md,
                                border: "none",
                                backgroundColor: `${colors.accent.red}18`,
                                color: colors.accent.red,
                                cursor: "pointer",
                                transition: "all 0.1s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent.red}30`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent.red}18`; }}
                        >
                            <Trash2 size={11} strokeWidth={2.5} />
                        </button>
                    </div>
                ) : (
                    <span style={{
                        fontSize: "10px",
                        fontWeight: fonts.weight.semibold,
                        color: accentColor,
                        backgroundColor: `${accentColor}18`,
                        borderRadius: radius.full,
                        padding: "2px 7px",
                        letterSpacing: "0.02em",
                    }}>
                        {isIncome ? "Ingreso" : "Egreso"}
                    </span>
                )}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{...truncate, fontSize: fonts.size.sm,
                    fontWeight: fonts.weight.semibold,
                    color: colors.fg.base,
                    lineHeight: 1.25}}>
                    {preset.name}
                </div>
                {metaParts.length > 0 && (
                    <div style={{...truncate, fontSize: "10px", color: colors.fg.dim,
                        marginTop: 3,
                        letterSpacing: "0.01em"}}>
                        {metaParts.join(" · ")}
                    </div>
                )}
            </div>

            <div style={{ fontSize: "10px", fontWeight: fonts.weight.semibold, color: accentColor, letterSpacing: "0.04em" }}>
                {preset.currency ?? "ARS"}
            </div>
        </div>
    );
}

function PresetForm({
    form,
    onChange,
    onSave,
    isSaving,
    categoryGroups,
    accountGroups,
    getCategoryId,
    getChannelId,
}: {
    form: PresetReq;
    onChange: (f: PresetReq) => void;
    onSave: () => void;
    isSaving: boolean;
    categoryGroups: ReturnType<typeof useCategoryGroups>["groups"];
    accountGroups: ReturnType<typeof useAccountGroups>["groups"];
    getCategoryId: (subId: string) => string;
    getChannelId: (accId: string) => string;
}) {
    return (
        <div style={{ ...flexColumn, gap: spacing[4] }}>
            <div style={{ display: "flex", gap: spacing[3], alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>Nombre</label>
                    <input
                        type="text"
                        value={form.name ?? ""}
                        onChange={(e) => onChange({ ...form, name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
                        placeholder="Ej: Supermercado"
                        autoFocus
                        style={{ ...inputStyle, fontSize: fonts.size.sm, backgroundColor: colors.bg.elevated }}
                    />
                </div>
                <TypeToggle value={form.type} onChange={(type) => onChange({ ...form, type })} />
            </div>

            <div>
                <label style={labelStyle}>Descripción</label>
                <input
                    type="text"
                    value={form.description ?? ""}
                    onChange={(e) => onChange({ ...form, description: e.target.value })}
                    placeholder="Ej: Compras semanales"
                    style={{ ...inputStyle, fontSize: fonts.size.sm, backgroundColor: colors.bg.elevated }}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[3] }}>
                <div>
                    <label style={labelStyle}>Frecuencia</label>
                    <Dropdown
                        options={[{ id: "fixed", label: "Fijo" }, { id: "variable", label: "Variable" }]}
                        value={form.frequency ?? ""}
                        onChange={(f) => onChange({ ...form, frequency: (f || undefined) as TransactionFrequency | undefined })}
                        placeholder="—"
                        clearable
                        clearLabel="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Moneda</label>
                    <Dropdown
                        options={[{ id: "ARS", label: "ARS" }, { id: "USD", label: "USD" }]}
                        value={form.currency ?? ""}
                        onChange={(c) => onChange({ ...form, currency: (c || undefined) as Currency | undefined })}
                        placeholder="—"
                        clearable
                        clearLabel="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Estado</label>
                    <Dropdown
                        options={[
                            { id: "false", label: "Pendiente" },
                            { id: "true", label: form.type === "income" ? "Recibido" : "Pagado" },
                        ]}
                        value={form.is_paid ? "true" : "false"}
                        onChange={(v) => onChange({ ...form, is_paid: v === "true" })}
                        placeholder="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3] }}>
                <div>
                    <label style={labelStyle}>Categoría</label>
                    <Dropdown
                        groups={categoryGroups}
                        value={form.subcategory_id ?? ""}
                        onChange={(subId) => onChange({ ...form, subcategory_id: subId, category_id: getCategoryId(subId) })}
                        placeholder="Seleccionar..."
                        searchable
                        clearable
                        clearLabel="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Método de pago</label>
                    <Dropdown
                        groups={accountGroups}
                        value={form.account_id ?? ""}
                        onChange={(accId) => onChange({ ...form, account_id: accId, channel_id: getChannelId(accId) })}
                        placeholder="Seleccionar..."
                        searchable
                        clearable
                        clearLabel="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
            </div>

            <div style={{ paddingTop: spacing[1] }}>
                <SubmitButton
                    onClick={onSave}
                    disabled={!form.name?.trim() || isSaving}
                    loading={isSaving}
                    fullWidth
                >
                    {isSaving ? "Guardando..." : "Guardar"}
                </SubmitButton>
            </div>
        </div>
    );
}

export function PresetPickerModal({ isOpen, onClose, onSelectPreset, onManual }: PresetPickerModalProps) {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const [view, setView] = useState<View>("grid");
    const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
    const [formData, setFormData] = useState<PresetReq>({ ...emptyForm });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const { data: presetsData } = usePresets();
    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: accountsData } = useAccounts();
    const { data: channelsData } = useChannels();

    const createMutation = useCreatePreset();
    const deleteMutation = useDeletePreset();
    const updateMutation = useUpdatePreset();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const { groups: categoryGroups, getCategoryId } = useCategoryGroups(categoriesList, subcategoriesList);
    const { groups: accountGroups, getChannelId } = useAccountGroups(channelsList, accountsList);

    const allPresets = (presetsData ?? []).filter((p) => !p.deleted_at);
    const subcategories = subcategoriesData ?? [];
    const accounts = accountsData ?? [];
    const channels = channelsData ?? [];

    const filtered = allPresets
        .filter((p) => filter === "all" || (filter === "income" ? p.type === "income" : p.type === "expense"))
        .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

    const getSubcategoryName = (id: string | null) => subcategories.find((s) => s.id === id)?.name ?? null;
    const getAccountName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? null;
    const getChannelName = (id: string | null) => channels.find((c) => c.id === id)?.name ?? null;
    const getCategoryDisplay = (p: Preset) => getSubcategoryName(p.subcategory_id ?? null);
    const getAccountDisplay = (p: Preset) => getAccountName(p.account_id ?? null) ?? getChannelName(p.channel_id ?? null);

    function refetch() { queryClient.invalidateQueries({ queryKey: ["presets"] }); }

    const openCreate = () => {
        setFormData({ ...emptyForm });
        setEditingPreset(null);
        setView("create");
    };

    const openEdit = (preset: Preset) => {
        setFormData({
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
        setEditingPreset(preset);
        setView("edit");
    };

    const backToGrid = () => {
        setView("grid");
        setEditingPreset(null);
        setFormData({ ...emptyForm });
        setSearch("");
    };

    const buildPayload = (f: PresetReq): PresetReq => {
        const data: PresetReq = { name: f.name?.trim() ?? "", type: f.type };
        if (f.description?.trim()) data.description = f.description.trim();
        if (f.frequency) data.frequency = f.frequency;
        if (f.subcategory_id?.trim()) data.subcategory_id = f.subcategory_id.trim();
        if (f.category_id?.trim()) data.category_id = f.category_id.trim();
        if (f.account_id?.trim()) data.account_id = f.account_id.trim();
        if (f.channel_id?.trim()) data.channel_id = f.channel_id.trim();
        if (f.is_paid !== undefined) data.is_paid = f.is_paid;
        if (f.currency) data.currency = f.currency;
        return data;
    };

    const handleCreate = () => {
        const name = formData.name?.trim();
        if (!name) return;
        const exists = allPresets.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.type === formData.type);
        if (exists) {
            toast(`El preset "${name}" ya existe para ese tipo`);
            return;
        }
        createMutation.mutate(buildPayload(formData), {
            onSuccess: () => { refetch(); backToGrid(); toast("Preset creado", "success"); },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleUpdate = () => {
        if (!editingPreset || !formData.name?.trim()) return;
        const name = formData.name.trim();
        const exists = allPresets.some((p) => p.id !== editingPreset.id && p.name.toLowerCase() === name.toLowerCase() && p.type === formData.type);
        if (exists) {
            toast(`El preset "${name}" ya existe para ese tipo`);
            return;
        }
        updateMutation.mutate({ id: editingPreset.id, data: buildPayload(formData) }, {
            onSuccess: () => { refetch(); backToGrid(); toast("Preset actualizado", "success"); },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;
        deleteMutation.mutate(deleteConfirm, {
            onSuccess: () => { refetch(); setDeleteConfirm(null); toast("Preset eliminado", "success"); },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isFormView = view === "create" || view === "edit";

    const filterTabStyle = (f: Filter): React.CSSProperties => {
        const active = filter === f;
        const activeColor = f === "income" ? colors.accent.green : f === "expense" ? colors.accent.red : null;
        return {
            fontSize: fonts.size.xs,
            fontWeight: active ? fonts.weight.semibold : fonts.weight.regular,
            color: active ? (activeColor ?? colors.fg.base) : colors.fg.dim,
            backgroundColor: active ? (activeColor ? `${activeColor}20` : colors.fill) : "transparent",
            border: "none",
            borderRadius: radius.md,
            padding: "3px 10px",
            cursor: "pointer",
            transition: "all 0.12s ease",
            whiteSpace: "nowrap" as const,
        };
    };

    const iconBtn: React.CSSProperties = {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28,
        borderRadius: radius.md,
        border: "none",
        backgroundColor: "transparent",
        color: colors.fg.dim,
        cursor: "pointer",
        transition: "all 0.12s ease",
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} opacity={0.5}>
                <ModalContent
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: "16px",
                        width: "92%",
                        maxWidth: isFormView ? 580 : 860,
                        height: isFormView ? "auto" : "calc(72vh - 40px)",
                        maxHeight: "90vh",
                        ...flexColumn,
                        overflow: "hidden",
                        transition: "max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: `${spacing[4]} ${spacing[5]}`,
                        borderBottom: `1px solid ${colors.border}`,
                        flexShrink: 0,
                    }}>
                        <div style={{ ...flexRow, gap: spacing[2] }}>
                            {isFormView && (
                                <button
                                    onClick={backToGrid}
                                    title="Volver"
                                    style={iconBtn}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
                                >
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                            )}
                            <div>
                                <h2 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: fonts.weight.semibold, color: colors.fg.base, letterSpacing: "-0.01em" }}>
                                    {view === "create" ? "Nuevo Preset" : view === "edit" ? "Editar Preset" : "Nueva Transacción"}
                                </h2>
                                <p style={{ margin: `${spacing[1]} 0 0`, fontSize: fonts.size.xs3, color: colors.fg.dim }}>
                                    {view === "create" ? "Completá los campos del preset" : view === "edit" ? editingPreset?.name : "Seleccionar preset"}
                                </p>
                            </div>
                        </div>
                        <ModalCloseButton onClick={onClose} />
                    </div>

                    {/* Body */}
                    <div style={{
                        padding: `${spacing[5]} ${spacing[5]}`,
                        overflowY: "auto",
                        flex: 1,
                        backgroundColor: isFormView ? colors.bg.surface : colors.bg.base,
                    }}>
                        {isFormView ? (
                            <PresetForm
                                form={formData}
                                onChange={setFormData}
                                onSave={view === "create" ? handleCreate : handleUpdate}
                                isSaving={isSaving}
                                categoryGroups={categoryGroups}
                                accountGroups={accountGroups}
                                getCategoryId={getCategoryId}
                                getChannelId={getChannelId}
                            />
                        ) : (
                            <>
                                {/* Search + filter tabs + new button */}
                                <div style={{ ...flexRow, gap: spacing[2], marginBottom: spacing[3] }}>
                                    <div style={{ position: "relative", flex: 1 }}>
                                        <Search size={13} strokeWidth={2.5} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: colors.fg.dim, pointerEvents: "none" }} />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Buscar preset..."
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                paddingLeft: 28,
                                                paddingRight: spacing[3],
                                                paddingTop: "5px",
                                                paddingBottom: "5px",
                                                fontSize: fonts.size.xs3,
                                                color: colors.fg.base,
                                                backgroundColor: colors.bg.surface,
                                                border: "none",
                                                borderRadius: radius.lg,
                                                outline: "none",
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: 2, backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: 3, flexShrink: 0 }}>
                                        {(["all", "income", "expense"] as Filter[]).map((f) => (
                                            <button key={f} onClick={() => setFilter(f)} style={filterTabStyle(f)}>
                                                {f === "all" ? "Todos" : f === "income" ? "Ingresos" : "Egresos"}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={openCreate}
                                        style={{
                                            ...flexRow, gap: 5,
                                            fontSize: fonts.size.xs,
                                            fontWeight: fonts.weight.medium,
                                            color: colors.fg.dim,
                                            backgroundColor: colors.bg.surface,
                                            border: "none",
                                            borderRadius: radius.lg,
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                            flexShrink: 0,
                                            transition: "all 0.12s ease",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.fg.base; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.fg.dim; }}
                                    >
                                        <Plus size={13} strokeWidth={2.5} />
                                        Nuevo
                                    </button>
                                </div>

                                {/* Grid */}
                                {allPresets.length === 0 ? (
                                    <div style={{ textAlign: "center", color: colors.fg.dim, fontSize: fonts.size.sm, padding: `${spacing[8]} 0` }}>
                                        No hay presets creados aún
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div style={{ textAlign: "center", color: colors.fg.dim, fontSize: fonts.size.sm, padding: `${spacing[8]} 0` }}>
                                        No se encontraron presets
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: spacing[2] }}>
                                        {filtered.map((preset) => (
                                            <PresetCard
                                                key={preset.id}
                                                preset={preset}
                                                categoryDisplay={getCategoryDisplay(preset)}
                                                accountDisplay={getAccountDisplay(preset)}
                                                onClick={() => onSelectPreset(preset)}
                                                onEdit={() => openEdit(preset)}
                                                onDelete={() => setDeleteConfirm(preset.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer — grid view only */}
                    {!isFormView && (
                        <div style={{
                            padding: `${spacing[4]} ${spacing[5]}`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: spacing[3],
                            backgroundColor: colors.bg.surface,
                            borderTop: `1px solid ${colors.border}`,
                            flexShrink: 0,
                        }}>
                            <div style={{ ...flexRow, width: "100%", gap: spacing[3] }}>
                                <div style={{ flex: 1, height: 1, backgroundColor: colors.fill }} />
                                <span style={{ fontSize: "10px", color: colors.fg.dim, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
                                    o ingresá manualmente
                                </span>
                                <div style={{ flex: 1, height: 1, backgroundColor: colors.fill }} />
                            </div>
                            <button
                                onClick={onManual}
                                style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    fontSize: fonts.size.sm,
                                    fontWeight: fonts.weight.medium,
                                    color: colors.fg.dim,
                                    backgroundColor: colors.bg.base,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: radius.lg,
                                    padding: "8px 20px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = colors.border;
                                    e.currentTarget.style.color = colors.fg.base;
                                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = colors.border;
                                    e.currentTarget.style.color = colors.fg.dim;
                                    e.currentTarget.style.backgroundColor = colors.bg.base;
                                }}
                            >
                                <PenLine size={13} strokeWidth={2.5} />
                                Abrir formulario completo
                            </button>
                        </div>
                    )}
                </ModalContent>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Eliminar preset"
                description="¿Eliminar este preset? Esta acción no se puede deshacer."
                isLoading={deleteMutation.isPending}
                destructive
            />
        </>
    );
}
