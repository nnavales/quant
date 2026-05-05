import { useState, useEffect } from "react";
import type { TransactionRowDTO } from "@/api_client";
import type { TransactionAggregateReq } from "@/api_client/types";
import { Check, X, RefreshCw } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";

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
    padding: `${spacing[1]} ${spacing[3]}`,
    verticalAlign: "middle",
    textAlign: "center",
    border: `1px solid ${colors.fill}`,
};

const fixedWidthStyle = (width: string): React.CSSProperties => ({
    width,
    minWidth: width,
    maxWidth: width,
});

const subStyle: React.CSSProperties = { fontSize: fonts.table.meta, color: colors.fg.dim };

const EDIT_ROW_FONT_SIZE = fonts.size.sm;

const formInputStyle: React.CSSProperties = {
    width: "100%",
    height: "28px",
    padding: "4px 6px",
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border}`,
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

export function TransactionRowEdit({ transaction, onSave, onCancel }: TransactionRowEditProps) {
    const [installmentInput, setInstallmentInput] = useState<string>(String(transaction.total_installments ?? 1));
    const { data: userConfig } = useUserConfig();
    const updateMutation = useUpdateTransaction();
    const updatePaidMutation = useUpdateEntryPaid();

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
        type: transaction.type as "expense" | "income",
        frequency: transaction.frequency as "fixed" | "variable",
        installment_number: transaction.total_installments ?? 1,
        amount: transaction.original_amount ?? transaction.amount,
        currency: transaction.currency as "ARS" | "USD",
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
            type: transaction.type as "expense" | "income",
            frequency: transaction.frequency as "fixed" | "variable",
            installment_number: installments,
            amount: transaction.original_amount ?? transaction.amount,
            currency: transaction.currency as "ARS" | "USD",
            exchange_rate: transaction.exchange_rate,
            category_id: transaction.category_id || "",
            subcategory_id: transaction.subcategory_id || "",
            channel_id: transaction.channel_id || "",
            account_id: transaction.account_id || "",
        });
        setInstallmentInput(String(installments));
    }, [transaction]);

    const { groups: categoryGroups, getCategoryId } = useCategoryGroups(categoriesList, subcategoriesList);
    const { groups: accountGroups, getChannelId } = useAccountGroups(channelsList, accountsList);

    const handleCategorySelect = (subId: string) => {
        setFormData({ ...formData, subcategory_id: subId, category_id: getCategoryId(subId) });
    };

    const handleAccountSelect = (accId: string) => {
        setFormData({ ...formData, account_id: accId, channel_id: getChannelId(accId) });
    };

    const handleSave = () => {
        updateMutation.mutate(
            { id: transaction.id, data: formData },
            {
                onSuccess: () => {
                    toast("Transacción actualizada", "success");
                    onSave?.();
                },
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleTogglePaid = () => {
        updatePaidMutation.mutate(
            { id: transaction.id, isPaid: !transaction.is_paid },
            {
                onSuccess: () => toast("Estado actualizado", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
    };

    return (
        <tr style={{ ...trStyle, backgroundColor: colors.bg.surface }}>
            <td style={{ ...tdStyle, ...fixedWidthStyle("110px") }}>
                <DatePicker
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    triggerStyle={{ height: "28px" }}
                />
            </td>
            <td style={{ ...tdStyle, textAlign: "left", ...fixedWidthStyle("250px") }}>
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción"
                    style={{ ...formInputStyle, textAlign: "left" }}
                    required
                />
                <div
                    style={{
                        ...subStyle,
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
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
                        style={{
                            ...formInputStyle,
                            fontSize: EDIT_ROW_FONT_SIZE,
                            width: "50px",
                            height: "20px",
                            padding: "2px 4px",
                        }}
                    />
                    <span style={{ fontSize: EDIT_ROW_FONT_SIZE, color: colors.fg.dim }}>cuotas</span>
                </div>
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("80px") }}>
                <Dropdown
                    options={[
                        { id: "expense", label: "Egreso" },
                        { id: "income", label: "Ingreso" },
                    ]}
                    value={formData.type}
                    onChange={(t) => setFormData({ ...formData, type: t as "expense" | "income" })}
                    triggerStyle={{ height: "28px", fontSize: EDIT_ROW_FONT_SIZE, width: "100%" }}
                />
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("60px") }}>
                <Dropdown
                    options={[
                        { id: "fixed", label: "Fijo" },
                        { id: "variable", label: "Var" },
                    ]}
                    value={formData.frequency}
                    onChange={(f) => setFormData({ ...formData, frequency: f as "fixed" | "variable" })}
                    triggerStyle={{ height: "28px", fontSize: EDIT_ROW_FONT_SIZE, width: "100%" }}
                />
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("120px") }}>
                <Dropdown
                    groups={categoryGroups}
                    value={formData.subcategory_id}
                    onChange={handleCategorySelect}
                    placeholder="-"
                    searchable
                    triggerStyle={{ height: "28px", fontSize: EDIT_ROW_FONT_SIZE }}
                />
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("100px") }}>
                <Dropdown
                    groups={accountGroups}
                    value={formData.account_id}
                    onChange={handleAccountSelect}
                    placeholder="-"
                    searchable
                    triggerStyle={{ height: "28px", fontSize: EDIT_ROW_FONT_SIZE }}
                />
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("60px") }}>
                <Dropdown
                    options={[
                        { id: "ARS", label: "ARS" },
                        { id: "USD", label: "USD" },
                    ]}
                    value={formData.currency}
                    onChange={(c) => setFormData({ ...formData, currency: c as "ARS" | "USD" })}
                    triggerStyle={{ height: "28px", fontSize: EDIT_ROW_FONT_SIZE, width: "100%", justifyContent: "center" }}
                />
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("140px") }}>
                <input
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => {
                        setFormData({ ...formData, amount: e.target.value });
                    }}
                    style={{
                        ...formInputStyle,
                        fontFamily: fonts.family.display,
                        fontWeight: 600,
                    }}
                    required
                />
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("70px") }}>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={formData.exchange_rate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                exchange_rate: parseFloat(e.target.value) || 1,
                            })
                        }
                        style={{
                            ...formInputStyle,
                            fontFamily: fonts.family.display,
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
                                    setFormData((prev) => ({
                                        ...prev,
                                        exchange_rate: bankValue.sell,
                                    }));
                                    return;
                                }
                            } catch {
                                // fall through to default
                            }
                            const fallback = userConfig?.default_rate ? parseFloat(userConfig.default_rate) : 0;
                            if (fallback > 0) {
                                setFormData((prev) => ({
                                    ...prev,
                                    exchange_rate: fallback,
                                }));
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
            </td>
            <td style={{ ...tdStyle, ...fixedWidthStyle("90px") }}>
                <Button
                    variant="badge"
                    active={transaction.is_paid}
                    onClick={handleTogglePaid}
                    title={transaction.is_paid ? "Marcar como pendiente" : `Marcar como ${transaction.type === "income" ? "recibido" : "pagado"}`}
                >
                    {transaction.is_paid ? (transaction.type === "income" ? "Recibido" : "Pagado") : "Pendiente"}
                </Button>
            </td>
            <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap", ...fixedWidthStyle("110px") }}>
                <span style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
                    <Button variant="icon" onClick={handleSave} disabled={updateMutation.isPending} title="Guardar">
                        {updateMutation.isPending ? "..." : <Check size={14} />}
                    </Button>
                    <Button variant="icon" onClick={onCancel} title="Cancelar">
                        <X size={14} />
                    </Button>
                </span>
            </td>
        </tr>
    );
}
