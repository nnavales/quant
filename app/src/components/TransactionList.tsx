import { useState } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { TransactionRow } from "./TransactionRow";
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
}

export function TransactionList({ transactions, sort, order, onSort, onDelete, onCancelInstallments }: TransactionListProps) {
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
        }}>
            <table style={tableStyle}>
            <thead style={theadStyle}>
                <tr>
                    <th style={{ ...thStyle(!!onSort, sort === "date"), width: "110px" }} onClick={() => handleSortClick("date")}>
                        <span style={sortableThStyle}>Fecha{renderSortIcon("date")}</span>
                    </th>
                    <th style={{ ...thStyle(false, false, "left"), width: "250px" }}>Descripción</th>
                    <th style={{ ...thStyle(false, false), width: "80px" }}>Tipo</th>
                    <th style={{ ...thStyle(false, false), width: "60px" }}>Frec.</th>
                    <th style={{ ...thStyle(false, false), width: "120px" }}>Categoría</th>
                    <th style={{ ...thStyle(false, false), width: "100px" }}>Canal</th>
                    <th style={{ ...thStyle(false, false), width: "60px" }}>Mon.</th>
                    <th style={{ ...thStyle(!!onSort, sort === "amount"), width: "140px" }} onClick={() => handleSortClick("amount")}>
                        <span style={sortableThStyle}>Monto{renderSortIcon("amount")}</span>
                    </th>
                    <th style={{ ...thStyle(false, false), width: "70px" }}>T.C.</th>
                    <th style={{ ...thStyle(false, false), width: "90px" }}>Estado</th>
                    <th style={{ ...thStyle(false, false, "right"), width: "110px", minWidth: "110px", maxWidth: "110px" }}>Opciones</th>
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
                    />
                ))}
            </tbody>
        </table>
        </div>
    );
}
