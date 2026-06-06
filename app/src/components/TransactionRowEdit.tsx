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
import {
    useUpdateTransaction,
    useUpdateEntryPaid,
    useCategories,
    useSubcategories,
    useChannels,
    useAccounts,
    useUserConfig,
    useCategoryGroups,
    useAccountGroups,
} from "@/hooks";
import { economic } from "@/api_client";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown } from "@/components/ui/Dropdown";

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

const EDIT_ROW_FONT_SIZE = fonts.size.sm2;

const triggerStyle: React.CSSProperties = {
    height: "26px",
    fontSize: EDIT_ROW_FONT_SIZE,
    fontWeight: fonts.weight.medium,
    backgroundColor: colors.bg.elevated,
    border: "none",
    padding: 0,
};

const baseInput: React.CSSProperties = {
    width: "100%",
    height: "26px",
    padding: 0,
    backgroundColor: "transparent",
    border: "none",
    color: colors.fg.base,
    fontSize: EDIT_ROW_FONT_SIZE,
    fontWeight: fonts.weight.medium,
    textAlign: "center",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    MozAppearance: "textfield",
};

const toggleBase: React.CSSProperties = {
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
    lineHeight: 1,
    borderRadius: radius.md,
    padding: "0 10px",
    height: "26px",
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
    transition: "filter 0.15s",
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
        String(transaction.total_installments ?? 0)
    );
    const [exchangeRateInput, setExchangeRateInput] = useState<string>(
        formatForInput(String(transaction.exchange_rate))
    );
    const { data: userConfig } = useUserConfig();
    const updateMutation = useUpdateTransaction();
    const updatePaidMutation = useUpdateEntryPaid();
    const isSavingRef = useRef(false);
    const descRef = useRef<HTMLInputElement>(null);

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
        installment_number: transaction.total_installments ?? 0,
        amount: formatForInput(transaction.original_amount ?? transaction.amount),
        currency: transaction.currency,
        exchange_rate: transaction.exchange_rate,
        category_id: transaction.category_id || "",
        subcategory_id: transaction.subcategory_id || "",
        channel_id: transaction.channel_id || "",
        account_id: transaction.account_id || "",
        is_paid: transaction.is_paid,
    });

    useEffect(() => {
        const startDate =
            transaction.installment_group_id && transaction.installment_start_date
                ? transaction.installment_start_date
                : transaction.date;
        const installments = transaction.total_installments ?? 0;
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
            is_paid: transaction.is_paid,
        });
        setInstallmentInput(String(installments));
        setExchangeRateInput(formatForInput(String(transaction.exchange_rate)));
    }, [transaction]);

    useEffect(() => {
        descRef.current?.focus();
    }, []);

    const originalData: TransactionAggregateReq = {
        description: transaction.description || "",
        date: dateValue,
        type: transaction.type,
        frequency: transaction.frequency ?? "variable",
        installment_number: transaction.total_installments ?? 0,
        amount: transaction.original_amount ?? transaction.amount,
        currency: transaction.currency,
        exchange_rate: transaction.exchange_rate,
        category_id: transaction.category_id || "",
        subcategory_id: transaction.subcategory_id || "",
        channel_id: transaction.channel_id || "",
        account_id: transaction.account_id || "",
        is_paid: transaction.is_paid,
    };

    const hasChanges =
        formData.description !== originalData.description ||
        formData.date !== originalData.date ||
        formData.type !== originalData.type ||
        formData.frequency !== originalData.frequency ||
        formData.installment_number !== originalData.installment_number ||
        parseLocaleNumber(formData.amount) !== parseLocaleNumber(originalData.amount) ||
        formData.currency !== originalData.currency ||
        (parseLocaleNumber(exchangeRateInput) || 0) !== (originalData.exchange_rate ?? 0) ||
        formData.category_id !== originalData.category_id ||
        formData.subcategory_id !== originalData.subcategory_id ||
        formData.channel_id !== originalData.channel_id ||
        formData.account_id !== originalData.account_id ||
        formData.is_paid !== originalData.is_paid;

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
        const { is_paid, ...aggregateFields } = formData;
        const dataToSend = {
            ...aggregateFields,
            amount: String(parseLocaleNumber(formData.amount)),
            exchange_rate: isNaN(parseLocaleNumber(exchangeRateInput)) ? 1 : parseLocaleNumber(exchangeRateInput),
        };
        updateMutation.mutate(
            { id: transaction.id, data: dataToSend },
            {
                onSuccess: () => {
                    const paidChanged = is_paid !== originalData.is_paid;
                    if (paidChanged) {
                        updatePaidMutation.mutate(
                            { id: transaction.id, isPaid: is_paid ?? false },
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
                    } else {
                        toast("Transacción actualizada", "success");
                        onSave?.();
                    }
                },
                onError: (err) => {
                    isSavingRef.current = false;
                    toast(getApiErrorMessage(err));
                },
            }
        );
    };

    const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
    keyHandlerRef.current = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (hasChanges && !updateMutation.isPending) handleSave();
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel?.();
        }
    };
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <>
            <div
                style={{
                    ...tdStyle,
                    width: "36px",
                    minWidth: "36px",
                    maxWidth: "36px",
                }}
            />
            <div style={{ ...tdStyle }}>
                <DatePicker
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    triggerStyle={{ ...triggerStyle, textAlign: "left" }}
                    showIcon={false}
                />
            </div>
            <div style={{ ...tdStyle }}>
                <span
                    onClick={() =>
                        setFormData({
                            ...formData,
                            type: formData.type === "expense" ? "income" : "expense",
                        })
                    }
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    style={{
                        ...toggleBase,
                        color: formData.type === "expense" ? colors.accent.red : colors.accent.green,
                    }}
                >
                    {formData.type === "expense" ? "▼ EGR" : "▲ ING"}
                </span>
            </div>
            <div style={{ ...tdStyle, textAlign: "left", overflow: "hidden" }}>
                <input
                    ref={descRef}
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción"
                    style={{ ...baseInput, textAlign: "left" }}
                    required
                />
            </div>
            <div style={{ ...tdStyle }}>
                <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={installmentInput}
                    onChange={(e) => {
                        const val = e.target.value;
                        setInstallmentInput(val);
                        if (val !== "") {
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 0) {
                                setFormData({ ...formData, installment_number: num });
                            }
                        }
                    }}
                    onBlur={() => {
                        if (installmentInput === "" || parseInt(installmentInput, 10) < 0) {
                            setInstallmentInput("0");
                            setFormData({ ...formData, installment_number: 0 });
                        }
                    }}
                    style={{ ...baseInput, fontSize: fonts.size.xs2 }}
                />
            </div>
            <div style={{ ...tdStyle, overflow: "hidden" }}>
                <input
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{ ...baseInput, textAlign: "right" }}
                    required
                />
            </div>
            <div style={{ ...tdStyle }}>
                <span
                    onClick={() =>
                        setFormData({
                            ...formData,
                            currency: formData.currency === "ARS" ? "USD" : "ARS",
                        })
                    }
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    style={{
                        ...toggleBase,
                        color: formData.currency === "ARS" ? colors.accent.cyan : colors.accent.green,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {formData.currency}
                </span>
            </div>
            <div style={{ ...tdStyle, overflow: "hidden", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing[1], width: "100%", height: "100%" }}>
                    <button
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            borderRadius: radius.sm,
                            border: "none",
                            backgroundColor: "transparent",
                            color: colors.fg.dim,
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.fg.base; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.fg.dim; }}
                    >
                        <RefreshCw size={11} strokeWidth={2.5} />
                    </button>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={exchangeRateInput}
                        onChange={(e) => setExchangeRateInput(e.target.value)}
                        style={{ ...baseInput, fontSize: fonts.size.xs2, textAlign: "right", flex: 1 }}
                    />
                </div>
            </div>
            <div style={{ ...tdStyle }}>
                <span
                    onClick={() =>
                        setFormData({
                            ...formData,
                            frequency: formData.frequency === "fixed" ? "variable" : "fixed",
                        })
                    }
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    style={{
                        ...toggleBase,
                        color: formData.frequency === "fixed" ? colors.accent.blue : colors.accent.purple,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {formData.frequency === "fixed" ? "FIJO" : "VAR"}
                </span>
            </div>
            <div style={{ ...tdStyle, textAlign: "left", overflow: "hidden" }}>
                <Dropdown
                    groups={categoryGroups}
                    value={formData.subcategory_id}
                    onChange={handleCategorySelect}
                    placeholder="-"
                    searchable
                    triggerStyle={triggerStyle}
                />
            </div>
            <div style={{ ...tdStyle, textAlign: "left", overflow: "hidden" }}>
                <Dropdown
                    groups={accountGroups}
                    value={formData.account_id}
                    onChange={handleAccountSelect}
                    placeholder="-"
                    searchable
                    triggerStyle={triggerStyle}
                />
            </div>
            <div style={{ ...tdStyle }}>
                <span
                    onClick={() =>
                        setFormData({ ...formData, is_paid: !formData.is_paid })
                    }
                    style={{
                        cursor: "pointer",
                        lineHeight: 0,
                        transition: "opacity 0.12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                    {formData.is_paid ? (
                        <SquareCheck size={15} strokeWidth={2.5} color={colors.accent.teal} />
                    ) : (
                        <SquareMinus size={15} strokeWidth={2.5} color={colors.accent.orange} />
                    )}
                </span>
            </div>
            <div style={{ ...tdStyle }}>
                <span style={{ display: "flex", gap: spacing[1], justifyContent: "center" }}>
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || !hasChanges}
                        title="Guardar (Enter)"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 26,
                            padding: 0,
                            border: "none",
                            borderRadius: radius.md,
                            backgroundColor: "transparent",
                            color: colors.accent.teal,
                            cursor: hasChanges && !updateMutation.isPending ? "pointer" : "default",
                            opacity: updateMutation.isPending || !hasChanges ? 0.4 : 1,
                            transition: "filter 0.12s",
                        }}
                        onMouseEnter={(e) => { if (hasChanges && !updateMutation.isPending) e.currentTarget.style.filter = "brightness(1.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    >
                        {updateMutation.isPending
                            ? <span style={{ fontSize: "10px" }}>...</span>
                            : <Check size={14} strokeWidth={2.5} />}
                    </button>
                    <button
                        onClick={onCancel}
                        title="Cancelar (Esc)"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 26,
                            padding: 0,
                            border: "none",
                            borderRadius: radius.md,
                            backgroundColor: "transparent",
                            color: colors.accent.red,
                            cursor: "pointer",
                            transition: "filter 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </span>
            </div>
        </>
    );
}

export function TransactionRowEdit({ transaction, onSave, onCancel }: TransactionRowEditProps) {
    return (
        <tr style={{ backgroundColor: colors.bg.elevated }}>
            <TransactionRowEditCells
                transaction={transaction}
                onSave={onSave}
                onCancel={onCancel}
            />
        </tr>
    );
}
