import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatMonthStr, getDateFormat } from "@/utils/date";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { useUserConfig } from "@/hooks";
import type { HistoricalEntry } from "@/api_client";
import { tableStyle, theadStyle, thStyle, sortableThStyle, iconStyle, fixedWidthStyle } from "@/styles/table";

interface HistoricalListProps {
    entries: HistoricalEntry[];
    sort?: "month" | "income" | "expense";
    order?: "asc" | "desc";
    onSort?: (sort: "month" | "income" | "expense") => void;
    onEdit?: (entry: HistoricalEntry) => void;
    onDelete?: (entry: HistoricalEntry) => void;
}

const formatMonth = (monthStr: string, useFullFormat: boolean, dateFormat: import("@/utils/date").DateFormat): string => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    if (useFullFormat) {
        const formatted = new Intl.DateTimeFormat("es-AR", {
            month: "long",
            year: "numeric",
        }).format(date);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return formatMonthStr(monthStr, dateFormat);
};

const formatAmount = (amount: string | undefined): string => {
    if (!amount) return "0";
    const num = parseFloat(amount);
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const STORAGE_KEY = "summit-historical-month-format";

const getStoredFormat = (): boolean => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === "full";
    } catch {
        return false;
    }
};

export function HistoricalList({ entries, sort, order, onSort, onEdit, onDelete }: HistoricalListProps) {
    const [useFullMonthFormat, setUseFullMonthFormat] = useState<boolean>(getStoredFormat);
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);

    const handleSortClick = (column: "month" | "income" | "expense") => {
        if (onSort) onSort(column);
    };

    const toggleMonthFormat = () => {
        const newValue = !useFullMonthFormat;
        setUseFullMonthFormat(newValue);
        try {
            localStorage.setItem(STORAGE_KEY, newValue ? "full" : "default");
        } catch {}
    };

    if (entries.length === 0) {
        return (
            <div
                style={{
                    padding: spacing[8],
                    textAlign: "center",
                    color: colors.fg.dim,
                    border: `1px solid ${colors.fill}`,
                    borderRadius: radius.lg,
                }}
            >
                No hay datos
            </div>
        );
    }

    const renderSortIcon = (column: "month" | "income" | "expense") => {
        const icon = sort !== column ? "↕" : order === "desc" ? "▼" : "▲";
        const opacity = sort !== column ? 0.7 : 1;
        return <span style={{ ...iconStyle, opacity }}>{icon}</span>;
    };

    const tdStyle: React.CSSProperties = {
        padding: `${spacing[1]} ${spacing[3]}`,
        verticalAlign: "middle",
        height: "46px",
        border: `1px solid ${colors.fill}`,
    };

    const moneyStyle: React.CSSProperties = {
        fontFamily: fonts.family.display,
        fontWeight: 500,
        fontSize: fonts.table.amount,
        color: colors.fg.base,
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    const incomeStyle: React.CSSProperties = {
        ...moneyStyle,
        color: colors.accent.green,
    };

    const expenseStyle: React.CSSProperties = {
        ...moneyStyle,
        color: colors.accent.red,
    };

    const moneyAltStyle: React.CSSProperties = {
        fontFamily: fonts.family.display,
        fontSize: fonts.table.meta,
        color: colors.fg.dim,
        opacity: 0.7,
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
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
                    <th style={{ ...thStyle(!!onSort, sort === "month"), width: "110px" }} onClick={() => onSort && onSort("month")}>
                        <span style={sortableThStyle}>Mes{renderSortIcon("month")}</span>
                    </th>
                    <th style={{ ...thStyle(!!onSort, sort === "income"), width: "100px" }} onClick={() => handleSortClick("income")}>
                        <span style={sortableThStyle}>Ingreso{renderSortIcon("income")}</span>
                    </th>
                    <th style={{ ...thStyle(false, false), width: "100px" }}>Ing. Fijo</th>
                    <th style={{ ...thStyle(false, false), width: "100px" }}>Ing. Variable</th>
                    <th style={{ ...thStyle(!!onSort, sort === "expense"), width: "100px" }} onClick={() => handleSortClick("expense")}>
                        <span style={sortableThStyle}>Gasto{renderSortIcon("expense")}</span>
                    </th>
                    <th style={{ ...thStyle(false, false), width: "100px" }}>Gas. Fijo</th>
                    <th style={{ ...thStyle(false, false), width: "100px" }}>Gas. Variable</th>
                    <th style={{ ...thStyle(false, false), width: "90px" }}>Ahorro</th>
                    <th style={{ ...thStyle(false, false), width: "70px" }}>T.C.</th>
                    <th style={{ ...thStyle(false, false), width: "100px" }}>Fuente</th>
                    <th style={{ ...thStyle(false, false, "right"), width: "110px", minWidth: "110px", maxWidth: "110px" }}>Opciones</th>
                </tr>
            </thead>
            <tbody>
                {entries.map((entry) => (
                    <tr
                        key={entry.month}
                        style={{ transition: "background-color 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#181B1D")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("110px"), whiteSpace: "nowrap", cursor: "pointer" }} onClick={toggleMonthFormat}>
                            {formatMonth(entry.month, useFullMonthFormat, userDateFormat)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <Tooltip content={formatAmount(entry.income)}>
                                <span style={incomeStyle}>{formatAmount(entry.income)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <Tooltip content={formatAmount(entry.income_fixed)}>
                                <span style={moneyAltStyle}>{formatAmount(entry.income_fixed)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <Tooltip content={formatAmount(entry.income_variable)}>
                                <span style={moneyAltStyle}>{formatAmount(entry.income_variable)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <Tooltip content={formatAmount(entry.expense)}>
                                <span style={expenseStyle}>{formatAmount(entry.expense)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <Tooltip content={formatAmount(entry.expense_fixed)}>
                                <span style={moneyAltStyle}>{formatAmount(entry.expense_fixed)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <Tooltip content={formatAmount(entry.expense_variable)}>
                                <span style={moneyAltStyle}>{formatAmount(entry.expense_variable)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("90px") }}>
                            <Tooltip content={formatAmount(entry.savings)}>
                                <span style={moneyStyle}>{formatAmount(entry.savings)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("70px") }}>
                            <Tooltip content={entry.exchange_rate % 1 === 0 ? String(entry.exchange_rate) : entry.exchange_rate.toFixed(2)}>
                                <span style={{ fontFamily: fonts.family.display, fontSize: fonts.table.meta, color: colors.fg.dim, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{entry.exchange_rate % 1 === 0 ? String(entry.exchange_rate) : entry.exchange_rate.toFixed(2)}</span>
                            </Tooltip>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                            <span style={{
                                fontSize: fonts.table.badge,
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: radius.md,
                                textTransform: "uppercase",
                                fontWeight: 500,
                                backgroundColor: entry.source === "historical" ? `${colors.accent.purple}26` : `${colors.bg.surface}26`,
                                color: entry.source === "historical" ? colors.accent.purple : colors.fg.dim,
                            }}>
                                {entry.source === "historical" ? "Histórico" : "Transacciones"}
                            </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", ...fixedWidthStyle("110px") }}>
                            <span style={{ display: "flex", gap: spacing[1], justifyContent: "flex-end" }}>
                                {entry.source === "historical" && onEdit && (
                                    <Button variant="icon" onClick={() => onEdit(entry)} title="Editar">
                                        <Pencil size={14} />
                                    </Button>
                                )}
                                {entry.source === "historical" && onDelete && (
                                    <Button variant="icon" onClick={() => onDelete(entry)} title="Eliminar">
                                        <Trash2 size={14} />
                                    </Button>
                                )}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}