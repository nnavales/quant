import { useState, useEffect, useRef } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import type { TransactionAggregateReq, Preset } from "@/api_client/types";
import { useCreateTransaction, useCategories, useSubcategories, useChannels, useAccounts, useUserConfig, useDollarBanks, useCategoryGroups, useAccountGroups, useDollarRate, usePresets } from "@/hooks";
import { spacing, radius } from "@/styles/theme";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Modal, ModalContent } from "@/components/ui/Modal";

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "income" | "expense";
}

const modalStyle: React.CSSProperties = {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    width: "92%",
    maxWidth: "900px",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${colors.border}`,
    outline: `1px solid ${colors.border}`,
};

const inputStyle: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.bg.base,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    width: "100%",
    height: "40px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    fontWeight: 500,
    marginBottom: spacing[2],
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

export function TransactionModal({ isOpen, onClose, type: initialType }: TransactionModalProps) {
    const { data: userConfig } = useUserConfig();
    const { data: dollarBanks } = useDollarBanks(undefined, false);

    const [selectedPresetId, setSelectedPresetId] = useState("");

    const [formData, setFormData] = useState<TransactionAggregateReq>({
        description: "",
        date: new Date().toISOString().split("T")[0],
        type: initialType,
        frequency: "variable",
        installment_number: undefined,
        amount: "",
        currency: "ARS",
        exchange_rate: userConfig?.default_rate ? parseFloat(userConfig.default_rate) : 0,
        category_id: "",
        subcategory_id: "",
        channel_id: "",
        account_id: "",
        is_paid: false,
    });

    const descRef = useRef<HTMLInputElement>(null);

    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const { data: presetsData } = usePresets();
    const presetsList = presetsData ?? [];

    const createMutation = useCreateTransaction();

    const applyPreset = (preset: Preset) => {
        setFormData((prev) => ({
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

    const resetToDefaults = () => {
        setFormData((prev) => ({
            ...prev,
            description: "",
            frequency: "variable",
            currency: "ARS",
            category_id: "",
            subcategory_id: "",
            channel_id: "",
            account_id: "",
            is_paid: false,
        }));
    };

    useEffect(() => {
        if (isOpen) {
            setSelectedPresetId("");
            resetForm();
        }
    }, [initialType, isOpen]);

    useEffect(() => {
        if (isOpen && descRef.current) {
            setTimeout(() => descRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const { refreshRate } = useDollarRate(
        userConfig?.dollar_source,
        dollarBanks,
        (rate) => setFormData((prev) => ({ ...prev, exchange_rate: rate })),
        userConfig?.default_rate
    );

    useEffect(() => {
        if (isOpen) {
            refreshRate();
        }
    }, [isOpen, refreshRate]);

    const { groups: categoryGroups, getCategoryId } = useCategoryGroups(categoriesList, subcategoriesList);
    const { groups: accountGroups, getChannelId } = useAccountGroups(channelsList, accountsList);

    const handleCategorySelect = (subId: string) => {
        setFormData({ ...formData, subcategory_id: subId, category_id: getCategoryId(subId) });
    };

    const handleAccountSelect = (accId: string) => {
        setFormData({ ...formData, account_id: accId, channel_id: getChannelId(accId) });
    };

    const resetForm = () => {
        setFormData({
            description: "",
            date: new Date().toISOString().split("T")[0],
            type: initialType,
            frequency: "variable",
            installment_number: undefined,
            amount: "",
            currency: "ARS",
            exchange_rate: userConfig?.default_rate ? parseFloat(userConfig.default_rate) : 0,
            category_id: "",
            subcategory_id: "",
            channel_id: "",
            account_id: "",
            is_paid: false,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSend = {
            ...formData,
            installment_number: formData.installment_number ? parseInt(String(formData.installment_number)) : undefined,
        };
        createMutation.mutate(dataToSend, {
            onSuccess: () => {
                toast("Transacción creada", "success");
                resetForm();
                onClose();
            },
            onError: (err) => {
                toast(getApiErrorMessage(err));
            },
        });
    };

    const isExpense = formData.type === "expense";

    return (
        <Modal isOpen={isOpen} onClose={onClose} opacity={0.8}>
            <ModalContent style={modalStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: `${spacing[4]} ${spacing[5]}`,
                        borderBottom: `1px solid ${colors.fill}`,
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: fonts.size.lg,
                                fontWeight: 600,
                                color: colors.fg.base,
                            }}
                        >
                            Nueva Transacción
                        </h2>
                        <p style={{ margin: `${spacing[1]} 0 0`, fontSize: fonts.size.xs, color: colors.fg.dim }}>
                            {isExpense ? "Registrar egreso" : "Registrar ingreso"}
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                        {/* Preset Selector in Header */}
                        {(() => {
                            const allPresets = presetsList.filter((p) => !p.deleted_at);
                            if (allPresets.length === 0) return null;
                            return (
                                <div style={{ width: "200px" }}>
                                    <Dropdown
                                        options={[
                                            ...allPresets.map((p) => ({
                                                id: p.id,
                                                label: `${p.name} ${p.type === "income" ? "(Ingreso)" : "(Gasto)"}`,
                                            })),
                                        ]}
                                        value={selectedPresetId}
                                        onChange={(id) => {
                                            setSelectedPresetId(id);
                                            const preset = allPresets.find((p) => p.id === id);
                                            if (preset) {
                                                applyPreset(preset);
                                            } else {
                                                resetToDefaults();
                                            }
                                        }}
                                        triggerStyle={{ height: "36px" }}
                                        searchable
                                        clearable
                                        clearLabel="Default"
                                        placeholder="Default"
                                    />
                                </div>
                            );
                        })()}
                        <Button variant="plain" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        padding: `${spacing[4]} ${spacing[5]}`,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: spacing[4],
                    }}
                >
                    {/* Type Toggle */}
                    <div
                        style={{
                            display: "flex",
                            backgroundColor: colors.bg.base,
                            border: `1px solid ${colors.border}`,
                            borderRadius: radius.md,
                            padding: "2px",
                        }}
                    >
                        <Button
                            type="button"
                            variant="tab"
                            color="red"
                            active={formData.type === "expense"}
                            onClick={() => {
                                setSelectedPresetId("");
                                setFormData({ ...formData, type: "expense" });
                            }}
                            fullWidth
                            iconLeft={<TrendingDown size={16} />}
                        >
                            Gasto
                        </Button>
                        <Button
                            type="button"
                            variant="tab"
                            color="green"
                            active={formData.type === "income"}
                            onClick={() => {
                                setSelectedPresetId("");
                                setFormData({ ...formData, type: "income" });
                            }}
                            fullWidth
                            iconLeft={<TrendingUp size={16} />}
                        >
                            Ingreso
                        </Button>
                    </div>

                    {/* Date + Description + is_paid */}
                    <div style={{ display: "flex", gap: spacing[3], alignItems: "flex-end" }}>
                        <div style={{ width: "160px", flexShrink: 0 }}>
                            <label style={labelStyle}>Fecha</label>
                            <DatePicker
                                value={formData.date}
                                onChange={(value) => setFormData({ ...formData, date: value })}
                                triggerStyle={{
                                backgroundColor: colors.bg.base,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.md,
                                height: "40px",
                                    fontSize: fonts.size.sm,
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <label style={labelStyle}>Descripción</label>
                            <input
                                ref={descRef}
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ej: Supermercado, Sueldo, etc."
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={{ width: "140px", flexShrink: 0 }}>
                            <label style={labelStyle}>Estado</label>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    height: "40px",
                                    gap: spacing[2],
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, is_paid: !prev.is_paid }))}
                                    style={{
                                        width: "44px",
                                        height: "24px",
                                        borderRadius: "12px",
                                        border: "none",
                                        cursor: "pointer",
                                        backgroundColor: formData.is_paid ? colors.accent.teal : colors.fill,
                                        position: "relative",
                                        transition: "background-color 0.2s",
                                        padding: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "2px",
                                            left: formData.is_paid ? "22px" : "2px",
                                            width: "20px",
                                            height: "20px",
                                            borderRadius: "50%",
                                            backgroundColor: colors.bg.base,
                                            transition: "left 0.2s",
                                            display: "block",
                                        }}
                                    />
                                </button>
                                <span style={{ fontSize: fonts.size.sm, color: colors.fg.base }}>
                                    {formData.is_paid ? (formData.type === "income" ? "Recibido" : "Pagado") : "Pendiente"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Amount + Currency + TC + Frequency */}
                    <div style={{ display: "flex", gap: spacing[3], alignItems: "flex-end" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <label style={labelStyle}>Monto</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={{ width: "100px", flexShrink: 0 }}>
                            <label style={labelStyle}>Moneda</label>
                            <Dropdown
                                options={[
                                    { id: "ARS", label: "ARS" },
                                    { id: "USD", label: "USD" },
                                ]}
                                value={formData.currency}
                                onChange={(c) => setFormData({ ...formData, currency: c as "ARS" | "USD" })}
                                triggerStyle={{ height: "40px" }}
                            />
                        </div>
                        <div style={{ width: "140px", flexShrink: 0, position: "relative" }}>
                            <label style={labelStyle}>Tipo de Cambio</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="number"
                                    value={formData.exchange_rate}
                                    onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 1 })}
                                    style={{ ...inputStyle, paddingRight: "36px" }}
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
                            <label style={labelStyle}>Frecuencia</label>
                            <Dropdown
                                options={[
                                    { id: "variable", label: "Variable" },
                                    { id: "fixed", label: "Fijo" },
                                ]}
                                value={formData.frequency}
                                onChange={(f) => setFormData({ ...formData, frequency: f as "variable" | "fixed" })}
                                triggerStyle={{ height: "40px" }}
                            />
                        </div>
                        <div style={{ width: "85px", flexShrink: 0 }}>
                            <label style={labelStyle}>Cuotas</label>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={formData.installment_number || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        installment_number: e.target.value
                                            ? Math.min(parseInt(e.target.value), 500)
                                            : undefined,
                                    })
                                }
                                placeholder="-"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Category + Account */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3] }}>
                        <div>
                            <label style={labelStyle}>Categoría</label>
                            <Dropdown
                                groups={categoryGroups}
                                value={formData.subcategory_id}
                                onChange={handleCategorySelect}
                                placeholder="-"
                                searchable
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Método de Pago</label>
                            <Dropdown
                                groups={accountGroups}
                                value={formData.account_id}
                                onChange={handleAccountSelect}
                                placeholder="-"
                                searchable
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        gap: spacing[3],
                        padding: `${spacing[3]} ${spacing[5]}`,
                        borderTop: `1px solid ${colors.fill}`,
                    }}
                >
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || !formData.description || !formData.amount}
                        loading={createMutation.isPending}
                        fullWidth
                        iconLeft={createMutation.isPending ? undefined : (isExpense ? <TrendingDown size={14} /> : <TrendingUp size={14} />)}
                    >
                        Registrar {isExpense ? "Gasto" : "Ingreso"}
                    </Button>
                </div>
            </ModalContent>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </Modal>
    );
}