import { PlanningGoal } from "@/api_client/types";
import { radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { RefreshCw, MoreHorizontal } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const MONTH_KEYS_MAP = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

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

interface PlanningPlanTableProps {
    goals: PlanningGoal[];
    editingCell: { id: string | null; key: string; metric: "income" | "expense" } | null;
    editCellVal: string;
    onEditCellValChange: (val: string) => void;
    onStartCellEdit: (metric: "income" | "expense", key: string, value: string | undefined) => void;
    onSaveCellEdit: () => void;
    onCancelCellEdit: () => void;
    deleteConfirm: { id: string; desc: string } | null;
    onSetDeleteConfirm: (v: { id: string; desc: string } | null) => void;
    onDelete: (id: string) => void;
}

export function PlanningPlanTable({
    goals,
    editingCell,
    editCellVal,
    onEditCellValChange,
    onStartCellEdit,
    onSaveCellEdit,
    onCancelCellEdit,
    deleteConfirm,
    onSetDeleteConfirm,
    onDelete,
}: PlanningPlanTableProps) {
    const incomeGoal = goals.find((g) => g.metric === "income");
    const expenseGoal = goals.find((g) => g.metric === "expense");

    const rows = [
        { key: "income" as const, goal: incomeGoal, label: "Ingreso Objetivo", clr: colors.accent.green },
        { key: "expense" as const, goal: expenseGoal, label: "Egreso Objetivo", clr: colors.accent.red },
    ];

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
                            }}>Metrica</th>
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
                            }}>
                                                 <MoreHorizontal size={14} />
                                             </th>
                        </tr>
                    </thead>
                    <tbody>
{rows.map((row) => {
                             const goalMonths = row.goal
                                 ? MONTH_KEYS_MAP.map((k) => (row.goal as any)[k] as string | undefined)
                                 : Array(12).fill(undefined);
                             const goalId = row.goal?.id ?? null;

                             return (
                                 <tr key={row.key}
                                     style={{ backgroundColor: "transparent", transition: "background-color 0.12s", height: "51px" }}
                                     onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bg.hover; }}
                                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                                     <td style={{ ...cellLabel, color: colors.fg.base, fontWeight: fonts.weight.semibold, borderLeft: `3px solid ${row.clr}40`, width: "13%", boxSizing: "border-box", fontSize: fonts.size.sm }}>
                                         {row.label}{" "}
                                         <span style={{
                                             fontSize: fonts.size.xs,
                                             color: colors.fg.dim,
                                             border: `1px solid ${colors.fill}`,
                                             padding: "1px 6px",
                                             borderRadius: "4px",
                                             verticalAlign: "middle",
                                             opacity: 0.75,
                                         }}>USD</span>
                                     </td>
                                    {MONTHS.map((m, mi) => {
                                        const val = goalMonths[mi];
                                        const isCellEditing = editingCell?.metric === row.key && editingCell?.key === MONTH_KEYS_MAP[mi];
                                        const hasVal = val && parseFloat(val) > 0;
                                        const cellClr = hasVal ? row.clr : "rgba(255,255,255,0.1)";
                                        return (
                                            <td key={m} style={{ ...cellValue, color: cellClr, cursor: "pointer", width: "7%", height: "51px", boxSizing: "border-box" }} onDoubleClick={() => !isCellEditing && onStartCellEdit(row.key, MONTH_KEYS_MAP[mi], val || "")}>
                                                {isCellEditing ? (
                                                    <input value={editCellVal} onChange={(e) => onEditCellValChange(e.target.value)}
                                                        onBlur={onSaveCellEdit}
                                                        onKeyDown={(e) => { if (e.key === "Enter") onSaveCellEdit(); if (e.key === "Escape") onCancelCellEdit(); }}
                                                        autoFocus
                                                        style={{ width: "100%", padding: 0, border: "none", backgroundColor: "transparent", color: colors.fg.base, fontSize: fonts.table.amount, fontFamily: fonts.family.text, textAlign: "right", outline: "none", cursor: "text" }} />
                                                ) : hasVal ? (
                                                    <Tooltip content={fmt(val)}>
                                                        <span style={{ display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{fmt(val)}</span>
                                                    </Tooltip>
                                                ) : (
                                                    <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>
                                                )}
                                            </td>
                                        );
                                    })}
<td style={{ ...cellValue, textAlign: "center", width: "3%", height: "51px", boxSizing: "border-box" }}>
                                         {goalId && (
                                             <button onClick={() => onSetDeleteConfirm({ id: goalId, desc: row.label })}
                                                 style={{ background: "none", border: "none", cursor: "pointer", color: colors.fg.dim, padding: "2px", display: "flex", margin: "0 auto", transition: "color 0.15s" }}
                                                 onMouseEnter={(e) => e.currentTarget.style.color = colors.fg.base}
                                                 onMouseLeave={(e) => e.currentTarget.style.color = colors.fg.dim}>
                                                 <RefreshCw size={14} />
                                             </button>
                                         )}
                                     </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Fixed aggregates footer */}
                <div style={{ position: "sticky", bottom: 0, backgroundColor: colors.bg.header, borderTop: `2px solid ${colors.border}` }}>
                    <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "collapse", fontSize: fonts.size.sm, tableLayout: "fixed" }}>
                        <tbody>
                            {[
                                { key: "savings" as const, label: "Ahorro Objetivo", clr: colors.accent.cyan },
                                { key: "capital" as const, label: "Capital Objetivo", clr: colors.accent.blue },
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
                                    {MONTHS.map((m, mi) => {
                                        const incVal = incomeGoal ? (incomeGoal as any)[MONTH_KEYS_MAP[mi]] as string | undefined : undefined;
                                        const expVal = expenseGoal ? (expenseGoal as any)[MONTH_KEYS_MAP[mi]] as string | undefined : undefined;
const numInc = incVal ? parseFloat(incVal) : 0;
                                         const numExp = expVal ? parseFloat(expVal) : 0;
                                         const diff = numInc - numExp;
                                         const val = diff !== 0 ? diff.toString() : undefined;
                                         const showClr = val && parseFloat(val) < 0 ? colors.accent.red : (val ? row.clr : "rgba(255,255,255,0.1)");
                                        return (
                                            <td key={m} style={{ ...cellValue, color: showClr, fontWeight: 500, width: "7%", height: "35px", boxSizing: "border-box" }}>
                                                {val ? (
                                                    <Tooltip content={fmt(val)}>
                                                        <span style={{ display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{fmt(val)}</span>
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
            </div>

{deleteConfirm && (
                 <ConfirmDialog
                     isOpen={true}
                     onClose={() => onSetDeleteConfirm(null)}
                     onConfirm={() => { onDelete(deleteConfirm.id); onSetDeleteConfirm(null); }}
                     title="Limpiar objetivo"
                     description={`¿Limpiar la fila "${deleteConfirm.desc}"? Se eliminará el objetivo guardado y la fila quedará vacía (cero en todos los meses).`}
                     confirmLabel="Limpiar"
                     destructive
                 />
            )}
        </div>
    );
}