import { useState } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { TransactionRow } from "./TransactionRow";
import { Check, Minus } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { tableStyle, theadStyle, thStyle, sortableThStyle, iconStyle } from "@/styles/table";

interface TransactionListProps {
    transactions: TransactionRowDTO[];
    sort?: "date" | "amount" | "created_at";
    order?: "asc" | "desc";
    onSort?: (sort: "date" | "amount" | "created_at") => void;
    onDelete?: (transaction: TransactionRowDTO) => void;
    onCancelInstallments?: (transaction: TransactionRowDTO) => void;
    selectedIds?: Set<string>;
    onToggleSelect?: (id: string, idx: number, shiftKey: boolean) => void;
    onToggleSelectAll?: () => void;
    isAllSelected?: boolean;
}

export function TransactionList({ transactions, sort, order, onSort, onDelete, onCancelInstallments, selectedIds, onToggleSelect, onToggleSelectAll, isAllSelected }: TransactionListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const handleSortClick = (column: "date" | "amount" | "created_at") => {
        if (onSort) {
            onSort(column);
        }
    };

    if (transactions.length === 0) {
        return (
            <div
                style={{
                    padding: spacing[8],
                    textAlign: "center",
                    color: colors.fg.dim,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                }}
            >
                No hay transacciones
            </div>
        );
    }

    const renderSortIcon = (column: "date" | "amount" | "created_at") => {
        const icon = sort !== column ? "↕" : order === "desc" ? "▼" : "▲";
        const opacity = sort !== column ? 0.7 : 1;
        return <span style={{ ...iconStyle, opacity }}>{icon}</span>;
    };

    return (
        <div style={{
            borderRadius: radius.lg,
            overflow: "hidden",
            backgroundColor: colors.bg.surface,
            borderTop: `1px solid ${colors.fill}`,
            borderRight: `1px solid ${colors.fill}`,
        }}>
            <table style={tableStyle}>
            <thead style={theadStyle}>
                <tr>
                    <th style={{ ...thStyle(false, false), width: "36px", minWidth: "36px", maxWidth: "36px", position: "relative" }}>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", lineHeight: 0 }}>
                            <div style={{ position: "relative", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    ref={(el) => { if (el) el.indeterminate = !!selectedIds?.size && !isAllSelected; }}
                                    onChange={onToggleSelectAll}
                                    style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", margin: 0 }}
                                />
                                <div
                                    style={{
                                        width: "14px",
                                        height: "14px",
                                        borderRadius: "4px",
                                        border: `1.5px solid ${isAllSelected ? colors.fg.base : selectedIds?.size ? colors.fg.base : colors.border}`,
                                        backgroundColor: isAllSelected ? colors.fg.base : selectedIds?.size ? `${colors.fg.base}20` : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        pointerEvents: "none",
                                        transition: "all 0.12s",
                                    }}
                                >
                                    {isAllSelected && <Check size={10} color={colors.bg.base} strokeWidth={3} />}
                                    {!!selectedIds?.size && !isAllSelected && <Minus size={10} color={colors.fg.base} strokeWidth={3} />}
                                </div>
                            </div>
                        </div>
                    </th>
                    <th style={{ ...thStyle(!!onSort, sort === "date", "left"), width: "9%" }} onClick={() => handleSortClick("date")}>
                        <span style={sortableThStyle}>Fecha{renderSortIcon("date")}</span>
                    </th>
                    <th style={{ ...thStyle(false, false, "left"), width: "18%" }}>Descripción</th>
                    <th style={{ ...thStyle(false, false), width: "6%" }}>Tipo</th>
                    <th style={{ ...thStyle(false, false, "left"), width: "12%" }}>Categoría</th>
                    <th style={{ ...thStyle(false, false, "left"), width: "12%" }}>Canal</th>
                    <th style={{ ...thStyle(!!onSort, sort === "amount", "right"), width: "12%" }} onClick={() => handleSortClick("amount")}>
                        <span style={sortableThStyle}>Monto{renderSortIcon("amount")}</span>
                    </th>
                    <th style={{ ...thStyle(false, false), width: "5%" }}>Mon.</th>
                    <th style={{ ...thStyle(false, false), width: "6%" }}>T.C.</th>
                    <th style={{ ...thStyle(false, false), width: "5%" }}>Frec.</th>
                    <th style={{ ...thStyle(false, false), width: "7%" }}>Estado</th>
                    <th style={{ ...thStyle(false, false), width: "8%" }}>Opciones</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map((transaction, idx) => (
                    <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onDelete={onDelete!}
                        onCancelInstallments={onCancelInstallments!}
                        isEditing={editingId === transaction.id}
                        onStartEdit={() => setEditingId(transaction.id)}
                        onFinishEdit={() => setEditingId(null)}
                        index={idx}
                        isSelected={selectedIds?.has(transaction.id)}
                        onToggleSelect={(shiftKey) => onToggleSelect?.(transaction.id, idx, shiftKey)}
                    />
                ))}
            </tbody>
        </table>
        </div>
    );
}
