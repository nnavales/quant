import { memo } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { Pencil, CreditCard, Trash2, Check, SquareCheck, SquareMinus } from "lucide-react";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { parseLocalDate, formatDateStr } from "@/utils/date";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { spacing } from "@/styles/theme";
import { Button } from "@/components/ui/Button";
import {
    useUpdateEntryPaid,
} from "@/hooks";
import { Tooltip } from "@/components/ui/Tooltip";
import { TransactionRowEdit } from "./TransactionRowEdit";
import { formatNumber } from "@/utils/format";
import { truncate } from "@/styles/layout";

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
    isNew?: boolean;
}

const SEL_STYLE: React.CSSProperties = { backgroundColor: colors.bg.selected };
const selBg = (sel: boolean) => sel ? SEL_STYLE : undefined;

type DateTextFormat = "default" | "full";

const MONTH_NAMES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const formatDateCell = (dateStr: string, textFormat: DateTextFormat, userFormat: import("@/utils/date").DateFormat) => {
    if (textFormat === "default") {
        return formatDateStr(dateStr, userFormat);
    }

    const date = parseLocalDate(dateStr);
    const d = String(date.getDate()).padStart(2, "0");
    const m = MONTH_NAMES[date.getMonth()];
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
    isNew = false,
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
    const amountFmt = formatNumber(amount, { dynamic: true });
    const alternateAmountFmt = formatNumber(alternateAmount, { dynamic: true });

    return (
        <>
            <div className={`td-checkbox td-center${isNew ? " td-new" : ""}`} style={selBg(isSelected)}>
                <div className="checkbox-center">
                    <div
                        onClick={(e) => onToggleSelect?.(e.shiftKey)}
                        style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "4px",
                            border: `1.5px solid ${isSelected ? colors.fg.base : `${colors.fg.dim}40`}`,
                            backgroundColor: isSelected ? colors.fg.base : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "background-color .12s,border-color .12s",
                        }}
                    >
                        {isSelected && <Check size={10} strokeWidth={2.5} color={colors.bg.base} />}
                    </div>
                </div>
            </div>
            <div
                className="td-fecha td-left"
                style={selBg(isSelected)}
                onClick={onFormatClick}
                title="Cambiar formato"
            >
                <span className="selectable">{formatDateCell(transaction.date, textFormat, userDateFormat)}</span>
            </div>
            <div className="td-tipo" style={selBg(isSelected)}>
                <span className="selectable" style={{
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.medium,
                    color: isExpense ? colors.accent.red : colors.accent.green,
                }}>
                    {isExpense ? "▼ EGR" : "▲ ING"}
                </span>
            </div>
            <div className="td-desc td-left" style={selBg(isSelected)}>
                <Tooltip content={transaction.description || "Sin descripción"}>
                    <span className="selectable text-trunc" style={{ fontWeight: fonts.weight.medium }}>
                        {transaction.description || "Sin descripción"}
                    </span>
                </Tooltip>
            </div>
            <div className="td-cuotas td-center" style={selBg(isSelected)}>
                {transaction.total_installments ? (
                    <span className="text-sub" style={{ fontSize: fonts.size.xs2 }}>
                        {transaction.installment_number
                            ? `${transaction.installment_number}/${transaction.total_installments}`
                            : "Cancel."}
                    </span>
                ) : (
                    <span style={{ color: colors.fg.dim, fontSize: fonts.size.xs2 }}>-</span>
                )}
            </div>
            <div className="td-monto td-right" style={selBg(isSelected)}>
                <Tooltip
                    alwaysShow
                    content={
                        <div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <span style={{ color: colors.fg.dim, minWidth: 32, flexShrink: 0 }}>{transaction.currency}</span>
                                <span style={{ fontWeight: 500 }}>{amountFmt}</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", marginTop: "3px" }}>
                                <span style={{ color: colors.fg.dim, minWidth: 32, flexShrink: 0 }}>{transaction.currency === "ARS" ? "USD" : "ARS"}</span>
                                <span style={{ fontWeight: 500 }}>{alternateAmountFmt}</span>
                            </div>
                        </div>
                    }
                >
                    <span className="selectable amount text-trunc">
                        {amountFmt}
                    </span>
                </Tooltip>
            </div>
            <div className="td-mon" style={selBg(isSelected)}>
                <span className="selectable" style={{
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.medium,
                    color: transaction.currency === "ARS" ? colors.accent.cyan : colors.accent.green,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                }}>
                    {transaction.currency}
                </span>
            </div>
            <div style={{ ...selBg(isSelected), justifyContent: "flex-end" }}>
                <Tooltip content={formatNumber(transaction.exchange_rate, { trim: true })}>
                    <span className="selectable amount-alt text-trunc" style={{ fontSize: fonts.size.xs2 }}>
                        {formatNumber(transaction.exchange_rate, { trim: true })}
                    </span>
                </Tooltip>
            </div>
            <div className="td-frec" style={selBg(isSelected)}>
                {transaction.frequency === "fixed" ? (
                    <span className="selectable" style={{ fontSize: fonts.size.xs2, fontWeight: fonts.weight.medium, color: colors.accent.blue }}>
                        FIJO
                    </span>
                ) : transaction.frequency === "variable" ? (
                    <span className="selectable" style={{ fontSize: fonts.size.xs2, fontWeight: fonts.weight.medium, color: colors.accent.purple }}>
                        VAR
                    </span>
                ) : (
                    <span style={{ color: colors.fg.dim }}>-</span>
                )}
            </div>
            <div className="td-cat td-left" style={selBg(isSelected)}>
                <Tooltip
                    as="div"
                    content={
                        <div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <span style={{ color: colors.fg.dim, minWidth: 62, flexShrink: 0 }}>Categoría</span>
                                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{transaction.category_name || "-"}</span>
                            </div>
                            {transaction.subcategory_name && (
                                <div style={{ display: "flex", gap: "8px", marginTop: "3px" }}>
                                    <span style={{ color: colors.fg.dim, minWidth: 62, flexShrink: 0 }}>Subcat.</span>
                                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{transaction.subcategory_name}</span>
                                </div>
                            )}
                        </div>
                    }
                >
                    <span className="selectable" style={{...truncate, display: "block"}}>
                        {transaction.category_name || "-"}
                        {transaction.subcategory_name && (
                            <span style={{ color: colors.fg.dim }}> / {transaction.subcategory_name}</span>
                        )}
                    </span>
                </Tooltip>
            </div>
            <div className="td-canal td-left" style={selBg(isSelected)}>
                <Tooltip
                    as="div"
                    content={
                        <div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <span style={{ color: colors.fg.dim, minWidth: 62, flexShrink: 0 }}>Canal</span>
                                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{transaction.channel_name}</span>
                            </div>
                            {transaction.account_name && (
                                <div style={{ display: "flex", gap: "8px", marginTop: "3px" }}>
                                    <span style={{ color: colors.fg.dim, minWidth: 62, flexShrink: 0 }}>Cuenta</span>
                                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{transaction.account_name}</span>
                                </div>
                            )}
                        </div>
                    }
                >
                    <span className="selectable" style={{...truncate, display: "block"}}>
                        {transaction.channel_name}
                        {transaction.account_name && (
                            <span style={{ color: colors.fg.dim }}> / {transaction.account_name}</span>
                        )}
                    </span>
                </Tooltip>
            </div>
            <div className="td-estado" style={selBg(isSelected)}>
                <span onClick={handleTogglePaid} style={{ cursor: "pointer", lineHeight: 0 }}>
                    {transaction.is_paid
                        ? <SquareCheck size={15} strokeWidth={2.5} color={colors.accent.teal} />
                        : <SquareMinus size={15} strokeWidth={2.5} color={colors.accent.orange} />}
                </span>
            </div>
            <div className="td-opciones" style={selBg(isSelected)}>
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
                        <CreditCard size={13.5} strokeWidth={2.5} />
                    </Button>
                    <Button variant="icon" title="Editar" onClick={handleEdit}>
                        <Pencil size={13.5} strokeWidth={2.5} />
                    </Button>
                    <Button variant="icon" title="Eliminar" onClick={handleDelete}>
                        <Trash2 size={13.5} strokeWidth={2.5} />
                    </Button>
                </span>
            </div>
        </>
    );
}, (p, n) =>
    p.transaction === n.transaction &&
    p.isSelected === n.isSelected &&
    p.userDateFormat === n.userDateFormat &&
    p.textFormat === n.textFormat &&
    p.isNew === n.isNew
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
