import React, { useState, useRef } from "react";
import { Pencil, X } from "lucide-react";
import { spacing, radius, shadows } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import type { HistoricalEntry } from "@/api_client";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const checkedRef = useRef(false);
    const textRef = useRef<HTMLSpanElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPos({ x: e.clientX + 10, y: e.clientY + 10 });
    };

    const handleMouseEnter = () => {
        if (!checkedRef.current && textRef.current) {
            const el = textRef.current;
            checkedRef.current = el.scrollWidth > el.clientWidth;
        }
        if (checkedRef.current) {
            setShow(true);
        }
    };

    return (
        <span onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)} onMouseMove={handleMouseMove}>
            {React.isValidElement(children) 
                ? React.cloneElement(children as React.ReactElement<{ref?: React.Ref<HTMLSpanElement>}>, { ref: textRef })
                : children
            }
            {show && content && (
                <div style={{ position: "fixed", left: pos.x, top: pos.y, backgroundColor: colors.bg.surface, border: `1px solid ${colors.highlight.medium}`, borderRadius: radius.md, padding: `${spacing[1]} ${spacing[2]}`, fontSize: fonts.size.xs, color: colors.fg.default, boxShadow: shadows.base, zIndex: 1000, whiteSpace: "nowrap", pointerEvents: "none" }}>
                    {content}
                </div>
            )}
        </span>
    );
}

interface HistoricalListProps {
    entries: HistoricalEntry[];
    sort?: "month" | "income" | "expense";
    order?: "asc" | "desc";
    onSort?: (sort: "month" | "income" | "expense") => void;
    onEdit?: (entry: HistoricalEntry) => void;
    onDelete?: (entry: HistoricalEntry) => void;
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

const thStyle = (sortable: boolean, active: boolean, align: "left" | "right" = "left"): React.CSSProperties => ({
    padding: `${spacing[2]} ${spacing[3]}`,
    textAlign: align,
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

const formatMonth = (monthStr: string, useFullFormat: boolean): string => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    if (useFullFormat) {
        return new Intl.DateTimeFormat("es-AR", {
            month: "long",
            year: "numeric",
        }).format(date);
    }
    return monthStr;
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
    const [hoverDelete, setHoverDelete] = useState(false);

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

    const getActionBtnStyle = (isDelete: boolean = false, isHover: boolean = false): React.CSSProperties => {
        const base: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: radius.md,
            cursor: "pointer",
            fontSize: fonts.size.sm,
            backgroundColor: "transparent",
        };
        if (isDelete) {
            base.border = isHover ? `1px solid ${colors.semantic.error}` : `1px solid ${colors.highlight.border}`;
            base.color = isHover ? colors.semantic.error : colors.fg.muted;
        } else {
            base.border = `1px solid ${colors.highlight.border}`;
            base.color = colors.fg.muted;
        }
        return base;
    };

    if (entries.length === 0) {
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
        height: "48px",
    };

    const moneyStyle: React.CSSProperties = {
        fontFamily: fonts.family.mono,
        fontWeight: 600,
        fontSize: fonts.size.sm,
        color: colors.fg.default,
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
        fontFamily: fonts.family.mono,
        fontSize: fonts.size.xs,
        color: colors.fg.muted,
        opacity: 0.7,
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    const fixedWidthStyle = (width: string): React.CSSProperties => ({ width, minWidth: width, maxWidth: width });

    return (
        <div style={{ border: `1px solid ${colors.highlight.medium}`, borderRadius: radius.lg, overflow: "hidden" }}>
            <table style={tableStyle}>
                <thead style={theadStyle}>
<tr>
                        <th style={{ ...thStyle(!!onSort, sort === "month"), ...sortableThStyle, width: "90px" }} onClick={() => onSort && onSort("month")}>
                            Mes{renderSortIcon("month")}
                        </th>
                        <th style={{ ...thStyle(!!onSort, sort === "income"), textAlign: "center", width: "100px" }} onClick={() => handleSortClick("income")}>
                            Ingreso{renderSortIcon("income")}
                        </th>
                        <th style={{ ...thStyle(!!onSort, sort === "expense"), textAlign: "center", width: "100px" }} onClick={() => handleSortClick("expense")}>
                            Gasto{renderSortIcon("expense")}
                        </th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "90px" }}>Ahorro</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "100px" }}>Ing. Fijo</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "100px" }}>Gas. Fijo</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "100px" }}>Ing. Variable</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "100px" }}>Gas. Variable</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "70px" }}>T.C.</th>
                        <th style={{ ...thStyle(false, false), textAlign: "center", width: "100px" }}>Fuente</th>
                        <th style={{ ...thStyle(false, false), textAlign: "right", width: "60px" }}>Opciones</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr
                            key={entry.month}
                            style={{
                                borderBottom: `1px solid ${colors.highlight.medium}`,
                            }}
                        >
                            <td style={{ ...tdStyle, ...fixedWidthStyle("90px"), whiteSpace: "nowrap", cursor: "pointer" }} onClick={toggleMonthFormat}>
                                {formatMonth(entry.month, useFullMonthFormat)}
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), textAlign: "center" }}>
                                <Tooltip content={formatAmount(entry.income)}>
                                    <span style={incomeStyle}>{formatAmount(entry.income)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), textAlign: "center" }}>
                                <Tooltip content={formatAmount(entry.expense)}>
                                    <span style={expenseStyle}>{formatAmount(entry.expense)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("90px"), textAlign: "center" }}>
                                <Tooltip content={formatAmount(entry.savings)}>
                                    <span style={moneyStyle}>{formatAmount(entry.savings)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), textAlign: "center" }}>
                                <Tooltip content={formatAmount(entry.income_fixed)}>
                                    <span style={moneyAltStyle}>{formatAmount(entry.income_fixed)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("100px") }}>
                                <Tooltip content={formatAmount(entry.expense_fixed)}>
                                    <span style={moneyAltStyle}>{formatAmount(entry.expense_fixed)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), textAlign: "center" }}>
                                <Tooltip content={formatAmount(entry.income_variable)}>
                                    <span style={moneyAltStyle}>{formatAmount(entry.income_variable)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), textAlign: "center" }}>
                                <Tooltip content={formatAmount(entry.expense_variable)}>
                                    <span style={moneyAltStyle}>{formatAmount(entry.expense_variable)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center", fontFamily: fonts.family.mono, fontSize: fonts.size.xs, color: colors.fg.muted, opacity: 0.7, ...fixedWidthStyle("70px") }}>
                                <Tooltip content={entry.exchange_rate % 1 === 0 ? String(entry.exchange_rate) : entry.exchange_rate.toFixed(2)}>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{entry.exchange_rate % 1 === 0 ? String(entry.exchange_rate) : entry.exchange_rate.toFixed(2)}</span>
                                </Tooltip>
                            </td>
                            <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), textAlign: "center" }}>
                                <span style={{
                                    fontSize: fonts.size.xs,
                                    padding: `${spacing[1]} ${spacing[2]}`,
                                    borderRadius: radius.md,
                                    textTransform: "uppercase",
                                    fontWeight: 500,
                                    backgroundColor: entry.source === "historical" ? `${colors.accent.purple}26` : `${colors.bg.overlay}26`,
                                    color: entry.source === "historical" ? colors.accent.purple : colors.fg.muted,
                                }}>
                                    {entry.source}
                                </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right", ...fixedWidthStyle("100px") }}>
                                <span style={{ display: "flex", gap: spacing[1], justifyContent: "flex-end" }}>
                                    {entry.source === "historical" && onEdit && (
                                        <button onClick={() => onEdit(entry)} style={getActionBtnStyle(false, false)} title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                    )}
                                    {entry.source === "historical" && onDelete && (
                                        <button 
                                            style={getActionBtnStyle(true, hoverDelete)} 
                                            onMouseEnter={() => setHoverDelete(true)} 
                                            onMouseLeave={() => setHoverDelete(false)} 
                                            onClick={() => onDelete(entry)}
                                            title="Eliminar"
                                        >
                                            <X size={14} />
                                        </button>
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