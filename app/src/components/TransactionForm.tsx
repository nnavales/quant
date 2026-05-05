import { useState, useEffect, useRef } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
import type { TransactionAggregateReq, TransactionType } from "@/api_client/types";
import { useCreateTransaction, useCategories, useSubcategories, useChannels, useAccounts, useUserConfig, useDollarBanks } from "@/hooks";
import { economic } from "@/api_client";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";

const inputStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    width: "100%",
    height: "36px",
    boxSizing: "border-box",
    outline: "none",
};

const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: colors.fg.dim,
    fontWeight: 500,
    marginBottom: "3px",
    display: "block",
};

export function TransactionForm() {
    const [expanded, setExpanded] = useState(false);
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
        if (userConfig?.dollar_source && dollarBanks) {
            const bankValue = dollarBanks[userConfig.dollar_source];
            if (bankValue) {
                setFormData((prev) => ({ ...prev, exchange_rate: bankValue.sell }));
            }
        }
    }, [expanded, userConfig?.dollar_source, dollarBanks]);

    const categoryGroups = categoriesList
        .map((cat) => ({
            label: cat.name,
            items: subcategoriesList
                .filter((s) => s.category_id === cat.id)
                .map((s) => ({ id: s.id, label: s.name })),
        }))
        .filter((g) => g.items.length > 0);

    const accountGroups = channelsList
        .map((ch) => ({
            label: ch.name,
            items: accountsList
                .filter((a) => a.channel_id === ch.id)
                .map((a) => ({ id: a.id, label: a.name + (a.last_four ? ` ${a.last_four}` : "") })),
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
    };

    const handleAccountSelect = (accId: string) => {
        const acc = accountsList.find((a) => a.id === accId);
        setFormData({
            ...formData,
            account_id: accId,
            channel_id: acc?.channel_id || "",
        });
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
                toast("Transacción creada", "success");
                resetForm();
            },
            onError: (err) => {
                toast(getApiErrorMessage(err));
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
                border: `3px solid ${colors.fill}`,
            }}
        >
            {!expanded ? (
                <Button
                    variant="secondary"
                    fullWidth
                    iconLeft={<Plus size={16} />}
                    onClick={() => setExpanded(true)}
                >
                    Nueva Transacción
                </Button>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 12px",
                            borderBottom: `1px solid ${colors.fill}`,
                            backgroundColor: colors.bg.surface,
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: fonts.size.sm, color: colors.fg.base }}>
                            Nueva Transacción
                        </span>
                        <Button
                            type="button"
                            variant="plain"
                            onClick={handleClose}
                        >
                            <X size={16} />
                        </Button>
                    </div>

                    <div
                        style={{
                            padding: "6px 6px",
                            margin: "0 4px 4px",
                        }}
                    >
                        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                            <Button
                                type="button"
                                variant="tab"
                                color="red"
                                active={formData.type === "expense"}
                                onClick={() => toggleType("expense")}
                                style={{ flex: 1 }}
                            >
                                Egreso
                            </Button>
                            <Button
                                type="button"
                                variant="tab"
                                color="green"
                                active={formData.type === "income"}
                                onClick={() => toggleType("income")}
                                style={{ flex: 1 }}
                            >
                                Ingreso
                            </Button>
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
                            <div style={{ width: "70px", flexShrink: 0 }}>
                                <label style={labelStyle}>Moneda</label>
                                <Dropdown
                                    value={formData.currency}
                                    onChange={(id) => setFormData({ ...formData, currency: id as "ARS" | "USD" })}
                                    options={[
                                        { id: "ARS", label: "ARS" },
                                        { id: "USD", label: "USD" },
                                    ]}
                                    placeholder="-"
                                />
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
                                    <Button
                                        type="button"
                                        variant="icon"
                                        title="Actualizar TC"
                                        onClick={async () => {
                                            const banks = await economic.getDollarBanks(undefined, true);
                                            if (userConfig?.dollar_source && banks) {
                                                const bankValue = banks[userConfig.dollar_source];
                                                if (bankValue) {
                                                    setFormData((prev) => ({ ...prev, exchange_rate: bankValue.sell }));
                                                }
                                            }
                                        }}
                                        style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)" }}
                                    >
                                        <RefreshCw size={14} />
                                    </Button>
                                </div>
                            </div>
                            <div style={{ width: "95px", flexShrink: 0 }}>
                                <label style={labelStyle}>Frecuencia</label>
                                <Dropdown
                                    value={formData.frequency}
                                    onChange={(id) => setFormData({ ...formData, frequency: id as "variable" | "fixed" })}
                                    options={[
                                        { id: "variable", label: "Var" },
                                        { id: "fixed", label: "Fijo" },
                                    ]}
                                    placeholder="-"
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

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "6px",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <label style={labelStyle}>Categoría</label>
                                <Dropdown
                                    groups={categoryGroups}
                                    value={formData.subcategory_id || ""}
                                    onChange={handleCategorySelect}
                                    placeholder="-"
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <label style={labelStyle}>Método de Pago</label>
                                <Dropdown
                                    groups={accountGroups}
                                    value={formData.account_id || ""}
                                    onChange={handleAccountSelect}
                                    placeholder="-"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            padding: "6px 12px",
                            justifyContent: "flex-end",
                            backgroundColor: colors.bg.surface,
                        }}
                    >
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={createMutation.isPending}
                        >
                            Guardar
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
