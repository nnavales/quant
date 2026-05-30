import { useState } from "react";
import { formatNumber } from "@/utils/format";
import { PlanningInput, PlanningMonthData } from "@/api_client/types";
import { radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { flexRow, truncate } from "@/styles/layout";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_KEYS: (keyof PlanningInput)[] = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const fmt = (val: string | undefined | null) =>
    val && !isNaN(parseFloat(val)) ? formatNumber(parseFloat(val), { trim: true }) : "";

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
        <col style={{ width: "11%" }} />
        <col style={{ width: "4%" }} />
        <col style={{ width: "3%" }} />
        {MONTHS.map((m) => <col key={m} style={{ width: "6%" }} />)}
        <col style={{ width: "44px" }} />
    </colgroup>
);

interface InputRowProps {
    input: PlanningInput;
    editingCell: { id: string; key: string } | null;
    editCellVal: string;
    onEditCellValChange: (val: string) => void;
    onStartCellEdit: (id: string, key: string, value: string | undefined) => void;
    onSaveCellEdit: () => void;
    onCancelCellEdit: () => void;
    onSaveFieldEdit: (id: string, key: string, value: string) => void;
    isHovered: boolean;
    onHoverEnter: (id: string) => void;
    onHoverLeave: () => void;
    onSetDeleteConfirm: (v: { id: string; desc: string } | null) => void;
}

function InputRow({
    input, editingCell, editCellVal, onEditCellValChange,
    onStartCellEdit, onSaveCellEdit, onCancelCellEdit, onSaveFieldEdit,
    isHovered, onHoverEnter, onHoverLeave, onSetDeleteConfirm,
}: InputRowProps) {
    const isEditing = editingCell?.id === input.id;
    const isExpense = input.type === "expense";

    return (
        <tr
            style={{ height: "36px" }}
            onMouseEnter={(e) => { onHoverEnter(input.id); e.currentTarget.style.backgroundColor = colors.bg.hover; }}
            onMouseLeave={(e) => { onHoverLeave(); e.currentTarget.style.backgroundColor = ""; }}>

            {/* Description */}
            <td style={{
                verticalAlign: "middle", padding: "0 12px",
                overflow: "hidden", maxWidth: "0", boxSizing: "border-box",
                borderBottom: `1px solid ${colors.fill}`,
                boxShadow: isHovered ? `inset 3px 0 0 0 ${colors.accent.cyan}` : `inset 3px 0 0 0 transparent`,
                transition: "box-shadow 0.15s",
            }}>
                {isEditing && editingCell?.key === "description" ? (
                    <input
                        value={editCellVal}
                        onChange={(e) => onEditCellValChange(e.target.value)}
                        onBlur={onSaveCellEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") onSaveCellEdit(); if (e.key === "Escape") onCancelCellEdit(); }}
                        autoFocus
                        style={{ width: "100%", padding: 0, border: "none", background: "transparent", color: colors.fg.base, fontSize: fonts.size.sm2, fontWeight: fonts.weight.medium, fontFamily: fonts.family, outline: "none" }} />
                ) : (
                    <Tooltip content={input.description}>
                        <div
                            onDoubleClick={() => onStartCellEdit(input.id, "description", input.description)}
                            style={{...truncate, color: colors.fg.base, fontSize: fonts.size.sm2, fontWeight: fonts.weight.medium, cursor: "text"}}>
                            {input.description}
                        </div>
                    </Tooltip>
                )}
            </td>

            {/* Type */}
            <td style={{
                verticalAlign: "middle", padding: "0 12px",
                borderBottom: `1px solid ${colors.fill}`, borderLeft: `1px solid ${colors.fill}`,
                whiteSpace: "nowrap", textAlign: "center", cursor: "pointer",
            }}
                onDoubleClick={() => onSaveFieldEdit(input.id, "type", input.type === "income" ? "expense" : "income")}
                title="Doble clic para cambiar tipo">
                <span style={{
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.medium,
                    color: isExpense ? colors.accent.red : colors.accent.green,
                }}>
                    {isExpense ? "▼ EGR" : "▲ ING"}
                </span>
            </td>

            {/* Currency */}
            <td style={{
                verticalAlign: "middle", padding: "0 12px",
                borderBottom: `1px solid ${colors.fill}`, borderLeft: `1px solid ${colors.fill}`,
                whiteSpace: "nowrap", cursor: "pointer", textAlign: "center",
            }}
                onDoubleClick={() => onSaveFieldEdit(input.id, "currency", input.currency === "USD" ? "ARS" : "USD")}
                title="Doble clic para cambiar moneda">
                <span style={{
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.medium,
                    color: input.currency === "ARS" ? colors.accent.cyan : colors.accent.green,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                }}>
                    {input.currency}
                </span>
            </td>

            {MONTH_KEYS.map((key, mi) => {
                const val = input[key] as string | undefined;
                const isCellEditing = isEditing && editingCell?.key === key;
                const hasVal = !!val && parseFloat(val) > 0;
                return (
                    <td key={mi}
                        onDoubleClick={() => !isCellEditing && onStartCellEdit(input.id, key, hasVal ? val : "")}
                        style={{
                            ...numCell,
                            fontSize: fonts.size.sm2,
                            fontWeight: fonts.weight.medium,
                            borderBottom: `1px solid ${colors.fill}`,
                            borderLeft: `1px solid ${colors.fill}`,
                            color: hasVal ? colors.fg.base : "transparent",
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
                <div style={{ ...flexRow, justifyContent: "center", opacity: isHovered ? 1 : 0, transition: "opacity 0.15s" }}>
                    <Button variant="icon" title="Eliminar" style={{ width: 20, height: 20 }} onClick={() => onSetDeleteConfirm({ id: input.id, desc: input.description })}>
                        <Trash2 size={13.5} strokeWidth={1.5} />
                    </Button>
                </div>
            </td>
        </tr>
    );
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
    deleteConfirm: { id: string; desc: string } | null;
    onSetDeleteConfirm: (v: { id: string; desc: string } | null) => void;
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
    deleteConfirm,
    onSetDeleteConfirm,
    onDelete,
}: PlanningForecastTableProps) {
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    const rowProps = {
        editingCell, editCellVal, onEditCellValChange,
        onStartCellEdit, onSaveCellEdit, onCancelCellEdit,
        onSaveFieldEdit, onSetDeleteConfirm,
        onHoverEnter: setHoveredRow,
        onHoverLeave: () => setHoveredRow(null),
    };

    // ─── Resumen footer row ───────────────────────────────────────────────────
    const ResumenRow = ({
        label,
        labelColor,
        monthKey,
    }: {
        label: string;
        labelColor: string;
        monthKey: "income" | "expense" | "savings" | "capital";
    }) => {
        const bg = colors.bg.elevated;
        return (
            <tr style={{ height: "33px" }}>
                {/* Concepto */}
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
                {/* Tipo */}
                <td style={{ backgroundColor: bg }} />
                {/* Moneda */}
                <td style={{ backgroundColor: bg }} />
                {months.map((m) => {
                    const val = m[monthKey] as string | undefined;
                    const n = val ? parseFloat(val) : 0;
                    const hasVal = n !== 0;
                    return (
                        <td key={m.month}
                            style={{
                                ...numCell,
                                fontSize: fonts.size.sm,
                                boxShadow: `inset 1px 0 0 0 ${colors.border}`,
                                color: hasVal ? colors.fg.base : "transparent",
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

            {/* ── Single table card ── */}
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, overflow: "hidden" }}>
                <div style={{ overflow: "auto", maxHeight: "calc(95dvh - 320px)" }}>
                    <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
                        <ColGroup />
                        <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                            <tr style={{ height: "36px" }}>
                                {(["Concepto", "Tipo", "Mon."] as const).map((label, i) => (
                                    <th key={label} style={{
                                        padding: "0 12px", textAlign: i === 0 ? "left" : "center",
                                        fontWeight: fonts.weight.medium, color: colors.fg.dim,
                                        fontSize: fonts.size.xs2, textTransform: "uppercase", letterSpacing: "0.06em",
                                        whiteSpace: "nowrap", borderBottom: `1px solid ${colors.border}`,
                                        borderLeft: i > 0 ? `1px solid ${colors.fill}` : undefined,
                                        backgroundColor: colors.bg.elevated,
                                    }}>{label}</th>
                                ))}
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
                            {inputs.map((input) => (
                                <InputRow key={input.id} input={input} isHovered={hoveredRow === input.id} {...rowProps} />
                            ))}
                        </tbody>
                        {months.length > 0 && (
                            <tfoot style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
                                <tr style={{ height: "2px" }}>
                                    <td colSpan={16} style={{ padding: 0, backgroundColor: colors.border }} />
                                </tr>
                                <ResumenRow label="Ahorro del mes" labelColor={colors.accent.cyan} monthKey="savings" />
                                <tr style={{ height: "1px" }}>
                                    <td colSpan={16} style={{ padding: 0, backgroundColor: colors.border }} />
                                </tr>
                                <ResumenRow label="Capital acumulado" labelColor={colors.accent.blue} monthKey="capital" />
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
                    title="Eliminar concepto"
                    description="¿Eliminar este concepto? Esta acción no se puede deshacer."
                    confirmLabel="Eliminar"
                    destructive
                />
            )}
        </div>
    );
}
