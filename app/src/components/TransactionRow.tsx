import { memo } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { Pencil, CreditCard, Trash2, Check } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { parseLocalDate, formatDateStr } from "@/utils/date";
import { colors } from "@/styles/colors";
import { spacing } from "@/styles/theme";
import { Button } from "@/components/ui/Button";
import {
    useUpdateEntryPaid,
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
    isSelected?: boolean;
    onToggleSelect?: (shiftKey: boolean) => void;
    userDateFormat: import("@/utils/date").DateFormat;
    textFormat: "default" | "full";
    onFormatClick: () => void;
}

interface TransactionRowCellsProps {
    transaction: TransactionRowDTO;
    onDelete?: (transaction: TransactionRowDTO) => void;
    onCancelInstallments?: (transaction: TransactionRowDTO) => void;
    onStartEdit?: () => void;
    isSelected?: boolean;
    onToggleSelect?: (shiftKey: boolean) => void;
    userDateFormat: import("@/utils/date").DateFormat;
    textFormat: "default" | "full";
    onFormatClick: () => void;
}

const SEL_STYLE: React.CSSProperties = { backgroundColor: colors.bg.selected };
const selBg = (sel: boolean) => sel ? SEL_STYLE : undefined;

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

export const TransactionRowCells = memo(function TransactionRowCells({
    transaction,
    onDelete,
    onCancelInstallments,
    onStartEdit,
    isSelected = false,
    onToggleSelect,
    userDateFormat,
    textFormat,
    onFormatClick,
}: TransactionRowCellsProps) {
    const updatePaidMutation = useUpdateEntryPaid();

    const handleDelete = () => onDelete?.(transaction);
    const handleEdit = () => onStartEdit?.();
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

    return (
        <>
            <td className="td-checkbox td-center" style={selBg(isSelected)}>
                <div className="checkbox-center">
                    <div
                        onClick={(e) => onToggleSelect?.(e.shiftKey)}
                        style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "4px",
                            border: `1.5px solid ${isSelected ? colors.fg.base : colors.border}`,
                            backgroundColor: isSelected ? colors.fg.base : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "background-color .12s,border-color .12s",
                        }}
                    >
                        {isSelected && <Check size={10} color={colors.bg.base} strokeWidth={3} />}
                    </div>
                </div>
            </td>
            <td
                className="td-fecha td-left"
                style={selBg(isSelected)}
                onClick={onFormatClick}
                title="Cambiar formato"
            >
                <span className="selectable">{formatDateCell(transaction.date, textFormat, userDateFormat)}</span>
            </td>
            <td className="td-desc td-left" style={selBg(isSelected)}>
                <Tooltip content={transaction.description || "Sin descripción"}>
                    <span className="selectable text-trunc" style={{ fontWeight: 500 }}>
                        {transaction.description || "Sin descripción"}
                    </span>
                </Tooltip>
                {transaction.total_installments && (
                    <div className="text-sub">
                        {transaction.installment_number
                            ? `${transaction.installment_number}/${transaction.total_installments} Cuotas`
                            : "Cancelación de Cuotas"}
                    </div>
                )}
            </td>
            <td className="td-tipo" style={selBg(isSelected)}>
                <span
                    className="selectable badge"
                    style={{
                        backgroundColor: colors.fill,
                        color: isExpense ? colors.accent.red : colors.accent.green,
                    }}
                >
                    {transaction.type === "expense" ? "Egreso" : "Ingreso"}
                </span>
            </td>
            <td className="td-cat td-left" style={selBg(isSelected)}>
                <Tooltip content={transaction.category_name || "-"}>
                    <span className="selectable text-trunc">
                        {transaction.category_name || "-"}
                    </span>
                </Tooltip>
                {transaction.subcategory_name && (
                    <Tooltip content={transaction.subcategory_name}>
                        <div className="selectable text-sub text-trunc">
                            {transaction.subcategory_name}
                        </div>
                    </Tooltip>
                )}
            </td>
            <td className="td-canal td-left" style={selBg(isSelected)}>
                <Tooltip content={transaction.channel_name}>
                    <span className="selectable text-trunc">
                        {transaction.channel_name}
                    </span>
                </Tooltip>
                {transaction.account_name && (
                    <Tooltip content={transaction.account_name}>
                        <div className="selectable text-sub text-trunc">
                            {transaction.account_name}
                        </div>
                    </Tooltip>
                )}
            </td>
            <td className="td-monto td-right" style={selBg(isSelected)}>
                <Tooltip content={`${transaction.currency} ${formatNumber(amount, { dynamic: true })}`}>
                    <span className="selectable amount text-trunc">
                        {transaction.currency} {formatNumber(amount, { dynamic: true })}
                    </span>
                </Tooltip>
                <Tooltip
                    content={`${transaction.currency === "ARS" ? "USD" : "ARS"} ${formatNumber(alternateAmount, { dynamic: true })}`}
                >
                    <span className="selectable amount-alt text-trunc">
                        {transaction.currency === "ARS" ? "USD" : "ARS"}{" "}
                        {formatNumber(alternateAmount, { dynamic: true })}
                    </span>
                </Tooltip>
            </td>
            <td className="td-mon" style={selBg(isSelected)}>
                <span className="selectable badge" style={{
                    backgroundColor: colors.fill,
                    color: transaction.currency === "ARS" ? colors.accent.cyan : colors.accent.green,
                }}>
                    {transaction.currency}
                </span>
            </td>
            <td className="td-tc" style={selBg(isSelected)}>
                <Tooltip
                    content={
                        transaction.exchange_rate % 1 === 0
                            ? String(transaction.exchange_rate)
                            : transaction.exchange_rate.toFixed(2)
                    }
                >
                    <span className="selectable amount-alt text-trunc">
                        {transaction.exchange_rate % 1 === 0
                            ? transaction.exchange_rate.toString()
                            : transaction.exchange_rate.toFixed(2)}
                    </span>
                </Tooltip>
            </td>
            <td className="td-frec" style={selBg(isSelected)}>
                {transaction.frequency === "fixed" ? (
                    <span className="selectable badge" style={{ backgroundColor: colors.fill, color: colors.accent.blue }}>
                        Fijo
                    </span>
                ) : transaction.frequency === "variable" ? (
                    <span className="selectable badge" style={{ backgroundColor: colors.fill, color: colors.accent.purple }}>
                        Var
                    </span>
                ) : (
                    <span style={{ color: colors.fg.dim }}>-</span>
                )}
            </td>
            <td className="td-estado" style={selBg(isSelected)}>
                <span
                    className="selectable badge"
                    onClick={handleTogglePaid}
                    style={{
                        backgroundColor: colors.fill,
                        color: transaction.is_paid
                            ? colors.accent.teal
                            : colors.accent.orange,
                        cursor: "pointer",
                        display: "inline-block",
                    }}
                >
                    {transaction.is_paid ? (transaction.type === "income" ? "Recibido" : "Pagado") : "Pendiente"}
                </span>
            </td>
            <td className="td-opciones" style={selBg(isSelected)}>
                <span style={{ display: "flex", gap: spacing[2], justifyContent: "center" }}>
                    <Button
                        variant="icon"
                        title="Cancelar cuotas"
                        onClick={handleCancelInstallments}
                        disabled={!transaction.installment_group_id || transaction.is_canceled === true}
                        style={{
                            opacity: transaction.installment_group_id && !transaction.is_canceled ? 1 : 0.2,
                        }}
                    >
                        <CreditCard size={14} />
                    </Button>
                    <Button variant="icon" title="Editar" onClick={handleEdit}>
                        <Pencil size={14} />
                    </Button>
                    <Button variant="icon" title="Eliminar" onClick={handleDelete}>
                        <Trash2 size={14} />
                    </Button>
                </span>
            </td>
        </>
    );
}, (p, n) =>
    p.transaction === n.transaction &&
    p.isSelected === n.isSelected &&
    p.userDateFormat === n.userDateFormat &&
    p.textFormat === n.textFormat
);

export function TransactionRow({
    transaction,
    onDelete,
    onCancelInstallments,
    isEditing,
    onStartEdit,
    onFinishEdit,
    isSelected = false,
    onToggleSelect,
    userDateFormat,
    textFormat,
    onFormatClick,
}: TransactionRowProps) {
    const handleCancel = () => onFinishEdit();

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
        <tr style={{ backgroundColor: isSelected ? colors.bg.selected : undefined }}>
            <TransactionRowCells
                transaction={transaction}
                onDelete={onDelete}
                onCancelInstallments={onCancelInstallments}
                onStartEdit={onStartEdit}
                isSelected={isSelected}
                onToggleSelect={onToggleSelect}
                userDateFormat={userDateFormat}
                textFormat={textFormat}
                onFormatClick={onFormatClick}
            />
        </tr>
    );
}
