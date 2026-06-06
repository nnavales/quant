import { formatNumber } from "@/utils/format";
import { PlanningGoal, PlanningMonthData } from "@/api_client/types";
import { radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { RefreshCw } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { truncate } from "@/styles/layout";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_KEYS_MAP = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// CSS grid columns — replaces the old <colgroup>/table-layout:fixed. Div rows with a
// hard height can't be stretched by the WebKit table row-height-distribution bug.
const GRID_COLS = `13fr ${"7fr ".repeat(12)}44px`;

const STYLES = `
.pp-grid-header,.pp-grid-row,.pp-resumen{display:grid;grid-template-columns:${GRID_COLS};box-sizing:border-box}
.pp-grid-header{height:34px;position:sticky;top:0;z-index:2}
.pp-grid-header>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 12px;border-bottom:1px solid ${colors.border};border-left:1px solid ${colors.border};font-weight:${fonts.weight.medium};text-transform:uppercase;font-size:${fonts.size.xs2};letter-spacing:.06em;color:${colors.fg.dim};white-space:nowrap;background:${colors.bg.elevated};justify-content:flex-end}
.pp-grid-header>div:first-child{border-left:none;justify-content:flex-start}
.pp-grid-row{height:34px;background:transparent}
.pp-grid-row>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 12px;border-bottom:1px solid ${colors.border};border-left:1px solid ${colors.border};justify-content:flex-end}
.pp-grid-row>div:first-child{border-left:none;justify-content:flex-start}
.pp-grid-foot{position:sticky;bottom:0;z-index:2;border-top:2px solid ${colors.border}}
.pp-resumen{height:34px}
.pp-resumen>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 12px;background:${colors.bg.elevated};justify-content:flex-end}
.pp-resumen>div:not(:first-child){box-shadow:inset 1px 0 0 0 ${colors.border}}
.pp-resumen>div:first-child{justify-content:flex-start}
.pp-resumen+.pp-resumen>div{box-shadow:inset 0 1px 0 0 ${colors.border}}
.pp-resumen+.pp-resumen>div:not(:first-child){box-shadow:inset 1px 0 0 0 ${colors.border},inset 0 1px 0 0 ${colors.border}}
.pp-opt{opacity:0;transition:opacity .15s}
.pp-grid-row:hover .pp-opt{opacity:1}
`;

const fmt = (val: string | undefined | null) =>
    val && !isNaN(parseFloat(val)) ? formatNumber(parseFloat(val), { trim: true }) : "";

const valueStyle: React.CSSProperties = { flex: "1 1 0", minWidth: 0, overflow: "hidden", display: "block" };
const valueSpanStyle: React.CSSProperties = { ...truncate, display: "block", textAlign: "right" };

interface PlanningPlanTableProps {
    goals: PlanningGoal[];
    months: PlanningMonthData[];
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
    months,
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

    const ResumenRow = ({
        label,
        labelColor,
        monthKey,
    }: {
        label: string;
        labelColor: string;
        monthKey: "savings" | "capital";
    }) => (
        <div className="pp-resumen">
            <div style={{
                color: labelColor,
                fontSize: fonts.size.xs2,
                fontWeight: fonts.weight.semibold,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
            }}>
                {label}
                <span style={{ color: colors.fg.dim, fontWeight: fonts.weight.regular, marginLeft: "6px" }}>· USD</span>
            </div>
            {months.map((m) => {
                const val = m[monthKey] as string | undefined;
                const n = val ? parseFloat(val) : 0;
                const hasVal = n !== 0;
                const showClr = n < 0 ? colors.accent.red : labelColor;
                return (
                    <div key={m.month}
                        style={{
                            fontSize: fonts.size.sm,
                            color: hasVal ? showClr : "transparent",
                            fontWeight: fonts.weight.semibold,
                        }}
                    >
                        {hasVal && (
                            <Tooltip content={fmt(val)} style={valueStyle}>
                                <span className="selectable" style={valueSpanStyle}>{fmt(val)}</span>
                            </Tooltip>
                        )}
                    </div>
                );
            })}
            <div />
        </div>
    );

    return (
        <div>
            <style>{STYLES}</style>

            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, overflow: "hidden" }}>
                <div style={{ overflow: "auto", maxHeight: "calc(95dvh - 320px)" }}>
                    <div style={{ minWidth: "1050px" }}>
                        <div className="pp-grid-header">
                            <div style={{ justifyContent: "flex-start" }}>Métrica</div>
                            {MONTHS.map((m) => <div key={m}>{m}</div>)}
                            <div style={{ justifyContent: "center", padding: "0 4px", fontSize: fonts.size.sm, letterSpacing: "0.1em" }}>
                                <Tooltip content="Doble click para editar las celdas" alwaysShow>···</Tooltip>
                            </div>
                        </div>

                        {rows.map((row) => {
                            const goalMonths = row.goal
                                ? MONTH_KEYS_MAP.map((k) => (row.goal as any)[k] as string | undefined)
                                : Array(12).fill(undefined);
                            const goalId = row.goal?.id ?? null;

                            return (
                                <div key={row.key} className="pp-grid-row"
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bg.hover; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}>
                                    <div style={{
                                        color: row.clr,
                                        fontSize: fonts.size.xs2,
                                        fontWeight: fonts.weight.semibold,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                    }}>
                                        {row.label}
                                        <span style={{ color: colors.fg.dim, fontWeight: fonts.weight.regular, marginLeft: "6px" }}>· USD</span>
                                    </div>
                                    {MONTHS.map((m, mi) => {
                                        const val = goalMonths[mi];
                                        const isCellEditing = editingCell?.metric === row.key && editingCell?.key === MONTH_KEYS_MAP[mi];
                                        const hasVal = val && parseFloat(val) > 0;
                                        return (
                                            <div key={m}
                                                onDoubleClick={() => !isCellEditing && onStartCellEdit(row.key, MONTH_KEYS_MAP[mi], val || "")}
                                                style={{
                                                    fontSize: fonts.size.sm2,
                                                    fontWeight: fonts.weight.medium,
                                                    color: hasVal ? row.clr : "transparent",
                                                    cursor: "pointer",
                                                }}>
                                                {isCellEditing ? (
                                                    <input value={editCellVal} onChange={(e) => onEditCellValChange(e.target.value)}
                                                        onBlur={onSaveCellEdit}
                                                        onKeyDown={(e) => { if (e.key === "Enter") onSaveCellEdit(); if (e.key === "Escape") onCancelCellEdit(); }}
                                                        autoFocus
                                                        style={{ width: "100%", padding: 0, border: "none", background: "transparent", color: colors.fg.base, fontSize: fonts.size.sm2, fontWeight: fonts.weight.medium, fontFamily: fonts.family, textAlign: "right", outline: "none" }} />
                                                ) : hasVal ? (
                                                    <Tooltip content={fmt(val)} style={valueStyle}>
                                                        <span className="selectable" style={valueSpanStyle}>{fmt(val)}</span>
                                                    </Tooltip>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                    <div style={{ justifyContent: "center", padding: "0 4px" }}>
                                        {goalId && (
                                            <span
                                                className="pp-opt"
                                                onClick={() => onSetDeleteConfirm({ id: goalId, desc: row.label })}
                                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.fg.dim, transition: "color 0.15s, opacity 0.15s" }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = colors.fg.base}
                                                onMouseLeave={(e) => e.currentTarget.style.color = colors.fg.dim}>
                                                <RefreshCw size={13.5} strokeWidth={2.5} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {months.length > 0 && (
                            <div className="pp-grid-foot">
                                <ResumenRow label="Ahorro Objetivo" labelColor={colors.accent.cyan} monthKey="savings" />
                                <ResumenRow label="Capital Objetivo" labelColor={colors.accent.blue} monthKey="capital" />
                            </div>
                        )}
                    </div>
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
