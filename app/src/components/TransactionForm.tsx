import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronDown, RefreshCw } from "lucide-react";
import type { TransactionAggregateReq, TransactionType } from "@/api_client/types";
import { useCreateTransaction, useCategories, useSubcategories, useChannels, useAccounts, useUserConfig, useDollarBanks } from "@/hooks";
import { economic } from "@/api_client";
import { spacing, radius, shadows } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { DatePicker } from "@/components/ui/DatePicker";

const inputStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: colors.bg.dim,
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    color: colors.fg.default,
    fontSize: "var(--font-size-sm)",
    width: "100%",
    height: "36px",
    boxSizing: "border-box",
    outline: "none",
};

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "2px",
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    padding: spacing[2],
    minWidth: "250px",
    maxHeight: "400px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    zIndex: 50,
    boxShadow: shadows.lg,
};

const dropdownItemStyle: React.CSSProperties = {
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: radius.sm,
    fontSize: "var(--font-size-sm)",
    color: colors.fg.default,
    whiteSpace: "normal",
    wordBreak: "break-word",
};

const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: colors.fg.muted,
    fontWeight: 500,
    marginBottom: "3px",
    display: "block",
};

interface OptGroupDropdownProps {
    value: string;
    label: string;
    groups: { label: string; items: { id: string; name: string; lastFour?: string }[] }[];
    onChange: (id: string) => void;
    open: boolean;
    onToggle: (open: boolean) => void;
}

function OptGroupDropdown({
    value,
    label,
    groups,
    onChange,
    open,
    onToggle,
}: OptGroupDropdownProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    return (
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <label style={labelStyle}>{label}</label>
            <button
                type="button"
                data-dropdown-btn
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onToggle(!open);
                }}
                style={{
                    ...inputStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                }}
            >
                <span>{value || "-"}</span>
                <ChevronDown size={14} style={{ color: colors.fg.muted }} />
            </button>
            {open && (
                <div
                    ref={panelRef}
                    style={{ ...dropdownStyle, width: "100%", minWidth: "200px" }}
                    data-dropdown-panel
                    onWheel={handleWheel}
                >
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div
                                style={{
                                    ...dropdownItemStyle,
                                    fontWeight: 600,
                                    color: colors.fg.muted,
                                    cursor: "default",
                                }}
                            >
                                {group.label}
                            </div>
                            {group.items.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        ...dropdownItemStyle,
                                        paddingLeft: "20px",
                                        backgroundColor:
                                            value === item.id
                                                ? colors.highlight.low
                                                : "transparent",
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        onChange(item.id);
                                    }}
                                >
                                    {item.name}
                                    {item.lastFour && ` ${item.lastFour}`}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function TransactionForm() {
    const [expanded, setExpanded] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const descRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<TransactionAggregateReq>({
        description: "",
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        frequency: "variable",
        installment_number: undefined,
        amount: "",
        currency: "ARS",
        exchange_rate: 1,
        category_id: "",
        subcategory_id: "",
        channel_id: "",
        account_id: "",
    });

    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();
    const { data: userConfig } = useUserConfig();
    const { data: dollarBanks } = useDollarBanks(undefined, false);

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const createMutation = useCreateTransaction();

    useEffect(() => {
        if (expanded && descRef.current) {
            setTimeout(() => descRef.current?.focus(), 100);
        }
    }, [expanded]);

    useEffect(() => {
        if (!openDropdown) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const isDropdownButton = target.closest("[data-dropdown-btn]");
            const isDropdownPanel = target.closest("[data-dropdown-panel]");

            if (!isDropdownButton && !isDropdownPanel) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    useEffect(() => {
        if (userConfig?.dollar_source && dollarBanks) {
            const bankValue = dollarBanks[userConfig.dollar_source];
            if (bankValue) {
                setFormData((prev) => ({ ...prev, exchange_rate: bankValue.sell }));
            }
        }
    }, [expanded, userConfig?.dollar_source, dollarBanks]);

    const toggleDropdown = (name: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setOpenDropdown((prev) => (prev === name ? null : name));
    };

    const categoryGroups = categoriesList
        .map((cat) => ({
            label: cat.name,
            items: subcategoriesList
                .filter((s) => s.category_id === cat.id)
                .map((s) => ({ id: s.id, name: s.name })),
        }))
        .filter((g) => g.items.length > 0);

    const accountGroups = channelsList
        .map((ch) => ({
            label: ch.name,
            items: accountsList
                .filter((a) => a.channel_id === ch.id)
                .map((a) => ({ id: a.id, name: a.name, lastFour: a.last_four || undefined })),
        }))
        .filter((g) => g.items.length > 0);

    const resetForm = () => {
        setFormData({
            description: "",
            date: new Date().toISOString().split("T")[0],
            type: "expense",
            frequency: "variable",
            installment_number: undefined,
            amount: "",
            currency: "ARS",
            exchange_rate: 1,
            category_id: "",
            subcategory_id: "",
            channel_id: "",
            account_id: "",
        });
    };

    const handleClose = () => {
        resetForm();
        setExpanded(false);
    };

    const handleCategorySelect = (subId: string) => {
        const sub = subcategoriesList.find((s) => s.id === subId);
        setFormData({
            ...formData,
            subcategory_id: subId,
            category_id: sub?.category_id || "",
        });
        setOpenDropdown(null);
    };

    const handleAccountSelect = (accId: string) => {
        const acc = accountsList.find((a) => a.id === accId);
        setFormData({
            ...formData,
            account_id: accId,
            channel_id: acc?.channel_id || "",
        });
        setOpenDropdown(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSend = {
            ...formData,
            installment_number: formData.installment_number
                ? parseInt(String(formData.installment_number))
                : undefined,
        };
        createMutation.mutate(dataToSend, {
            onSuccess: () => {
                resetForm();
            },
            onError: (err) => {
                console.error(err);
            },
        });
    };

    const toggleType = (type: TransactionType) => {
        setFormData({ ...formData, type });
    };

    return (
        <div
            style={{
                marginBottom: spacing[3],
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                border: `3px solid ${colors.highlight.medium}`,
            }}
        >
            {!expanded ? (
                <button
                    onClick={() => setExpanded(true)}
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
                    <Plus size={16} />
                    <span style={{ fontWeight: 500, fontSize: "var(--font-size-sm)" }}>
                        Nueva Transacción
                    </span>
                </button>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 12px",
                            borderBottom: `1px solid ${colors.highlight.medium}`,
                            backgroundColor: colors.bg.dim,
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: colors.fg.default }}>
                            Nueva Transacción
                        </span>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                display: "flex",
                                padding: "4px",
                                backgroundColor: colors.bg.default,
                                border: "none",
                                color: colors.fg.muted,
                                cursor: "pointer",
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div
                        style={{
                            padding: "6px 6px",
                            margin: "0 4px 4px",
                        }}
                    >
                        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                            <button
                                type="button"
                                onClick={() => toggleType("expense")}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    backgroundColor:
                                        formData.type === "expense"
                                            ? colors.semantic.error
                                            : colors.bg.default,
                                    color:
                                        formData.type === "expense" ? "white" : colors.fg.default,
                                    border: `1px solid ${colors.highlight.medium}`,
                                    borderRadius: radius.md,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "var(--font-size-sm)",
                                }}
                            >
                                Egreso
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleType("income")}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    backgroundColor:
                                        formData.type === "income"
                                            ? colors.accent.teal
                                            : colors.bg.default,
                                    color:
                                        formData.type === "income" ? "white" : colors.fg.default,
                                    border: `1px solid ${colors.highlight.medium}`,
                                    borderRadius: radius.md,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "var(--font-size-sm)",
                                }}
                            >
                                Ingreso
                            </button>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "6px",
                                alignItems: "flex-end",
                            }}
                        >
                            <div style={{ width: "140px", flexShrink: 0 }}>
                                <label style={labelStyle}>Fecha</label>
                                <DatePicker
                                    value={formData.date}
                                    onChange={(value) => setFormData({ ...formData, date: value })}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <label style={labelStyle}>Descripción</label>
                                <input
                                    ref={descRef}
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Descripción"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div style={{ width: "180px", flexShrink: 0 }}>
                                <label style={labelStyle}>Monto</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                    placeholder="0.00"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div style={{ width: "70px", flexShrink: 0, position: "relative" }}>
                                <label style={labelStyle}>Moneda</label>
                                <button
                                    type="button"
                                    data-dropdown-btn
                                    onMouseDown={(e) => toggleDropdown("currency", e)}
                                    style={{
                                        ...inputStyle,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                    }}
                                >
                                    <span>{formData.currency}</span>
                                    <ChevronDown size={14} style={{ color: colors.fg.muted }} />
                                </button>
                                {openDropdown === "currency" && (
                                    <div style={dropdownStyle} data-dropdown-panel>
                                        <div
                                            style={{
                                                ...dropdownItemStyle,
                                                backgroundColor:
                                                    formData.currency === "ARS"
                                                        ? colors.highlight.low
                                                        : "transparent",
                                            }}
                                            onClick={() => {
                                                setFormData({ ...formData, currency: "ARS" });
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            ARS
                                        </div>
                                        <div
                                            style={{
                                                ...dropdownItemStyle,
                                                backgroundColor:
                                                    formData.currency === "USD"
                                                        ? colors.highlight.low
                                                        : "transparent",
                                            }}
                                            onClick={() => {
                                                setFormData({ ...formData, currency: "USD" });
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            USD
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ width: "110px", flexShrink: 0 }}>
                                <label style={labelStyle}>TC</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number"
                                        value={formData.exchange_rate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                exchange_rate: parseFloat(e.target.value) || 1,
                                            })
                                        }
                                        style={{ ...inputStyle, paddingRight: "32px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const banks = await economic.getDollarBanks(undefined, true);
                                            if (userConfig?.dollar_source && banks) {
                                                const bankValue = banks[userConfig.dollar_source];
                                                if (bankValue) {
                                                    setFormData((prev) => ({ ...prev, exchange_rate: bankValue.sell }));
                                                }
                                            }
                                        }}
                                        title="Actualizar TC"
                                        style={{
                                            position: "absolute",
                                            right: "4px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: "28px",
                                            height: "28px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "transparent",
                                            border: "none",
                                            color: colors.fg.muted,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ width: "95px", flexShrink: 0, position: "relative" }}>
                                <label style={labelStyle}>Frecuencia</label>
                                <button
                                    type="button"
                                    data-dropdown-btn
                                    onMouseDown={(e) => toggleDropdown("frequency", e)}
                                    style={{
                                        ...inputStyle,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                    }}
                                >
                                    <span>
                                        {formData.frequency === "variable" ? "Var" : "Fijo"}
                                    </span>
                                    <ChevronDown size={14} style={{ color: colors.fg.muted }} />
                                </button>
                                {openDropdown === "frequency" && (
                                    <div style={{ ...dropdownStyle, left: "auto", right: 0 }} data-dropdown-panel>
                                        <div
                                            style={{
                                                ...dropdownItemStyle,
                                                backgroundColor:
                                                    formData.frequency === "variable"
                                                        ? colors.highlight.low
                                                        : "transparent",
                                            }}
                                            onClick={() => {
                                                setFormData({ ...formData, frequency: "variable" });
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            Var
                                        </div>
                                        <div
                                            style={{
                                                ...dropdownItemStyle,
                                                backgroundColor:
                                                    formData.frequency === "fixed"
                                                        ? colors.highlight.low
                                                        : "transparent",
                                            }}
                                            onClick={() => {
                                                setFormData({ ...formData, frequency: "fixed" });
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            Fijo
                                        </div>
                                    </div>
                                )}
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

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "6px",
                            }}
                        >
                            <OptGroupDropdown
                                value={
                                    formData.subcategory_id
                                        ? subcategoriesList.find(
                                              (s) => s.id === formData.subcategory_id
                                          )?.name || ""
                                        : ""
                                }
                                label="Categoría"
                                groups={categoryGroups}
                                onChange={handleCategorySelect}
                                open={openDropdown === "category"}
                                onToggle={(open) => setOpenDropdown(open ? "category" : null)}
                            />
                            <OptGroupDropdown
                                value={
                                    formData.account_id
                                        ? accountsList.find((a) => a.id === formData.account_id)
                                              ?.name || ""
                                        : ""
                                }
                                label="Método de Pago"
                                groups={accountGroups}
                                onChange={handleAccountSelect}
                                open={openDropdown === "account"}
                                onToggle={(open) => setOpenDropdown(open ? "account" : null)}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            padding: "6px 12px",
                            justifyContent: "flex-end",
                            backgroundColor: colors.bg.dim,
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: "6px 12px",
                                backgroundColor: colors.bg.default,
                                border: `1px solid ${colors.highlight.medium}`,
                                borderRadius: radius.md,
                                color: colors.fg.default,
                                cursor: "pointer",
                                fontSize: "var(--font-size-sm)",
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            style={{
                                padding: "6px 12px",
                                backgroundColor: colors.accent.teal,
                                color: colors.bg.default,
                                border: "none",
                                borderRadius: radius.md,
                                cursor: createMutation.isPending ? "not-allowed" : "pointer",
                                opacity: createMutation.isPending ? 0.7 : 1,
                                fontSize: "var(--font-size-sm)",
                                fontWeight: 600,
                            }}
                        >
                            {createMutation.isPending ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
