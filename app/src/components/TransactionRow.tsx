import { useState, useEffect } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { Pencil, CreditCard, Trash2 } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { parseLocalDate, formatDateStr, getDateFormat } from "@/utils/date";
import { colors } from "@/styles/colors";
import { radius, spacing } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { Button } from "@/components/ui/Button";
import {
    useUpdateEntryPaid,
    useUserConfig,
} from "@/hooks";
import { Tooltip } from "@/components/ui/Tooltip";
import { TransactionRowEdit } from "./TransactionRowEdit";
import { formatNumber } from "@/utils/format";

interface TransactionRowProps {
    transaction: TransactionRowDTO;
    onDelete?: (transaction: TransactionRowDTO) => void;
    onCancelInstallments?: (transaction: TransactionRowDTO) => void;
    isEditing: boolean;
    onStartEdit: () => void;
    onFinishEdit: () => void;
    index: number;
}

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

const badgeStyle: React.CSSProperties = {
    fontSize: fonts.table.badge,
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: radius.md,
    textTransform: "uppercase",
    fontWeight: 500,
};

const currencyBadgeStyle = (currency: string): React.CSSProperties => ({
    ...badgeStyle,
    backgroundColor: currency === "ARS" ? `${colors.accent.cyan}26` : `${colors.accent.green}26`,
    color: currency === "ARS" ? colors.accent.cyan : colors.accent.green,
});

type DateTextFormat = "default" | "full";

const formatDateCell = (dateStr: string, textFormat: DateTextFormat, userFormat: import("@/utils/date").DateFormat) => {
    const date = parseLocalDate(dateStr);

    if (textFormat === "default") {
        return formatDateStr(dateStr, userFormat);
    }

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    const d = String(date.getDate()).padStart(2, "0");
    const m = monthNames[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
};

const getNextTextFormat = (current: DateTextFormat): DateTextFormat => {
    if (current === "default") return "full";
    return "default";
};

const STORAGE_KEY = "summit-date-text-format";

const getStoredTextFormat = (): DateTextFormat => {
    try {
        return (localStorage.getItem(STORAGE_KEY) as DateTextFormat) || "default";
    } catch {
        return "default";
    }
};

export function TransactionRow({
    transaction,
    onDelete,
    onCancelInstallments,
    isEditing,
    onStartEdit,
    onFinishEdit,
    index,
}: TransactionRowProps) {
    const zebraBg = index % 2 === 1 ? colors.bg.base : "transparent";
    const [textFormat, setTextFormat] = useState<DateTextFormat>(() => getStoredTextFormat());
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);
    const updatePaidMutation = useUpdateEntryPaid();

    const handleFormatClick = () => {
        const next = getNextTextFormat(textFormat);
        setTextFormat(next);
        localStorage.setItem(STORAGE_KEY, next);
        window.dispatchEvent(new Event("date-text-format-changed"));
    };

    useEffect(() => {
        const stored = getStoredTextFormat();
        if (stored !== textFormat) {
            setTextFormat(stored);
        }
    }, []);

    useEffect(() => {
        const handleFormatChange = () => {
            setTextFormat(getStoredTextFormat());
        };
        window.addEventListener("date-text-format-changed", handleFormatChange);
        return () => window.removeEventListener("date-text-format-changed", handleFormatChange);
    }, []);

    const handleDelete = () => onDelete?.(transaction);
    const handleEdit = () => onStartEdit();
    const handleCancel = () => onFinishEdit();

    const handleTogglePaid = () => {
        updatePaidMutation.mutate(
            { id: transaction.id, isPaid: !transaction.is_paid },
            {
                onSuccess: () => toast("Estado actualizado", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleCancelInstallments = () => {
        if (onCancelInstallments) {
            onCancelInstallments(transaction);
        }
    };

    const isExpense = transaction.type === "expense";
    const amount = parseFloat(transaction.amount);
    const alternateAmount =
        transaction.currency === "ARS"
            ? amount / transaction.exchange_rate
            : amount * transaction.exchange_rate;

    if (isEditing) {
        return (
            <TransactionRowEdit
                transaction={transaction}
                onSave={handleCancel}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <>
            <tr
                style={{ ...trStyle, backgroundColor: zebraBg }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bg.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = zebraBg)}
            >
                <td
                    style={{ ...tdStyle, ...fixedWidthStyle("110px"), cursor: "pointer" }}
                    onClick={handleFormatClick}
                    title="Cambiar formato"
                >
                    {formatDateCell(transaction.date, textFormat, userDateFormat)}
                </td>
                <td style={{ ...tdStyle, textAlign: "left", ...fixedWidthStyle("250px"), overflow: "hidden" }}>
                    <Tooltip content={transaction.description || "Sin descripción"}>
                        <span
                            style={{
                                fontWeight: 500,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {transaction.description || "Sin descripción"}
                        </span>
                    </Tooltip>
                    {transaction.total_installments && (
                        <div style={subStyle}>
                            {transaction.installment_number
                                ? `${transaction.installment_number}/${transaction.total_installments} Cuotas`
                                : "Cancelación de Cuotas"}
                        </div>
                    )}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("80px") }}>
                    <span
                        style={{
                            ...badgeStyle,
                            backgroundColor: isExpense
                                ? `${colors.accent.red}26`
                                : `${colors.accent.green}26`,
                            color: isExpense ? colors.accent.red : colors.accent.green,
                        }}
                    >
                        {transaction.type === "expense" ? "Egreso" : "Ingreso"}
                    </span>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("60px") }}>
                    {transaction.frequency === "fixed" ? (
                        <span
                            style={{
                                ...badgeStyle,
                                backgroundColor: `${colors.accent.teal}26`,
                                color: colors.accent.teal,
                            }}
                        >
                            Fijo
                        </span>
                    ) : transaction.frequency === "variable" ? (
                        <span
                            style={{
                                ...badgeStyle,
                                backgroundColor: `${colors.fg.dim}26`,
                                color: colors.fg.dim,
                            }}
                        >
                            Var
                        </span>
                    ) : (
                        <span style={{ color: colors.fg.dim }}>-</span>
                    )}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("120px"), overflow: "hidden" }}>
                    <Tooltip content={transaction.category_name || "-"}>
                        <span
                            style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {transaction.category_name || "-"}
                        </span>
                    </Tooltip>
                    {transaction.subcategory_name && (
                        <Tooltip content={transaction.subcategory_name}>
                            <div
                                style={{
                                    ...subStyle,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {transaction.subcategory_name}
                            </div>
                        </Tooltip>
                    )}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), overflow: "hidden" }}>
                    <Tooltip content={transaction.channel_name}>
                        <span
                            style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {transaction.channel_name}
                        </span>
                    </Tooltip>
                    {transaction.account_name && (
                        <Tooltip content={transaction.account_name}>
                            <div
                                style={{
                                    ...subStyle,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {transaction.account_name}
                            </div>
                        </Tooltip>
                    )}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("60px") }}>
                    <span style={currencyBadgeStyle(transaction.currency)}>
                        {transaction.currency}
                    </span>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("140px") }}>
                    <Tooltip content={`${transaction.currency} ${formatNumber(amount, { dynamic: true })}`}>
                        <span
                            style={{
                                fontFamily: fonts.family.display,
                                fontWeight: 500,
                                fontSize: fonts.table.amount,
                                color: colors.fg.base,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {transaction.currency} {formatNumber(amount, { dynamic: true })}
                        </span>
                    </Tooltip>
                    <Tooltip
                        content={`${transaction.currency === "ARS" ? "USD" : "ARS"} ${formatNumber(alternateAmount, { dynamic: true })}`}
                    >
                        <span
                            style={{
                                fontFamily: fonts.family.display,
                                fontSize: fonts.table.meta,
                                color: colors.fg.dim,
                                display: "block",
                                opacity: 0.7,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {transaction.currency === "ARS" ? "USD" : "ARS"}{" "}
                            {formatNumber(alternateAmount, { dynamic: true })}
                        </span>
                    </Tooltip>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("70px") }}>
                    <Tooltip
                        content={
                            transaction.exchange_rate % 1 === 0
                                ? String(transaction.exchange_rate)
                                : transaction.exchange_rate.toFixed(2)
                        }
                    >
                        <span
                            style={{
                                fontFamily: fonts.family.display,
                                fontSize: fonts.table.meta,
                                color: colors.fg.dim,
                                opacity: 0.7,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {transaction.exchange_rate % 1 === 0
                                ? transaction.exchange_rate.toString()
                                : transaction.exchange_rate.toFixed(2)}
                        </span>
                    </Tooltip>
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
                        {transaction.installment_group_id && !transaction.is_canceled && (
                            <Button variant="icon" title="Cancelar cuotas" onClick={handleCancelInstallments}>
                                <CreditCard size={14} />
                            </Button>
                        )}
                        <Button variant="icon" title="Editar" onClick={handleEdit}>
                            <Pencil size={14} />
                        </Button>
                        <Button variant="icon" title="Eliminar" onClick={handleDelete}>
                            <Trash2 size={14} />
                        </Button>
                    </span>
                </td>
            </tr>
        </>
    );
}
