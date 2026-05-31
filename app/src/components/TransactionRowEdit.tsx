import { useState, useEffect, useRef } from "react";
import type { TransactionRowDTO } from "@/api_client";
import type { TransactionAggregateReq } from "@/api_client/types";
import { Check, X, RefreshCw, SquareCheck, SquareMinus } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { formatForInput, parseLocaleNumber } from "@/utils/format";

import { colors } from "@/styles/colors";
import { radius, spacing } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { Button } from "@/components/ui/Button";
import {
    useUpdateTransaction,
    useCategories,
    useSubcategories,
    useChannels,
    useAccounts,
    useUserConfig,
    useUpdateEntryPaid,
    useCategoryGroups,
    useAccountGroups,
} from "@/hooks";
import { economic } from "@/api_client";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown } from "@/components/ui/Dropdown";
const trStyle: React.CSSProperties = {
    transition: "background-color 0.15s",
};

const tdStyle: React.CSSProperties = {
    padding: `0 ${spacing[2]}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: `1px solid ${colors.border}`,
    borderLeft: `1px solid ${colors.border}`,
    minWidth: 0,
    overflow: "hidden",
};

// Widths now come from the parent CSS grid template; keep call sites but no-op.
const fixedWidthStyle = (_width: string): React.CSSProperties => ({});

const EDIT_ROW_FONT_SIZE = fonts.size.sm2;

const triggerStyle: React.CSSProperties = {
    height: "24px",
    fontSize: EDIT_ROW_FONT_SIZE,
    backgroundColor: colors.bg.elevated,
    border: "none",
};

const formInputStyle: React.CSSProperties = {
    width: "100%",
    height: "24px",
    padding: "4px 6px",
    backgroundColor: colors.bg.elevated,
    border: "none",
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: EDIT_ROW_FONT_SIZE,
    textAlign: "center",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    MozAppearance: "textfield",
};

interface TransactionRowEditProps {
    transaction: TransactionRowDTO;
    onSave?: () => void;
    onCancel?: () => void;
}

interface TransactionRowEditCellsProps {
    transaction: TransactionRowDTO;
    onSave?: () => void;
    onCancel?: () => void;
}

export function TransactionRowEditCells({
    transaction,
    onSave,
    onCancel,
}: TransactionRowEditCellsProps) {
    const [installmentInput, setInstallmentInput] = useState<string>(
        String(transaction.total_installments ?? 1)
    );
    const [exchangeRateInput, setExchangeRateInput] = useState<string>(
        formatForInput(String(transaction.exchange_rate))
    );
    const { data: userConfig } = useUserConfig();
    const updateMutation = useUpdateTransaction();
    const updatePaidMutation = useUpdateEntryPaid();
    const isSavingRef = useRef(false);

    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const dateValue =
        transaction.installment_group_id && transaction.installment_start_date
            ? transaction.installment_start_date
            : transaction.date;

    const [formData, setFormData] = useState<TransactionAggregateReq>({
        description: transaction.description || "",
        date: dateValue,
        type: transaction.type,
        frequency: transaction.frequency ?? "variable",
        installment_number: transaction.total_installments ?? 1,
        amount: formatForInput(transaction.original_amount ?? transaction.amount),
        currency: transaction.currency,
        exchange_rate: transaction.exchange_rate,
        category_id: transaction.category_id || "",
        subcategory_id: transaction.subcategory_id || "",
        channel_id: transaction.channel_id || "",
        account_id: transaction.account_id || "",
    });

    useEffect(() => {
        const startDate =
            transaction.installment_group_id && transaction.installment_start_date
                ? transaction.installment_start_date
                : transaction.date;
        const installments = transaction.total_installments ?? 1;
        setFormData({
            description: transaction.description || "",
            date: startDate,
            type: transaction.type,
            frequency: transaction.frequency ?? "variable",
            installment_number: installments,
            amount: formatForInput(transaction.original_amount ?? transaction.amount),
            currency: transaction.currency,
            exchange_rate: transaction.exchange_rate,
            category_id: transaction.category_id || "",
            subcategory_id: transaction.subcategory_id || "",
            channel_id: transaction.channel_id || "",
            account_id: transaction.account_id || "",
        });
        setInstallmentInput(String(installments));
        setExchangeRateInput(formatForInput(String(transaction.exchange_rate)));
    }, [transaction]);

    const originalData: TransactionAggregateReq = {
        description: transaction.description || "",
        date: dateValue,
        type: transaction.type,
        frequency: transaction.frequency ?? "variable",
        installment_number: transaction.total_installments ?? 1,
        amount: transaction.original_amount ?? transaction.amount,
        currency: transaction.currency,
        exchange_rate: transaction.exchange_rate,
        category_id: transaction.category_id || "",
        subcategory_id: transaction.subcategory_id || "",
        channel_id: transaction.channel_id || "",
        account_id: transaction.account_id || "",
    };

    const hasChanges =
        formData.description !== originalData.description ||
        formData.date !== originalData.date ||
        formData.type !== originalData.type ||
        formData.frequency !== originalData.frequency ||
        formData.installment_number !== originalData.installment_number ||
        parseLocaleNumber(formData.amount) !== parseLocaleNumber(originalData.amount) ||
        formData.currency !== originalData.currency ||
        (parseLocaleNumber(exchangeRateInput) || 1) !== (originalData.exchange_rate ?? 0) ||
        formData.category_id !== originalData.category_id ||
        formData.subcategory_id !== originalData.subcategory_id ||
        formData.channel_id !== originalData.channel_id ||
        formData.account_id !== originalData.account_id;

    const { groups: categoryGroups, getCategoryId } = useCategoryGroups(
        categoriesList,
        subcategoriesList
    );
    const { groups: accountGroups, getChannelId } = useAccountGroups(channelsList, accountsList);

    const handleCategorySelect = (subId: string) => {
        setFormData({ ...formData, subcategory_id: subId, category_id: getCategoryId(subId) });
    };

    const handleAccountSelect = (accId: string) => {
        setFormData({ ...formData, account_id: accId, channel_id: getChannelId(accId) });
    };

    const handleSave = () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        const dataToSend = {
            ...formData,
            amount: String(parseLocaleNumber(formData.amount)),
            exchange_rate: parseLocaleNumber(exchangeRateInput) || 1,
        };
        updateMutation.mutate(
            { id: transaction.id, data: dataToSend },
            {
                onSuccess: () => {
                    toast("Transacción actualizada", "success");
                    onSave?.();
                },
                onError: (err) => {
                    isSavingRef.current = false;
                    toast(getApiErrorMessage(err));
                },
            }
        );
    };

    const handleTogglePaid = (newPaid: boolean) => {
        updatePaidMutation.mutate(
            { id: transaction.id, isPaid: newPaid },
            {
                onSuccess: () => toast("Estado actualizado", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
    };

    return (
        <>
            {/* Checkbox placeholder */}
            <div
                style={{
                    ...tdStyle,
                    width: "36px",
                    minWidth: "36px",
                    maxWidth: "36px",
                    borderLeft: `3px solid ${colors.accent.cyan}`,
                    boxShadow: "none",
                }}
            />
            {/* Fecha */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("7%") }}>
                <DatePicker
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    triggerStyle={{ ...triggerStyle, textAlign: "left" }}
                    showIcon={false}
                />
            </div>
            {/* Tipo */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("5%") }}>
                <span
                    onClick={() =>
                        setFormData({
                            ...formData,
                            type: formData.type === "expense" ? "income" : "expense",
                        })
                    }
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.6";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                    }}
                    style={{
                        fontSize: fonts.size.xs,
                        fontWeight: fonts.weight.medium,
                        lineHeight: 1,
                        color: colors.fg.base,
                        backgroundColor: colors.bg.elevated,
                        borderRadius: radius.md,
                        padding: "0 10px",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "opacity 0.12s",
                    }}
                >
                    {formData.type === "expense" ? "▼ EGR" : "▲ ING"}
                </span>
            </div>
            {/* Descripción */}
            <div
                style={{
                    ...tdStyle,
                    textAlign: "left",
                    ...fixedWidthStyle("17%"),
                    overflow: "hidden",
                }}
            >
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción"
                    style={{ ...formInputStyle, textAlign: "left", width: "100%" }}
                    required
                />
            </div>
            {/* Cuotas */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("4%") }}>
                <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={installmentInput}
                    onChange={(e) => {
                        const val = e.target.value;
                        setInstallmentInput(val);
                        if (val !== "") {
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 1) {
                                setFormData({ ...formData, installment_number: num });
                            }
                        }
                    }}
                    onBlur={() => {
                        if (installmentInput === "" || parseInt(installmentInput, 10) < 1) {
                            setInstallmentInput("1");
                            setFormData({ ...formData, installment_number: 1 });
                        }
                    }}
                    style={{ ...formInputStyle, fontSize: fonts.size.xs2, width: "100%" }}
                />
            </div>
            {/* Monto */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("9%"), overflow: "hidden" }}>
                <input
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{ ...formInputStyle, textAlign: "right", width: "100%" }}
                    required
                />
            </div>
            {/* Moneda */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("4%") }}>
                <span
                    onClick={() =>
                        setFormData({
                            ...formData,
                            currency: formData.currency === "ARS" ? "USD" : "ARS",
                        })
                    }
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                    }}
                    style={{
                        fontSize: fonts.size.xs,
                        fontWeight: fonts.weight.medium,
                        color: colors.fg.base,
                        backgroundColor: colors.bg.elevated,
                        borderRadius: radius.md,
                        padding: "0 10px",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "opacity 0.12s",
                    }}
                >
                    {formData.currency}
                </span>
            </div>
            {/* TC */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("5%"), overflow: "hidden" }}>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={exchangeRateInput}
                        onChange={(e) => setExchangeRateInput(e.target.value)}
                        style={{
                            ...formInputStyle,
                            fontSize: fonts.size.xs2,
                            paddingRight: "28px",
                        }}
                    />
                    <Button
                        variant="icon"
                        type="button"
                        onClick={async () => {
                            if (!userConfig?.dollar_source) return;
                            try {
                                const banks = await economic.getDollarBanks(undefined, true);
                                const bankValue = banks?.[userConfig.dollar_source];
                                if (bankValue) {
                                    setExchangeRateInput(String(bankValue.sell));
                                    return;
                                }
                            } catch {
                                // fall through to default
                            }
                            const fallback = userConfig?.default_rate
                                ? parseFloat(userConfig.default_rate)
                                : 0;
                            if (fallback > 0) {
                                setExchangeRateInput(String(fallback));
                                toast("TC por defecto (sin conexión)", "warning");
                            }
                        }}
                        title="Actualizar TC"
                        style={{
                            position: "absolute",
                            right: "4px",
                            top: "50%",
                            transform: "translateY(-50%)",
                        }}
                    >
                        <RefreshCw size={12} />
                    </Button>
                </div>
            </div>
            {/* Frecuencia */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("4%") }}>
                <span
                    onClick={() =>
                        setFormData({
                            ...formData,
                            frequency: formData.frequency === "fixed" ? "variable" : "fixed",
                        })
                    }
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                    }}
                    style={{
                        fontSize: fonts.size.xs,
                        fontWeight: fonts.weight.medium,
                        color: colors.fg.base,
                        backgroundColor: colors.bg.elevated,
                        borderRadius: radius.md,
                        padding: "0 10px",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "opacity 0.12s",
                    }}
                >
                    {formData.frequency === "fixed" ? "FIJO" : "VAR"}
                </span>
            </div>
            {/* Categoría */}
            <div
                style={{
                    ...tdStyle,
                    textAlign: "left",
                    ...fixedWidthStyle("17%"),
                    overflow: "hidden",
                }}
            >
                <Dropdown
                    groups={categoryGroups}
                    value={formData.subcategory_id}
                    onChange={handleCategorySelect}
                    placeholder="-"
                    searchable
                    triggerStyle={triggerStyle}
                />
            </div>
            {/* Canal */}
            <div
                style={{
                    ...tdStyle,
                    textAlign: "left",
                    ...fixedWidthStyle("17%"),
                    overflow: "hidden",
                }}
            >
                <Dropdown
                    groups={accountGroups}
                    value={formData.account_id}
                    onChange={handleAccountSelect}
                    placeholder="-"
                    searchable
                    triggerStyle={triggerStyle}
                />
            </div>
            {/* Estado */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("3%") }}>
                <span
                    onClick={() => handleTogglePaid(!transaction.is_paid)}
                    style={{
                        cursor: "pointer",
                        lineHeight: 0,
                        opacity: 1,
                        transition: "opacity 0.12s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.6";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                    }}
                >
                    {transaction.is_paid ? (
                        <SquareCheck size={15} color={colors.fg.base} />
                    ) : (
                        <SquareMinus size={15} color={colors.fg.base} />
                    )}
                </span>
            </div>
            {/* Acciones */}
            <div style={{ ...tdStyle, ...fixedWidthStyle("8%") }}>
                <span style={{ display: "flex", gap: spacing[2], justifyContent: "center" }}>
                    <Button
                        variant="icon"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || !hasChanges}
                        title="Guardar"
                    >
                        {updateMutation.isPending ? "..." : <Check size={14} />}
                    </Button>
                    <Button variant="icon" onClick={onCancel} title="Cancelar">
                        <X size={14} />
                    </Button>
                </span>
            </div>
        </>
    );
}

export function TransactionRowEdit({ transaction, onSave, onCancel }: TransactionRowEditProps) {
    return (
        <tr style={{ ...trStyle, backgroundColor: colors.bg.surface }}>
            <TransactionRowEditCells
                transaction={transaction}
                onSave={onSave}
                onCancel={onCancel}
            />
        </tr>
    );
}
