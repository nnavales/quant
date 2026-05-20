import { PlanningInput, PlanningMonthData } from "@/api_client/types";
import { radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { X, MoreHorizontal } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_KEYS: (keyof PlanningInput)[] = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const cellLabel: React.CSSProperties = {
    padding: "6px 12px",
    verticalAlign: "middle",
    borderBottom: `1px solid ${colors.fill}`,
    textAlign: "left",
    fontSize: fonts.table.body,
    fontWeight: fonts.weight.medium,
    overflow: "hidden",
    maxWidth: "0",
    boxSizing: "border-box",
};

const cellValue: React.CSSProperties = {
    padding: "6px 8px",
    verticalAlign: "middle",
    borderBottom: `1px solid ${colors.fill}`,
    borderLeft: `1px solid ${colors.fill}`,
    textAlign: "right",
    fontSize: fonts.table.amount,
    fontFamily: fonts.family.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "0",
};

function fmt(val: string | undefined | null): string {
     if (!val) return "—";
     const n = parseFloat(val);
     if (isNaN(n)) return "—";
     return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
 }

interface PlanningForecastTableProps {
    inputs: PlanningInput[];
    months: PlanningMonthData[];
    editingCell: { id: string; key: string } | null;
    editCellVal: string;
    onEditCellValChange: (val: string) => void;
    onStartCellEdit: (id: string, key: string, value: string | undefined) => void;
    onSaveCellEdit: () => void;
    onCancelCellEdit: () => void;
    onSaveFieldEdit: (id: string, key: string, value: string) => void;
    hoveredRow: string | null;
    onSetHoveredRow: (id: string | null) => void;
    deleteConfirm: { id: string; desc: string } | null;
    onSetDeleteConfirm: (v: { id: string; desc: string } | null) => void;
    onOpenNew: () => void;
    onDelete: (id: string) => void;
}

export function PlanningForecastTable({
    inputs,
    months,
    editingCell,
    editCellVal,
    onEditCellValChange,
    onStartCellEdit,
    onSaveCellEdit,
    onCancelCellEdit,
    onSaveFieldEdit,
    hoveredRow,
    onSetHoveredRow,
    deleteConfirm,
    onSetDeleteConfirm,
    onOpenNew,
    onDelete,
}: PlanningForecastTableProps) {
    return (
        <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <div style={{ overflowX: "auto", maxHeight: "685px", overflowY: "auto" }}>
                <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "collapse", fontSize: fonts.size.sm, tableLayout: "fixed" }}>
                    <thead>
                        <tr>
                            <th style={{
                                padding: "6px 12px", textAlign: "left", fontWeight: fonts.weight.medium,
                                color: colors.fg.dim, fontSize: fonts.size.sm, textTransform: "uppercase",
                                letterSpacing: "0.05em", whiteSpace: "nowrap", borderBottom: `1px solid ${colors.fill}`,
                                width: "13%", position: "sticky", top: 0, zIndex: 2, backgroundColor: colors.bg.header,
                            }}>Concepto</th>
                            {MONTHS.map((m) => (
                                <th key={m} style={{
                                    padding: "6px 8px", textAlign: "right", fontWeight: fonts.weight.medium,
                                    color: colors.fg.dim, fontSize: fonts.size.sm, textTransform: "uppercase",
                                    letterSpacing: "0.05em", whiteSpace: "nowrap", borderBottom: `1px solid ${colors.fill}`, borderLeft: `1px solid ${colors.fill}`,
                                    width: "7%", position: "sticky", top: 0, zIndex: 2, backgroundColor: colors.bg.header,
                                }}>{m}</th>
                            ))}
                            <th style={{
                                padding: "6px 8px", textAlign: "center", fontWeight: fonts.weight.medium,
                                color: colors.fg.dim, fontSize: fonts.size.sm, textTransform: "uppercase",
                                letterSpacing: "0.05em", whiteSpace: "nowrap", borderBottom: `1px solid ${colors.fill}`, borderLeft: `1px solid ${colors.fill}`,
                                width: "3%", position: "sticky", top: 0, zIndex: 2, backgroundColor: colors.bg.header,
                            }}><MoreHorizontal size={14} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Add row */}
                        <tr onClick={onOpenNew}
                            style={{ cursor: "pointer", transition: "background-color 0.12s", height: "51px" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.fill}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                            <td style={{ ...cellLabel, color: colors.fg.dim, opacity: 0.5 }}>
                                <span style={{ transition: "opacity 0.12s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}>
                                    + Agregar concepto
                                </span>
                            </td>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <td key={i} style={{ ...cellValue, color: "rgba(255,255,255,0.1)" }}>—</td>
                            ))}
                            <td style={{ ...cellValue, textAlign: "center", color: "rgba(255,255,255,0.1)" }}>—</td>
                        </tr>

                        {inputs.map((input) => {
                            const isIncome = input.type === "income";
                            return (
                                <tr key={input.id}
                                    style={{ backgroundColor: "transparent", transition: "background-color 0.12s", height: "51px" }}
                                    onMouseEnter={(e) => { onSetHoveredRow(input.id); e.currentTarget.style.backgroundColor = colors.bg.hover; }}
                                    onMouseLeave={(e) => { onSetHoveredRow(null); e.currentTarget.style.backgroundColor = "transparent"; }}>
                                    <td style={{ ...cellLabel, boxShadow: editingCell?.id === input.id ? `inset 3px 0 0 0 ${colors.accent.cyan}` : (hoveredRow === input.id ? `inset 3px 0 0 0 rgba(92, 231, 240, 0.25)` : `inset 3px 0 0 0 transparent`) }}>
                                        {editingCell?.id === input.id && editingCell?.key === "description" ? (
                                            <div>
                                                <input value={editCellVal} onChange={(e) => onEditCellValChange(e.target.value)}
                                                    onBlur={onSaveCellEdit}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") onSaveCellEdit();
                                                        if (e.key === "Escape") onCancelCellEdit();
                                                    }}
                                                    autoFocus
                                                    style={{ width: "100%", padding: 0, border: "none", backgroundColor: "transparent", color: colors.fg.base, fontSize: fonts.table.body, fontFamily: fonts.family.text, outline: "none", cursor: "text" }} />
                                            </div>
                                        ) : (
                                            <>
                                                <Tooltip content={input.description}>
                                                    <div style={{ color: colors.fg.base, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} onDoubleClick={() => onStartCellEdit(input.id, "description", input.description)}>
                                                        {input.description}
                                                    </div>
                                                </Tooltip>
                                                <div style={{ fontSize: fonts.size.xs, marginTop: "2px" }}>
                                                    <span style={{ color: isIncome ? colors.accent.green : colors.accent.red, cursor: "pointer" }}
                                                        onDoubleClick={() => {
                                                            const newType = input.type === "income" ? "expense" : "income";
                                                            onSaveFieldEdit(input.id, "type", newType);
                                                        }}>
                                                        {isIncome ? "↑" : "↓"} {isIncome ? "Ingreso" : "Egreso"}
                                                    </span>
                                                    <span style={{ color: colors.fg.dim }}> · </span>
                                                    <span style={{ color: input.currency === "ARS" ? colors.accent.cyan : colors.accent.green, cursor: "pointer" }}
                                                        onDoubleClick={() => {
                                                            const newCurrency = input.currency === "USD" ? "ARS" : "USD";
                                                            onSaveFieldEdit(input.id, "currency", newCurrency);
                                                        }}>
                                                        {input.currency}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                    {MONTH_KEYS.map((key, mi) => {
                                        const val = input[key] as string | undefined;
const isCellEditing = editingCell?.id === input.id && editingCell?.key === key;
                                         const hasVal = val && parseFloat(val) > 0;
                                        const cellClr = hasVal ? colors.fg.base : "rgba(255,255,255,0.1)";
                                        return (
                                            <td key={mi} style={{ ...cellValue, color: cellClr, cursor: "pointer" }} onDoubleClick={() => !isCellEditing && onStartCellEdit(input.id, key, val || "")}>
                                                {isCellEditing ? (
                                                    <input value={editCellVal} onChange={(e) => onEditCellValChange(e.target.value)}
                                                        onBlur={onSaveCellEdit}
                                                        onKeyDown={(e) => { if (e.key === "Enter") onSaveCellEdit(); if (e.key === "Escape") onCancelCellEdit(); }}
                                                        autoFocus
                                                        style={{ width: "100%", padding: 0, border: "none", backgroundColor: "transparent", color: colors.fg.base, fontSize: fonts.table.amount, fontFamily: fonts.family.text, textAlign: "right", outline: "none", cursor: "text" }} />
                                                ) : hasVal ? (
                                                    <Tooltip content={fmt(val)}>
                                                        <span className="selectable" style={{ display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{fmt(val)}</span>
                                                    </Tooltip>
                                                ) : (
                                                    <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ ...cellValue, textAlign: "center" }}>
                                        <button onClick={() => onSetDeleteConfirm({ id: input.id, desc: input.description })}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: colors.fg.dim, padding: "2px", display: "flex", margin: "0 auto", transition: "color 0.15s" }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = colors.fg.base}
                                            onMouseLeave={(e) => e.currentTarget.style.color = colors.fg.dim}>
                                            <X size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                    </tbody>
                </table>

                {/* Fixed aggregates */}
                {months.length > 0 && (
                    <div style={{ position: "sticky", bottom: 0, backgroundColor: colors.bg.header, borderTop: `2px solid ${colors.border}` }}>
                        <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "collapse", fontSize: fonts.size.sm, tableLayout: "fixed" }}>
                            <tbody>
                                {[
                                    { key: "income" as const, label: "Ingreso Acumulado", clr: colors.accent.green },
                                    { key: "expense" as const, label: "Egreso Acumulado", clr: colors.accent.red },
                                    { key: "savings" as const, label: "Ahorro Acumulado", clr: colors.accent.cyan },
                                    { key: "capital" as const, label: "Capital Acumulado", clr: colors.accent.blue },
                                ].map((row) => (
<tr key={row.key} style={{ height: "35px" }}>
                                         <td style={{ ...cellLabel, color: row.clr, fontWeight: fonts.weight.semibold, boxShadow: `inset 3px 0 0 0 ${row.clr}40`, width: "13%", height: "35px", boxSizing: "border-box", fontSize: fonts.size.sm }}>
                                            {row.label}{" "}
                                            <span style={{
                                                fontSize: fonts.size.xs,
                                                color: row.clr,
                                                border: `1px solid ${row.clr}40`,
                                                padding: "1px 6px",
                                                borderRadius: "4px",
                                                verticalAlign: "middle",
                                                opacity: 0.75,
                                            }}>USD</span>
                                        </td>
                                        {months.map((m) => {
                                            const val = m[row.key] as string | undefined;
                                            const numVal = val ? parseFloat(val) : 0;
                                            const hasVal = val && numVal !== 0;
                                            const showClr = numVal < 0 ? colors.accent.red : (hasVal ? row.clr : "rgba(255,255,255,0.1)");
                                            return (
                                                <td key={m.month} style={{ ...cellValue, color: showClr, fontWeight: 500, width: "7%", height: "35px", boxSizing: "border-box" }}>
                                                    {hasVal ? (
                                                        <Tooltip content={fmt(val)}>
                                                            <span className="selectable" style={{ display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{fmt(val)}</span>
                                                        </Tooltip>
                                                    ) : (
                                                        <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ ...cellValue, textAlign: "center", width: "3%", height: "35px", boxSizing: "border-box" }}></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => onSetDeleteConfirm(null)}
                    onConfirm={() => { onDelete(deleteConfirm.id); onSetDeleteConfirm(null); }}
                    title="Eliminar concepto"
                    description="¿Eliminar este concepto? Esta acción no se puede deshacer."
                    confirmLabel="Eliminar"
                    destructive
                />
            )}
        </div>
    );
}