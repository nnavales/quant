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

const numCell: React.CSSProperties = {
    verticalAlign: "middle",
    padding: "0 12px",
    textAlign: "right",
    fontSize: fonts.size.sm3,
    fontFamily: fonts.family,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "0",
    boxSizing: "border-box",
};

const ColGroup = () => (
    <colgroup>
        <col style={{ width: "13%" }} />
        {MONTHS.map((m) => <col key={m} style={{ width: "7%" }} />)}
        <col style={{ width: "3%" }} />
    </colgroup>
);

const fmt = (val: string | undefined | null) =>
    val && !isNaN(parseFloat(val)) ? formatNumber(parseFloat(val), { trim: true }) : "";

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
    }) => {
        const bg = colors.bg.elevated;
        return (
            <tr style={{ height: "33px" }}>
                <td style={{
                    verticalAlign: "middle",
                    padding: "0 12px",
                    overflow: "hidden",
                    maxWidth: "0",
                    boxSizing: "border-box",
                    color: labelColor,
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.semibold,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    backgroundColor: bg,
                }}>
                    {label}
                    <span style={{ color: colors.fg.dim, fontWeight: fonts.weight.regular, marginLeft: "6px" }}>· USD</span>
                </td>
                {months.map((m) => {
                    const val = m[monthKey] as string | undefined;
                    const n = val ? parseFloat(val) : 0;
                    const hasVal = n !== 0;
                    const showClr = n < 0 ? colors.accent.red : labelColor;
                    return (
                        <td key={m.month}
                            style={{
                                ...numCell,
                                fontSize: fonts.size.sm,
                                boxShadow: `inset 1px 0 0 0 ${colors.border}`,
                                color: hasVal ? showClr : "transparent",
                                fontWeight: fonts.weight.semibold,
                                backgroundColor: bg,
                            }}
                        >
                            {hasVal && (
                                <Tooltip content={fmt(val)}>
                                    <span className="selectable" style={{...truncate, display: "block"}}>{fmt(val)}</span>
                                </Tooltip>
                            )}
                        </td>
                    );
                })}
                <td style={{ backgroundColor: bg, boxShadow: `inset 1px 0 0 0 ${colors.border}` }} />
            </tr>
        );
    };

    return (
        <div>

            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, overflow: "hidden" }}>
                <div style={{ overflow: "auto", maxHeight: "calc(95dvh - 320px)" }}>
                    <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
                        <ColGroup />
                        <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                            <tr style={{ height: "36px" }}>
                                <th style={{
                                    padding: "0 12px", textAlign: "left",
                                    fontWeight: fonts.weight.medium, color: colors.fg.dim,
                                    fontSize: fonts.size.xs2, textTransform: "uppercase", letterSpacing: "0.06em",
                                    whiteSpace: "nowrap", borderBottom: `1px solid ${colors.border}`,
                                    backgroundColor: colors.bg.elevated,
                                }}>Métrica</th>
                                {MONTHS.map((m) => (
                                    <th key={m} style={{
                                        padding: "0 12px", textAlign: "right",
                                        fontWeight: fonts.weight.medium, color: colors.fg.dim,
                                        fontSize: fonts.size.xs2, textTransform: "uppercase", letterSpacing: "0.06em",
                                        whiteSpace: "nowrap", borderBottom: `1px solid ${colors.border}`,
                                        borderLeft: `1px solid ${colors.fill}`,
                                        backgroundColor: colors.bg.elevated,
                                    }}>{m}</th>
                                ))}
                                <th style={{
                                    borderBottom: `1px solid ${colors.border}`, borderLeft: `1px solid ${colors.fill}`,
                                    backgroundColor: colors.bg.elevated, textAlign: "center", padding: "0 4px",
                                    color: colors.fg.dim, fontSize: fonts.size.sm, letterSpacing: "0.1em",
                                }}>
                                    <Tooltip content="Doble click para editar las celdas" alwaysShow>···</Tooltip>
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
                                        style={{ height: "36px" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bg.hover; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}>
                                        <td style={{
                                            verticalAlign: "middle", padding: "0 12px",
                                            overflow: "hidden", maxWidth: "0", boxSizing: "border-box",
                                            borderBottom: `1px solid ${colors.fill}`,
                                            color: row.clr,
                                            fontSize: fonts.size.xs2,
                                            fontWeight: fonts.weight.semibold,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                        }}>
                                            {row.label}
                                            <span style={{ color: colors.fg.dim, fontWeight: fonts.weight.regular, marginLeft: "6px" }}>· USD</span>
                                        </td>
                                        {MONTHS.map((m, mi) => {
                                            const val = goalMonths[mi];
                                            const isCellEditing = editingCell?.metric === row.key && editingCell?.key === MONTH_KEYS_MAP[mi];
                                            const hasVal = val && parseFloat(val) > 0;
                                            return (
                                                <td key={m}
                                                    onDoubleClick={() => !isCellEditing && onStartCellEdit(row.key, MONTH_KEYS_MAP[mi], val || "")}
                                                    style={{
                                                        ...numCell,
                                                        fontSize: fonts.size.sm2,
                                                        fontWeight: fonts.weight.medium,
                                                        borderBottom: `1px solid ${colors.fill}`,
                                                        borderLeft: `1px solid ${colors.fill}`,
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
                                                        <Tooltip content={fmt(val)}>
                                                            <span className="selectable" style={{...truncate, display: "block"}}>{fmt(val)}</span>
                                                        </Tooltip>
                                                    ) : null}
                                                </td>
                                            );
                                        })}
                                        <td style={{
                                            ...numCell,
                                            borderBottom: `1px solid ${colors.fill}`,
                                            borderLeft: `1px solid ${colors.fill}`,
                                            textAlign: "center",
                                            padding: "0 4px",
                                        }}>
                                            {goalId && (
                                                <span
                                                    onClick={() => onSetDeleteConfirm({ id: goalId, desc: row.label })}
                                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.fg.dim, transition: "color 0.15s" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = colors.fg.base}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = colors.fg.dim}>
                                                    <RefreshCw size={13.5} strokeWidth={1.5} />
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {months.length > 0 && (
                            <tfoot style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
                                <tr style={{ height: "2px" }}>
                                    <td colSpan={14} style={{ padding: 0, backgroundColor: colors.border }} />
                                </tr>
                                <ResumenRow label="Ahorro Objetivo" labelColor={colors.accent.cyan} monthKey="savings" />
                                <tr style={{ height: "1px" }}>
                                    <td colSpan={14} style={{ padding: 0, backgroundColor: colors.border }} />
                                </tr>
                                <ResumenRow label="Capital Objetivo" labelColor={colors.accent.blue} monthKey="capital" />
                            </tfoot>
                        )}
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
