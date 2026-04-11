import { useState } from "react";
import type { TransactionRowDTO } from "@/api_client";
import { TransactionRow } from "./TransactionRow";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

interface TransactionListProps {
    transactions: TransactionRowDTO[];
    sort?: "date" | "amount" | "created_at";
    order?: "asc" | "desc";
    onSort?: (sort: "date" | "amount" | "created_at") => void;
    onDelete?: (transaction: TransactionRowDTO) => void;
    onCancelInstallments?: (transaction: TransactionRowDTO) => void;
}

const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: fonts.size.sm,
};

const theadStyle: React.CSSProperties = {
    backgroundColor: colors.bg.dim,
    borderBottom: `1px solid ${colors.highlight.medium}`,
};

const thStyle = (sortable: boolean, active: boolean): React.CSSProperties => ({
    padding: `${spacing[2]} ${spacing[3]}`,
    textAlign: "left",
    fontWeight: 600,
    color: active ? colors.accent.teal : colors.fg.muted,
    textTransform: "uppercase",
    fontSize: fonts.size.xs,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    cursor: sortable ? "pointer" : "default",
    userSelect: sortable ? "none" : "auto",
    transition: "color 0.15s",
});

const iconStyle: React.CSSProperties = {
    fontSize: "11px",
    marginLeft: spacing[1],
    lineHeight: 1,
};

const sortableThStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing[1],
};

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
                    color: colors.fg.muted,
                    border: `1px solid ${colors.highlight.medium}`,
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
        <div style={{ border: `1px solid ${colors.highlight.medium}`, borderRadius: radius.lg, overflow: "hidden" }}>
            <table style={tableStyle}>
                <thead style={theadStyle}>
                    <tr>
                        <th style={{ ...thStyle(!!onSort, sort === "date"), ...sortableThStyle, width: "100px" }} onClick={() => handleSortClick("date")}>
                            Fecha{renderSortIcon("date")}
                        </th>
                        <th style={{ ...thStyle(false, false), width: "250px" }}>Descripción</th>
                        <th style={{ ...thStyle(false, false), width: "80px" }}>Tipo</th>
                        <th style={{ ...thStyle(false, false), width: "60px" }}>Frec.</th>
                        <th style={{ ...thStyle(false, false), width: "120px" }}>Categoría</th>
                        <th style={{ ...thStyle(false, false), width: "100px" }}>Canal</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "60px" }}>Mon.</th>
                        <th style={{ ...thStyle(!!onSort, sort === "amount"), textAlign: "right", width: "140px" }} onClick={() => handleSortClick("amount")}>
                            Monto{renderSortIcon("amount")}
                        </th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "60px" }}>T.C.</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "90px" }}>Estado</th>
                        <th style={{ ...thStyle(false, false), textAlign: "right", width: "100px" }}>Opciones</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction) => (
                        <TransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            onDelete={onDelete!}
                            onCancelInstallments={onCancelInstallments!}
                            isEditing={editingId === transaction.id}
                            onStartEdit={() => setEditingId(transaction.id)}
                            onFinishEdit={() => setEditingId(null)}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
