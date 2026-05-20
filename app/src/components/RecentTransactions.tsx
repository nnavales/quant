import { useQuery } from "@tanstack/react-query";
import { transactionAggregates } from "@/api_client";
import { useUserConfig } from "@/hooks";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateStr, getDateFormat } from "@/utils/date";

interface RecentTransactionsProps {
    limit?: number;
    onAddIncome: () => void;
    onAddExpense: () => void;
}

export function RecentTransactions({ limit = 8, onAddIncome, onAddExpense }: RecentTransactionsProps) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["transactions", "recent", limit],
        queryFn: () => transactionAggregates.list({ limit }),
    });
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);

    if (isLoading) {
        return (
            <div
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.lg,
                    padding: spacing[4],
                    border: `1px solid ${colors.border}`,
                }}
            >
                <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>Cargando...</div>
            </div>
        );
    }
    if (isError) {
        return (
            <div
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.lg,
                    padding: spacing[4],
                    border: `1px solid ${colors.border}`,
                }}
            >
                <div style={{ color: colors.accent.red, textAlign: "center", padding: spacing[4] }}>Error</div>
            </div>
        );
    }
    const transactions = data?.data?.slice(0, limit) ?? [];

    return (
        <div
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                padding: spacing[4],
                border: `1px solid ${colors.border}`,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: "420px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing[3],
                }}
            >
                <span style={{ fontSize: fonts.size.sm, color: colors.fg.base, textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>
                    Transacciones Recientes
                </span>
                <div style={{ display: "flex", gap: spacing[2] }}>
                    <Button variant="chip" size="sm" color="green" iconLeft={<Plus size={12} />} onClick={onAddIncome}>
                        Ingreso
                    </Button>
                    <Button variant="chip" size="sm" color="red" iconLeft={<Plus size={12} />} onClick={onAddExpense}>
                        Gasto
                    </Button>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                {transactions.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: colors.fg.dim, fontSize: fonts.size.sm }}>Sin transacciones</span>
                    </div>
                ) : (
                    transactions.map((t, idx) => {
                    const isIncome = t.type === "income";
                    const displayAmount = isIncome ? `+${t.amount}` : `-${t.amount}`;
                    const dateFormatted = formatDateStr(t.date, userDateFormat);

                    return (
                        <div
                            key={t.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing[2],
                                padding: `${spacing[3]} ${spacing[1]}`,
                                borderBottom: idx < transactions.length - 1 ? `1px solid ${colors.fill}` : "none",
                                minWidth: 0,
                            }}
                        >
                            {/* Icon */}
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: radius.md,
                                    backgroundColor: isIncome
                                        ? colors.badge.income
                                        : colors.badge.expense,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {isIncome ? (
                                    <ArrowUp size={15} color={colors.accent.green} />
                                ) : (
                                    <ArrowDown size={15} color={colors.accent.red} />
                                )}
                            </div>

                            {/* Date */}
                            <span
                                className="selectable"
                                style={{
                                    fontSize: fonts.size.sm,
                                    color: colors.fg.dim,
                                    flexShrink: 0,
                                    minWidth: "44px",
                                }}
                            >
                                {dateFormatted}
                            </span>

                            {/* Description with Category/Channel inline */}
                            <div style={{ display: "flex", alignItems: "center", gap: spacing[2], minWidth: 0, flex: 1 }}>
                                <span
                                    className="selectable"
                                    style={{
                                        fontSize: fonts.table.body,
                                        color: colors.fg.base,
                                        fontWeight: 500,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "200px",
                                        minWidth: 0,
                                    }}
                                >
                                    {t.description || "Sin descripción"}
                                </span>
                                <span
                                    className="selectable"
                                    style={{
                                        fontSize: fonts.size.sm,
                                        color: colors.fg.dim,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "120px",
                                        flexShrink: 0,
                                    }}
                                >
                                    {t.category_name || "-"}
                                </span>
                                {t.channel_name && (
                                    <>
                                        <span style={{ color: colors.fill, flexShrink: 0 }}>•</span>
                                        <span
                                            className="selectable"
                                            style={{
                                                fontSize: fonts.size.sm,
                                                color: colors.fg.dim,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "120px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {t.channel_name}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Amount — fixed, pushed to far right */}
                            <span
                                className="selectable"
                                style={{
                                    fontSize: fonts.table.body,
                                    fontFamily: fonts.family.display,
                                    fontWeight: 500,
                                    color: colors.fg.base,
                                    textAlign: "right",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    minWidth: "90px",
                                }}
                            >
                                {t.currency} {displayAmount}
                            </span>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}
