import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Trash2, ArrowUp } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatMonthStr, getDateFormat } from "@/utils/date";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { useUserConfig } from "@/hooks";
import type { HistoricalEntry } from "@/api_client";
import {
    tableStyle,
    theadStyle,
    thStyle,
    sortableThStyle,
    iconStyle,
    fixedWidthStyle,
} from "@/styles/table";

interface HistoricalListProps {
    entries: HistoricalEntry[];
    sort?: "month" | "income" | "expense";
    order?: "asc" | "desc";
    onSort?: (sort: "month" | "income" | "expense") => void;
    onEdit?: (entry: HistoricalEntry) => void;
    onDelete?: (entry: HistoricalEntry) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
}

const formatMonth = (
    monthStr: string,
    useFullFormat: boolean,
    dateFormat: import("@/utils/date").DateFormat
): string => {
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
    return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const STORAGE_KEY = "quant-historical-month-format";

const getStoredFormat = (): boolean => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === "full";
    } catch {
        return false;
    }
};

export function HistoricalList({
    entries,
    sort,
    order,
    onSort,
    onEdit,
    onDelete,
    onLoadMore,
    hasMore,
    isLoadingMore,
}: HistoricalListProps) {
    const [useFullMonthFormat, setUseFullMonthFormat] = useState<boolean>(getStoredFormat);
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

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

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setShowScrollTop(el.scrollTop > 400);
        if (!onLoadMore || !hasMore || isLoadingMore) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, isLoadingMore]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    if (entries.length === 0) {
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
        height: "43px",
        borderBottom: `1px solid ${colors.fill}`,
        borderLeft: `1px solid ${colors.fill}`,
    };

    const moneyStyle: React.CSSProperties = {
        fontFamily: fonts.family.display,
        fontWeight: 500,
        fontSize: fonts.table.principal.body,
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
        fontSize: fonts.table.principal.meta,
        color: colors.fg.dim,
        opacity: 0.7,
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    return (
        <div style={{
            position: "absolute",
            inset: "0 0 5% 0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: radius.lg,
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.fill}`,
        }}>
        <div ref={scrollRef} className="historical-scroll" style={{
            flex: 1,
            overflow: "auto",
        }}>
            <style>{`
                .historical-table { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; }
                .historical-table thead { position: sticky; top: 0; z-index: 1; }
                .historical-table thead th { background-color: ${colors.bg.header}; }
                .historical-scroll::-webkit-scrollbar { width: 8px; }
                .historical-scroll::-webkit-scrollbar-track { background: transparent; }
                .historical-scroll::-webkit-scrollbar-thumb { background: ${colors.fill}; border-radius: 4px; }
            `}</style>
            <table className="historical-table" style={tableStyle}>
                    <thead style={theadStyle}>
                        <tr>
                            <th
                                style={{
                                    ...thStyle(!!onSort, sort === "month", "left"),
                                    width: "10%",
                                }}
                                onClick={() => onSort && onSort("month")}
                            >
                                <span style={sortableThStyle}>Mes{renderSortIcon("month")}</span>
                            </th>
                            <th
                                style={{
                                    ...thStyle(!!onSort, sort === "income", "right"),
                                    width: "10%",
                                }}
                                onClick={() => handleSortClick("income")}
                            >
                                <span style={sortableThStyle}>
                                    Ingreso{renderSortIcon("income")}
                                </span>
                            </th>
                            <th style={{ ...thStyle(false, false, "right"), width: "9%" }}>
                                Ing. Fijo
                            </th>
                            <th style={{ ...thStyle(false, false, "right"), width: "9%" }}>
                                Ing. Variable
                            </th>
                            <th
                                style={{
                                    ...thStyle(!!onSort, sort === "expense", "right"),
                                    width: "10%",
                                }}
                                onClick={() => handleSortClick("expense")}
                            >
                                <span style={sortableThStyle}>
                                    Gasto{renderSortIcon("expense")}
                                </span>
                            </th>
                            <th style={{ ...thStyle(false, false, "right"), width: "9%" }}>
                                Gas. Fijo
                            </th>
                            <th style={{ ...thStyle(false, false, "right"), width: "9%" }}>
                                Gas. Variable
                            </th>
                            <th style={{ ...thStyle(false, false, "right"), width: "10%" }}>
                                Ahorro
                            </th>
                            <th style={{ ...thStyle(false, false), width: "5%" }}>T.C.</th>
                            <th style={{ ...thStyle(false, false), width: "10%" }}>Fuente</th>
                            <th style={{ ...thStyle(false, false), width: "9%" }}>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => {
                            return (
                                <tr
                                    key={entry.month}
                                    style={{
                                        transition: "background-color 0.15s",
                                        backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = colors.bg.hover)
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor = "")
                                    }
                                >
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "left",
                                            ...fixedWidthStyle("10%"),
                                            whiteSpace: "nowrap",
                                            cursor: "pointer",
                                        }}
                                        onClick={toggleMonthFormat}
                                    >
                                        <span
                                            className="selectable"
                                            style={{ fontSize: fonts.table.principal.date }}
                                        >
                                            {formatMonth(
                                                entry.month,
                                                useFullMonthFormat,
                                                userDateFormat
                                            )}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("10%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.income)}>
                                            <span className="selectable" style={incomeStyle}>
                                                {formatAmount(entry.income)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("9%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.income_fixed)}>
                                            <span className="selectable" style={moneyAltStyle}>
                                                {formatAmount(entry.income_fixed)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("9%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.income_variable)}>
                                            <span className="selectable" style={moneyAltStyle}>
                                                {formatAmount(entry.income_variable)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("10%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.expense)}>
                                            <span className="selectable" style={expenseStyle}>
                                                {formatAmount(entry.expense)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("9%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.expense_fixed)}>
                                            <span className="selectable" style={moneyAltStyle}>
                                                {formatAmount(entry.expense_fixed)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("9%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.expense_variable)}>
                                            <span className="selectable" style={moneyAltStyle}>
                                                {formatAmount(entry.expense_variable)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            ...fixedWidthStyle("10%"),
                                        }}
                                    >
                                        <Tooltip content={formatAmount(entry.savings)}>
                                            <span className="selectable" style={moneyStyle}>
                                                {formatAmount(entry.savings)}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                            ...fixedWidthStyle("5%"),
                                        }}
                                    >
                                        <Tooltip
                                            content={
                                                entry.exchange_rate % 1 === 0
                                                    ? String(entry.exchange_rate)
                                                    : entry.exchange_rate.toLocaleString("es-AR", {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                      })
                                            }
                                        >
                                            <span
                                                className="selectable"
                                                style={{
                                                    fontFamily: fonts.family.display,
                                                    fontSize: fonts.table.principal.meta,
                                                    color: colors.fg.dim,
                                                    opacity: 0.7,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    display: "block",
                                                }}
                                            >
                                                {entry.exchange_rate % 1 === 0
                                                    ? String(entry.exchange_rate)
                                                    : entry.exchange_rate.toLocaleString("es-AR", {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                      })}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                            ...fixedWidthStyle("10%"),
                                        }}
                                    >
                                        <span
                                            className="selectable"
                                            style={{
                                                fontSize: fonts.table.principal.badge,
                                                padding: `${spacing[1]} ${spacing[2]}`,
                                                borderRadius: radius.md,
                                                textTransform: "uppercase",
                                                fontWeight: 500,
                                                backgroundColor:
                                                    entry.source === "historical"
                                                        ? `${colors.accent.purple}26`
                                                        : `${colors.bg.surface}26`,
                                                color:
                                                    entry.source === "historical"
                                                        ? colors.accent.purple
                                                        : colors.fg.dim,
                                            }}
                                        >
                                            {entry.source === "historical"
                                                ? "Histórico"
                                                : "Transacciones"}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                            ...fixedWidthStyle("9%"),
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                gap: spacing[1],
                                                justifyContent: "center",
                                            }}
                                        >
                                            {entry.source === "historical" && onEdit && (
                                                <Button
                                                    variant="icon"
                                                    onClick={() => onEdit(entry)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </Button>
                                            )}
                                            {entry.source === "historical" && onDelete && (
                                                <Button
                                                    variant="icon"
                                                    onClick={() => onDelete(entry)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {isLoadingMore && (
                    <div
                        style={{
                            padding: spacing[3],
                            textAlign: "center",
                            color: colors.fg.dim,
                            fontSize: fonts.size.sm,
                        }}
                    >
                        Cargando más...
                    </div>
                )}
            </div>
            {showScrollTop && (
                <button
                    onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                    style={{
                        position: "absolute",
                        bottom: spacing[4],
                        right: spacing[4],
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: colors.bg.header,
                        border: `1px solid ${colors.border}`,
                        color: colors.fg.base,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        transition: "all 0.15s",
                    }}
                    title="Volver arriba"
                >
                    <ArrowUp size={18} />
                </button>
            )}
        </div>
    );
}

