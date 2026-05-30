import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    PenLine,
    Plus,
    Pencil,
    Trash2,
    ChevronLeft,
    Search,
} from "lucide-react";
import type {
    TransactionAggregateReq,
    Preset,
    PresetReq,
    TransactionFrequency,
    Currency,
} from "@/api_client/types";
import {
    useCreateTransaction,
    useCategories,
    useSubcategories,
    useChannels,
    useAccounts,
    useUserConfig,
    useDollarBanks,
    useCategoryGroups,
    useAccountGroups,
    useDollarRate,
    usePresets,
    useCreatePreset,
    useDeletePreset,
    useUpdatePreset,
} from "@/hooks";
import { spacing, radius } from "@/styles/theme";
import { inputStyle as formInputStyle, labelStyle as txLabelStyle } from "@/styles/formStyles";
import { inputStyle as layoutInputStyle, flexColumn, flexRow, truncate } from "@/styles/layout";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { formatISODateInTimezone, getNowInTimezone } from "@/utils/date";
import { parseLocaleNumber } from "@/utils/format";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Modal, ModalContent, ModalCloseButton } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type View = "picker" | "preset-form" | "transaction";
type Filter = "all" | "income" | "expense";

export interface TransactionFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: "picker" | "transaction";
    onTransactionCreated?: (id: string, installmentGroupId: string | null) => void;
}

const emptyPresetForm: PresetReq = {
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

const presetLabelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    fontWeight: fonts.weight.medium,
    marginBottom: spacing[2],
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

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
    const statusLabel = preset.is_paid ? (isIncome ? "Recibido" : "Pagado") : "Pendiente";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === "Enter" && onClick()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: hovered ? colors.bg.elevated : colors.bg.elevated,
                borderRadius: radius.xl,
                padding: "13px 14px",
                cursor: "pointer",
                ...flexColumn,
                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: hovered ? "translateY(-3px)" : "translateY(0)",
                boxShadow: hovered ? colors.shadows.sm : "none",
                width: 210,
                height: 130,
                outline: "none",
                boxSizing: "border-box",
            }}
        >
            {/* Name + badge / actions */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 6,
                }}
            >
                <div
                    style={{
                        fontSize: fonts.size.sm,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.base,
                        lineHeight: 1.3,
                        flex: 1,
                        minWidth: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                    }}
                >
                    {preset.name}
                </div>
                {hovered ? (
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            title="Editar"
                            style={{
                                ...flexRow,
                                justifyContent: "center",
                                width: 24,
                                height: 24,
                                borderRadius: radius.md,
                                border: "none",
                                backgroundColor: colors.fill,
                                color: colors.fg.dim,
                                cursor: "pointer",
                                transition: "all 0.1s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.border;
                                e.currentTarget.style.color = colors.fg.base;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colors.fill;
                                e.currentTarget.style.color = colors.fg.dim;
                            }}
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            title="Eliminar"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 24,
                                height: 24,
                                borderRadius: radius.md,
                                border: "none",
                                backgroundColor: `${colors.accent.red}18`,
                                color: colors.accent.red,
                                cursor: "pointer",
                                transition: "all 0.1s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${colors.accent.red}30`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${colors.accent.red}18`;
                            }}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ) : (
                    <span
                        style={{
                            fontSize: fonts.size.xs,
                            fontWeight: fonts.weight.semibold,
                            color: accentColor,
                            backgroundColor: `${accentColor}18`,
                            borderRadius: radius.lg,
                            padding: "2px 8px",
                            letterSpacing: "0.02em",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {isIncome ? "Ingreso" : "Egreso"}
                    </span>
                )}
            </div>

            {/* Bottom group — pushed to bottom */}
            <div style={{ marginTop: "auto", ...flexColumn, gap: "3px" }}>
                {/* Category + account (stacked) */}
                {categoryDisplay && (
                    <span
                        style={{
                            ...truncate,
                            fontSize: fonts.size.xs,
                            fontWeight: fonts.weight.medium,
                            color: hovered ? colors.fg.base : colors.fg.dim,
                            backgroundColor: colors.fill,
                            borderRadius: radius.lg,
                            padding: "0 7px",
                            alignSelf: "flex-start",
                            maxWidth: "100%",
                            transition: "color 0.15s",
                        }}
                    >
                        {categoryDisplay}
                    </span>
                )}
                {accountDisplay && (
                    <span
                        style={{
                            ...truncate,
                            fontSize: fonts.size.xs,
                            fontWeight: fonts.weight.medium,
                            color: hovered ? colors.fg.base : colors.fg.dim,
                            backgroundColor: colors.fill,
                            borderRadius: radius.lg,
                            padding: "0 7px",
                            alignSelf: "flex-start",
                            maxWidth: "100%",
                            transition: "color 0.15s",
                        }}
                    >
                        {accountDisplay}
                    </span>
                )}
                {/* Frequency + status + currency in one row */}
                <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {preset.frequency && (
                        <span
                            style={{
                                fontSize: fonts.size.xs,
                                fontWeight: hovered ? fonts.weight.medium : fonts.weight.regular,
                                color: hovered ? colors.fg.base : colors.fg.dim,
                                backgroundColor: colors.fill,
                                borderRadius: radius.lg,
                                padding: "0 7px",
                                transition: "color 0.15s",
                            }}
                        >
                            {preset.frequency === "fixed" ? "Fijo" : "Variable"}
                        </span>
                    )}
                    <span
                        style={{
                            fontSize: fonts.size.xs,
                            fontWeight: fonts.weight.medium,
                            color: hovered ? colors.fg.base : colors.fg.dim,
                            backgroundColor: colors.fill,
                            borderRadius: radius.lg,
                            padding: "0 7px",
                            transition: "color 0.15s",
                        }}
                    >
                        {statusLabel}
                    </span>
                    <span
                        style={{
                            fontSize: fonts.size.xs,
                            fontWeight: fonts.weight.medium,
                            color: hovered ? colors.fg.base : colors.fg.dim,
                            backgroundColor: colors.fill,
                            borderRadius: radius.lg,
                            padding: "0 7px",
                            transition: "color 0.15s",
                        }}
                    >
                        {preset.currency ?? "ARS"}
                    </span>
                </div>
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
                    <label style={presetLabelStyle}>Nombre</label>
                    <input
                        type="text"
                        value={form.name ?? ""}
                        onChange={(e) => onChange({ ...form, name: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSave();
                        }}
                        placeholder="Ej: Supermercado"
                        autoFocus
                        style={{
                            ...layoutInputStyle,
                            fontSize: fonts.size.sm,
                            backgroundColor: colors.bg.elevated,
                        }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        backgroundColor: colors.bg.elevated,
                        borderRadius: radius.md,
                        padding: "2px",
                        flexShrink: 0,
                        height: 34,
                        boxSizing: "border-box",
                    }}
                >
                    <Button
                        type="button"
                        variant="tab"
                        color="red"
                        active={form.type === "expense"}
                        onClick={() => onChange({ ...form, type: "expense" })}
                        iconLeft={<TrendingDown size={16} />}
                        noHover
                        style={{ borderRadius: radius.md }}
                    >
                        Egreso
                    </Button>
                    <Button
                        type="button"
                        variant="tab"
                        color="green"
                        active={form.type === "income"}
                        onClick={() => onChange({ ...form, type: "income" })}
                        iconLeft={<TrendingUp size={16} />}
                        noHover
                        style={{ borderRadius: radius.md }}
                    >
                        Ingreso
                    </Button>
                </div>
            </div>

            <div>
                <label style={presetLabelStyle}>Descripción</label>
                <input
                    type="text"
                    value={form.description ?? ""}
                    onChange={(e) => onChange({ ...form, description: e.target.value })}
                    placeholder="Ej: Compras semanales"
                    style={{
                        ...layoutInputStyle,
                        fontSize: fonts.size.sm,
                        backgroundColor: colors.bg.elevated,
                    }}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[3] }}>
                <div>
                    <label style={presetLabelStyle}>Frecuencia</label>
                    <Dropdown
                        options={[
                            { id: "fixed", label: "Fijo" },
                            { id: "variable", label: "Variable" },
                        ]}
                        value={form.frequency ?? ""}
                        onChange={(f) =>
                            onChange({
                                ...form,
                                frequency: (f || undefined) as TransactionFrequency | undefined,
                            })
                        }
                        placeholder="—"
                        clearable
                        clearLabel="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
                <div>
                    <label style={presetLabelStyle}>Moneda</label>
                    <Dropdown
                        options={[
                            { id: "ARS", label: "ARS" },
                            { id: "USD", label: "USD" },
                        ]}
                        value={form.currency ?? ""}
                        onChange={(c) =>
                            onChange({
                                ...form,
                                currency: (c || undefined) as Currency | undefined,
                            })
                        }
                        placeholder="—"
                        clearable
                        clearLabel="—"
                        triggerStyle={{ backgroundColor: colors.bg.elevated }}
                    />
                </div>
                <div>
                    <label style={presetLabelStyle}>Estado</label>
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
                <div style={{ minWidth: 0 }}>
                    <label style={presetLabelStyle}>Categoría</label>
                    <Dropdown
                        groups={categoryGroups}
                        value={form.subcategory_id ?? ""}
                        onChange={(subId) =>
                            onChange({
                                ...form,
                                subcategory_id: subId,
                                category_id: getCategoryId(subId),
                            })
                        }
                        placeholder="-"
                        searchable
                        fixPanelWidth
                        panelStyle={{ maxWidth: "min(420px, 90vw)" }}
                        triggerStyle={formInputStyle}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <label style={presetLabelStyle}>Método de pago</label>
                    <Dropdown
                        groups={accountGroups}
                        value={form.account_id ?? ""}
                        onChange={(accId) =>
                            onChange({
                                ...form,
                                account_id: accId,
                                channel_id: getChannelId(accId),
                            })
                        }
                        placeholder="-"
                        searchable
                        fixPanelWidth
                        panelStyle={{ maxWidth: "min(420px, 90vw)" }}
                        triggerStyle={formInputStyle}
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

export function TransactionFlowModal({
    isOpen,
    onClose,
    initialView = "picker",
    onTransactionCreated,
}: TransactionFlowModalProps) {
    const queryClient = useQueryClient();

    // View routing
    const [view, setView] = useState<View>(initialView);
    const [cameFromPicker, setCameFromPicker] = useState(false);

    // Picker state
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
    const [presetFormData, setPresetFormData] = useState<PresetReq>({ ...emptyPresetForm });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Transaction form state
    const { data: userConfig } = useUserConfig();
    const { data: dollarBanks } = useDollarBanks(undefined, false);
    const [exchangeRateInput, setExchangeRateInput] = useState("0");
    const [txFormData, setTxFormData] = useState<TransactionAggregateReq>({
        description: "",
        date: "",
        type: "expense",
        frequency: "variable",
        installment_number: undefined,
        amount: "",
        currency: "ARS",
        exchange_rate: 0,
        category_id: "",
        subcategory_id: "",
        channel_id: "",
        account_id: "",
        is_paid: true,
    });
    const descRef = useRef<HTMLInputElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);
    const [focusOnAmount, setFocusOnAmount] = useState(false);

    // Shared data
    const { data: presetsData } = usePresets();
    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();

    // Mutations
    const createPresetMutation = useCreatePreset();
    const deletePresetMutation = useDeletePreset();
    const updatePresetMutation = useUpdatePreset();
    const createTxMutation = useCreateTransaction();

    // Derived lists
    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];
    const allPresets = (presetsData ?? []).filter((p) => !p.deleted_at);

    const { groups: categoryGroups, getCategoryId } = useCategoryGroups(
        categoriesList,
        subcategoriesList
    );
    const { groups: accountGroups, getChannelId } = useAccountGroups(channelsList, accountsList);

    // Dollar rate
    const { refreshRate } = useDollarRate(
        userConfig?.dollar_source,
        dollarBanks,
        (rate) => {
            setTxFormData((prev) => ({ ...prev, exchange_rate: rate }));
            setExchangeRateInput(String(rate));
        },
        userConfig?.default_rate
    );

    const resetTxForm = () => {
        const defaultRate = userConfig?.default_rate
            ? parseLocaleNumber(userConfig.default_rate)
            : 0;
        setTxFormData({
            description: "",
            date: formatISODateInTimezone(
                getNowInTimezone(userConfig?.timezone),
                userConfig?.timezone
            ),
            type: "expense",
            frequency: "variable",
            installment_number: undefined,
            amount: "",
            currency: "ARS",
            exchange_rate: defaultRate,
            category_id: "",
            subcategory_id: "",
            channel_id: "",
            account_id: "",
            is_paid: true,
        });
        setExchangeRateInput(String(defaultRate));
    };

    const applyPreset = (preset: Preset) => {
        setTxFormData((prev) => ({
            ...prev,
            type: preset.type,
            description: preset.description ?? "",
            frequency: preset.frequency ?? "variable",
            currency: preset.currency ?? "ARS",
            category_id: preset.category_id ?? "",
            subcategory_id: preset.subcategory_id ?? "",
            channel_id: preset.channel_id ?? "",
            account_id: preset.account_id ?? "",
            is_paid: preset.is_paid ?? false,
        }));
    };

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setCameFromPicker(false);
            setFilter("all");
            setSearch("");
            setEditingPreset(null);
            setPresetFormData({ ...emptyPresetForm });
            setDeleteConfirm(null);
            resetTxForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Focus description or amount when entering transaction view
    useEffect(() => {
        if (isOpen && view === "transaction") {
            const t = setTimeout(() => {
                if (focusOnAmount) amountRef.current?.focus();
                else descRef.current?.focus();
            }, 100);
            return () => clearTimeout(t);
        }
    }, [view, isOpen, focusOnAmount]);

    // Refresh exchange rate when entering transaction view
    useEffect(() => {
        if (isOpen && view === "transaction") {
            refreshRate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, isOpen]);

    // Navigation
    const goToTransaction = (preset?: Preset) => {
        resetTxForm();
        if (preset) applyPreset(preset);
        setCameFromPicker(true);
        setFocusOnAmount(!!preset);
        setView("transaction");
    };

    const goToCreatePreset = () => {
        setPresetFormData({ ...emptyPresetForm });
        setEditingPreset(null);
        setView("preset-form");
    };

    const goToEditPreset = (preset: Preset) => {
        setPresetFormData({
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
        setView("preset-form");
    };

    const backToPicker = () => {
        setView("picker");
        setCameFromPicker(false);
        setEditingPreset(null);
        setPresetFormData({ ...emptyPresetForm });
        setSearch("");
    };

    // Preset CRUD
    const refetchPresets = () => queryClient.invalidateQueries({ queryKey: ["presets"] });

    const buildPresetPayload = (f: PresetReq): PresetReq => {
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

    const handleCreatePreset = () => {
        if (!presetFormData.name?.trim()) return;
        createPresetMutation.mutate(buildPresetPayload(presetFormData), {
            onSuccess: () => {
                refetchPresets();
                backToPicker();
                toast("Preset creado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleUpdatePreset = () => {
        if (!editingPreset || !presetFormData.name?.trim()) return;
        updatePresetMutation.mutate(
            { id: editingPreset.id, data: buildPresetPayload(presetFormData) },
            {
                onSuccess: () => {
                    refetchPresets();
                    backToPicker();
                    toast("Preset actualizado", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const confirmDeletePreset = () => {
        if (!deleteConfirm) return;
        deletePresetMutation.mutate(deleteConfirm, {
            onSuccess: () => {
                refetchPresets();
                setDeleteConfirm(null);
                toast("Preset eliminado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    // Transaction submit
    const handleTxSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSend = {
            ...txFormData,
            amount: String(parseLocaleNumber(txFormData.amount)),
            exchange_rate: parseLocaleNumber(exchangeRateInput) || 1,
            installment_number: txFormData.installment_number
                ? parseInt(String(txFormData.installment_number))
                : undefined,
        };
        createTxMutation.mutate(dataToSend, {
            onSuccess: (data) => {
                toast("Transacción creada", "success");
                resetTxForm();
                onClose();
                if (data?.id) onTransactionCreated?.(data.id, data.installment_group_id ?? null);
            },
            onError: (err) => toast(getApiErrorMessage(err)),
        });
    };

    // Filtered presets for picker
    const filteredPresets = allPresets
        .filter(
            (p) =>
                filter === "all" ||
                (filter === "income" ? p.type === "income" : p.type === "expense")
        )
        .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

    const getSubcategoryName = (id: string | null) =>
        subcategoriesList.find((s) => s.id === id)?.name ?? null;
    const getAccountName = (id: string | null) =>
        accountsList.find((a) => a.id === id)?.name ?? null;
    const getChannelName = (id: string | null) =>
        channelsList.find((c) => c.id === id)?.name ?? null;
    const getCategoryDisplay = (p: Preset) => getSubcategoryName(p.subcategory_id ?? null);
    const getAccountDisplay = (p: Preset) =>
        getAccountName(p.account_id ?? null) ?? getChannelName(p.channel_id ?? null);

    // Derived
    const isPresetFormSaving = createPresetMutation.isPending || updatePresetMutation.isPending;
    const isExpense = txFormData.type === "expense";
    const isPickerView = view === "picker";
    const showBackButton = view === "preset-form" || (view === "transaction" && cameFromPicker);

    const modalMaxWidth = view === "picker" ? 900 : view === "preset-form" ? 580 : 900;
    const modalHeight = isPickerView ? "auto" : "auto";
    const modalMaxHeight = isPickerView ? "90vh" : "80vh";

    const headerTitle =
        view === "preset-form"
            ? editingPreset
                ? "Editar preset"
                : "Nuevo preset"
            : "Nueva Transacción";

    const iconBtn: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: radius.md,
        border: "none",
        backgroundColor: "transparent",
        color: colors.fg.dim,
        cursor: "pointer",
        transition: "all 0.12s ease",
    };

    const filterTabStyle = (f: Filter): React.CSSProperties => {
        const active = filter === f;
        const activeColor =
            f === "income" ? colors.accent.green : f === "expense" ? colors.accent.red : null;
        return {
            fontSize: fonts.size.xs2,
            fontWeight: active ? fonts.weight.semibold : fonts.weight.regular,
            color: active ? (activeColor ?? colors.fg.base) : colors.fg.dim,
            backgroundColor: active
                ? activeColor
                    ? `${activeColor}20`
                    : colors.bg.elevated
                : "transparent",
            border: "none",
            borderRadius: radius.md,
            padding: "2px 10px",
            minWidth: 70,
            cursor: "pointer",
            transition: "all 0.12s ease",
            whiteSpace: "nowrap" as const,
        };
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} opacity={0.75}>
                <ModalContent
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: "16px",
                        width: "92%",
                        maxWidth: modalMaxWidth,
                        height: modalHeight,
                        maxHeight: modalMaxHeight,
                        ...flexColumn,
                        overflow: "hidden",
                        boxShadow: colors.shadows.xl,
                        transition: "max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    {/* Header — picker view */}
                    {isPickerView ? (
                        <div style={{ flexShrink: 0, borderBottom: `1px solid ${colors.fill}` }}>
                            {/* Title row */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: `0 ${spacing[5]}`,
                                    height: "48px",
                                }}
                            >
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: fonts.size.base,
                                        fontWeight: fonts.weight.semibold,
                                        color: colors.fg.base,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    Mis Presets
                                </h2>
                                <ModalCloseButton onClick={onClose} />
                            </div>
                            {/* Filter row */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: spacing[2],
                                    padding: `0 ${spacing[5]} ${spacing[3]}`,
                                }}
                            >
                                <div style={{ position: "relative", flex: 1, height: 28 }}>
                                    <Search
                                        size={13}
                                        style={{
                                            position: "absolute",
                                            left: 9,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: colors.fg.dim,
                                            pointerEvents: "none",
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar preset..."
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            boxSizing: "border-box",
                                            padding: "0 12px 0 28px",
                                            lineHeight: "normal",
                                            fontSize: fonts.size.xs2,
                                            fontWeight: fonts.weight.medium,
                                            fontFamily: fonts.family,
                                            color: colors.fg.base,
                                            backgroundColor: colors.fill,
                                            border: "none",
                                            borderRadius: radius.md,
                                            outline: "none",
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 2,
                                        backgroundColor: colors.fill,
                                        borderRadius: radius.md,
                                        padding: 2,
                                        height: 28,
                                        boxSizing: "border-box",
                                        flexShrink: 0,
                                    }}
                                >
                                    {(["all", "income", "expense"] as Filter[]).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            style={filterTabStyle(f)}
                                        >
                                            {f === "all"
                                                ? "Todos"
                                                : f === "income"
                                                  ? "Ingresos"
                                                  : "Egresos"}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={goToCreatePreset}
                                    style={{
                                        ...flexRow,
                                        gap: 5,
                                        height: 28,
                                        fontSize: fonts.size.xs2,
                                        fontWeight: fonts.weight.medium,
                                        fontFamily: fonts.family,
                                        color: colors.accent.cyan,
                                        backgroundColor: `${colors.accent.cyan}14`,
                                        border: "none",
                                        borderRadius: radius.md,
                                        padding: "0 10px",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        transition: "all 0.12s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${colors.accent.cyan}24`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = `${colors.accent.cyan}14`;
                                    }}
                                >
                                    <Plus size={13} /> Nuevo preset
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: `0 ${spacing[5]}`,
                                height: "52px",
                                borderBottom: `1px solid ${colors.fill}`,
                                flexShrink: 0,
                            }}
                        >
                            <div style={{ ...flexRow, gap: spacing[2] }}>
                                {showBackButton && (
                                    <button
                                        onClick={backToPicker}
                                        title="Volver"
                                        style={iconBtn}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.fill;
                                            e.currentTarget.style.color = colors.fg.base;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                            e.currentTarget.style.color = colors.fg.dim;
                                        }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                )}
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: fonts.size.base,
                                        fontWeight: fonts.weight.semibold,
                                        color: colors.fg.base,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    {headerTitle}
                                </h2>
                            </div>

                            <ModalCloseButton onClick={onClose} />
                        </div>
                    )}

                    {/* Body — scrollable */}
                    <div
                        style={{
                            padding: `${spacing[4]} ${spacing[5]}`,
                            overflowY: isPickerView
                                ? filteredPresets.length > 12
                                    ? "auto"
                                    : "hidden"
                                : "auto",
                            flex: isPickerView ? "none" : 1,
                            height: isPickerView ? "430px" : undefined,
                            backgroundColor: colors.bg.surface,
                        }}
                    >
                        {/* ---- PICKER VIEW ---- */}
                        {isPickerView && (
                            <>
                                {allPresets.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            color: colors.fg.dim,
                                            fontSize: fonts.size.sm,
                                            padding: `${spacing[8]} 0`,
                                        }}
                                    >
                                        No hay presets creados aún
                                    </div>
                                ) : filteredPresets.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            color: colors.fg.dim,
                                            fontSize: fonts.size.sm,
                                            padding: `${spacing[8]} 0`,
                                        }}
                                    >
                                        No se encontraron presets
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(4, 210px)",
                                            gap: spacing[2],
                                            justifyContent: "center",
                                        }}
                                    >
                                        {filteredPresets.map((preset) => (
                                            <PresetCard
                                                key={preset.id}
                                                preset={preset}
                                                categoryDisplay={getCategoryDisplay(preset)}
                                                accountDisplay={getAccountDisplay(preset)}
                                                onClick={() => goToTransaction(preset)}
                                                onEdit={() => goToEditPreset(preset)}
                                                onDelete={() => setDeleteConfirm(preset.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ---- PRESET FORM VIEW ---- */}
                        {view === "preset-form" && (
                            <PresetForm
                                form={presetFormData}
                                onChange={setPresetFormData}
                                onSave={editingPreset ? handleUpdatePreset : handleCreatePreset}
                                isSaving={isPresetFormSaving}
                                categoryGroups={categoryGroups}
                                accountGroups={accountGroups}
                                getCategoryId={getCategoryId}
                                getChannelId={getChannelId}
                            />
                        )}

                        {/* ---- TRANSACTION FORM VIEW ---- */}
                        {view === "transaction" && (
                            <form
                                onSubmit={handleTxSubmit}
                                style={{ ...flexColumn, gap: spacing[4] }}
                            >
                                {/* Type Toggle */}
                                <div
                                    style={{
                                        display: "flex",
                                        backgroundColor: colors.bg.elevated,
                                        borderRadius: radius.md,
                                        padding: "2px",
                                    }}
                                >
                                    <Button
                                        type="button"
                                        variant="tab"
                                        color="red"
                                        active={txFormData.type === "expense"}
                                        onClick={() => {
                                            setTxFormData({ ...txFormData, type: "expense" });
                                        }}
                                        fullWidth
                                        iconLeft={<TrendingDown size={16} />}
                                        noHover
                                        style={{ borderRadius: radius.md }}
                                    >
                                        Egreso
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="tab"
                                        color="green"
                                        active={txFormData.type === "income"}
                                        onClick={() => {
                                            setTxFormData({ ...txFormData, type: "income" });
                                        }}
                                        fullWidth
                                        iconLeft={<TrendingUp size={16} />}
                                        noHover
                                        style={{ borderRadius: radius.md }}
                                    >
                                        Ingreso
                                    </Button>
                                </div>

                                {/* Date + Description + Estado */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: spacing[3],
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <div style={{ width: "160px", flexShrink: 0 }}>
                                        <label style={txLabelStyle}>Fecha</label>
                                        <DatePicker
                                            value={txFormData.date}
                                            onChange={(value) =>
                                                setTxFormData({ ...txFormData, date: value })
                                            }
                                            triggerStyle={formInputStyle}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label style={txLabelStyle}>Descripción</label>
                                        <input
                                            ref={descRef}
                                            type="text"
                                            value={txFormData.description}
                                            onChange={(e) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Ej: Supermercado, Sueldo, etc."
                                            style={formInputStyle}
                                            required
                                        />
                                    </div>
                                    <div style={{ width: "140px", flexShrink: 0 }}>
                                        <label style={txLabelStyle}>Estado</label>
                                        <div
                                            style={{ ...flexRow, height: "34px", gap: spacing[2] }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTxFormData((prev) => ({
                                                        ...prev,
                                                        is_paid: !prev.is_paid,
                                                    }))
                                                }
                                                style={{
                                                    width: "44px",
                                                    height: "24px",
                                                    borderRadius: "12px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    backgroundColor: txFormData.is_paid
                                                        ? colors.accent.cyan
                                                        : colors.fill,
                                                    position: "relative",
                                                    transition: "background-color 0.2s",
                                                    padding: 0,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        position: "absolute",
                                                        top: "2px",
                                                        left: txFormData.is_paid ? "22px" : "2px",
                                                        width: "20px",
                                                        height: "20px",
                                                        borderRadius: "50%",
                                                        backgroundColor: colors.bg.base,
                                                        transition: "left 0.2s",
                                                        display: "block",
                                                    }}
                                                />
                                            </button>
                                            <span
                                                style={{
                                                    fontSize: fonts.size.sm,
                                                    color: colors.fg.base,
                                                }}
                                            >
                                                {txFormData.is_paid
                                                    ? txFormData.type === "income"
                                                        ? "Recibido"
                                                        : "Pagado"
                                                    : "Pendiente"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount + Currency + TC + Frequency + Cuotas */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: spacing[3],
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label style={txLabelStyle}>Monto</label>
                                        <input
                                            ref={amountRef}
                                            type="text"
                                            inputMode="decimal"
                                            value={txFormData.amount}
                                            onChange={(e) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    amount: e.target.value,
                                                })
                                            }
                                            placeholder="0,00"
                                            style={formInputStyle}
                                            required
                                        />
                                    </div>
                                    <div style={{ width: "100px", flexShrink: 0 }}>
                                        <label style={txLabelStyle}>Moneda</label>
                                        <Dropdown
                                            options={[
                                                { id: "ARS", label: "ARS" },
                                                { id: "USD", label: "USD" },
                                            ]}
                                            value={txFormData.currency}
                                            onChange={(c) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    currency: c as "ARS" | "USD",
                                                })
                                            }
                                            triggerStyle={formInputStyle}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: "140px",
                                            flexShrink: 0,
                                            position: "relative",
                                        }}
                                    >
                                        <label style={txLabelStyle}>Tipo de Cambio</label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={exchangeRateInput}
                                                onChange={(e) =>
                                                    setExchangeRateInput(e.target.value)
                                                }
                                                style={{ ...formInputStyle, paddingRight: "36px" }}
                                            />
                                            <Button
                                                variant="icon"
                                                type="button"
                                                onClick={refreshRate}
                                                title="Actualizar tipo de cambio"
                                                style={{
                                                    position: "absolute",
                                                    right: "6px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                }}
                                            >
                                                <RefreshCw size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div style={{ width: "140px", flexShrink: 0 }}>
                                        <label style={txLabelStyle}>Frecuencia</label>
                                        <Dropdown
                                            options={[
                                                { id: "variable", label: "Variable" },
                                                { id: "fixed", label: "Fijo" },
                                            ]}
                                            value={txFormData.frequency}
                                            onChange={(f) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    frequency: f as "variable" | "fixed",
                                                })
                                            }
                                            triggerStyle={formInputStyle}
                                        />
                                    </div>
                                    <div style={{ width: "85px", flexShrink: 0 }}>
                                        <label style={txLabelStyle}>Cuotas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="500"
                                            value={txFormData.installment_number || ""}
                                            onChange={(e) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    installment_number: e.target.value
                                                        ? Math.min(parseInt(e.target.value), 500)
                                                        : undefined,
                                                })
                                            }
                                            placeholder="-"
                                            style={formInputStyle}
                                        />
                                    </div>
                                </div>

                                {/* Category + Account */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: spacing[3],
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <label style={txLabelStyle}>Categoría</label>
                                        <Dropdown
                                            groups={categoryGroups}
                                            value={txFormData.subcategory_id}
                                            onChange={(subId) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    subcategory_id: subId,
                                                    category_id: getCategoryId(subId),
                                                })
                                            }
                                            placeholder="-"
                                            searchable
                                            fixPanelWidth
                                            panelStyle={{ maxWidth: "min(420px, 90vw)" }}
                                            triggerStyle={formInputStyle}
                                        />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <label style={txLabelStyle}>Método de Pago</label>
                                        <Dropdown
                                            groups={accountGroups}
                                            value={txFormData.account_id}
                                            onChange={(accId) =>
                                                setTxFormData({
                                                    ...txFormData,
                                                    account_id: accId,
                                                    channel_id: getChannelId(accId),
                                                })
                                            }
                                            placeholder="-"
                                            searchable
                                            fixPanelWidth
                                            panelStyle={{ maxWidth: "min(420px, 90vw)" }}
                                            triggerStyle={formInputStyle}
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer — picker */}
                    {isPickerView && (
                        <div
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: colors.bg.surface,
                                flexShrink: 0,
                            }}
                        >
                            <SubmitButton
                                type="button"
                                onClick={() => goToTransaction()}
                                iconLeft={<PenLine size={14} />}
                                fullWidth
                            >
                                Carga manual
                            </SubmitButton>
                        </div>
                    )}

                    {/* Footer — transaction */}
                    {view === "transaction" && (
                        <div
                            style={{
                                display: "flex",
                                gap: spacing[3],
                                padding: `${spacing[3]} ${spacing[5]}`,
                                flexShrink: 0,
                            }}
                        >
                            <SubmitButton
                                type="submit"
                                onClick={handleTxSubmit}
                                disabled={
                                    createTxMutation.isPending ||
                                    !txFormData.description ||
                                    !txFormData.amount
                                }
                                loading={createTxMutation.isPending}
                                fullWidth
                                iconLeft={
                                    createTxMutation.isPending ? undefined : isExpense ? (
                                        <TrendingDown size={14} />
                                    ) : (
                                        <TrendingUp size={14} />
                                    )
                                }
                            >
                                Registrar {isExpense ? "Egreso" : "Ingreso"}
                            </SubmitButton>
                        </div>
                    )}
                </ModalContent>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDeletePreset}
                title="Eliminar preset"
                description="¿Eliminar este preset? Esta acción no se puede deshacer."
                isLoading={deletePresetMutation.isPending}
                destructive
            />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
