import { useState, useRef, useLayoutEffect, useCallback } from "react";
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

// CSS grid columns — replaces the old <colgroup>/table-layout:fixed. Div rows with a
// hard height can't be stretched by the WebKit table row-height-distribution bug.
const GRID_COLS = `11fr 4fr 3fr ${"6fr ".repeat(12)}44px`;

const STYLES = `
.pf-grid-header,.pf-grid-row,.pf-resumen{display:grid;grid-template-columns:${GRID_COLS};box-sizing:border-box}
.pf-grid-header{height:34px;position:sticky;top:0;z-index:2}
.pf-grid-header>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 12px;border-bottom:1px solid ${colors.border};border-left:1px solid ${colors.border};font-weight:${fonts.weight.medium};text-transform:uppercase;font-size:${fonts.size.xs2};letter-spacing:.06em;color:${colors.fg.dim};white-space:nowrap;background:${colors.bg.elevated};justify-content:flex-end}
.pf-grid-header>div:first-child{border-left:none;justify-content:flex-start}
.pf-grid-row{height:34px;background:transparent}
.pf-grid-row>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 12px;border-bottom:1px solid ${colors.border};border-left:1px solid ${colors.border};justify-content:flex-end}
.pf-grid-row>div:first-child{border-left:none;justify-content:flex-start}
.pf-grid-foot{position:sticky;bottom:0;z-index:2;border-top:2px solid ${colors.border}}
.pf-resumen{height:34px}
.pf-resumen>div{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 12px;background:${colors.bg.elevated};justify-content:flex-end}
.pf-resumen>div:nth-child(n+4){box-shadow:inset 1px 0 0 0 ${colors.border}}
.pf-resumen>div:first-child{justify-content:flex-start}
.pf-resumen+.pf-resumen>div{box-shadow:inset 0 1px 0 0 ${colors.border}}
.pf-resumen+.pf-resumen>div:nth-child(n+4){box-shadow:inset 1px 0 0 0 ${colors.border},inset 0 1px 0 0 ${colors.border}}
.pf-scroll::-webkit-scrollbar{width:8px;height:8px}
.pf-scroll::-webkit-scrollbar-track{background:transparent}
.pf-scroll::-webkit-scrollbar-thumb{background:${colors.fill};border-radius:4px}
`;

const fmt = (val: string | undefined | null) =>
    val && !isNaN(parseFloat(val)) ? formatNumber(parseFloat(val), { trim: true }) : "";

const valueStyle: React.CSSProperties = { flex: "1 1 0", minWidth: 0, overflow: "hidden", display: "block" };
const valueSpanStyle: React.CSSProperties = { ...truncate, display: "block", textAlign: "right" };

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
        <div className="pf-grid-row"
            onMouseEnter={(e) => { onHoverEnter(input.id); e.currentTarget.style.backgroundColor = colors.bg.hover; }}
            onMouseLeave={(e) => { onHoverLeave(); e.currentTarget.style.backgroundColor = ""; }}>

            {/* Description */}
            <div style={{
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
                    <Tooltip content={input.description} style={valueStyle}>
                        <div
                            onDoubleClick={() => onStartCellEdit(input.id, "description", input.description)}
                            style={{ ...truncate, color: colors.fg.base, fontSize: fonts.size.sm2, fontWeight: fonts.weight.medium, cursor: "text" }}>
                            {input.description}
                        </div>
                    </Tooltip>
                )}
            </div>

            {/* Type */}
            <div style={{ justifyContent: "center", cursor: "pointer" }}
                onDoubleClick={() => onSaveFieldEdit(input.id, "type", input.type === "income" ? "expense" : "income")}
                title="Doble clic para cambiar tipo">
                <span style={{
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.medium,
                    color: isExpense ? colors.accent.red : colors.accent.green,
                    whiteSpace: "nowrap",
                }}>
                    {isExpense ? "▼ EGR" : "▲ ING"}
                </span>
            </div>

            {/* Currency */}
            <div style={{ justifyContent: "center", cursor: "pointer" }}
                onDoubleClick={() => onSaveFieldEdit(input.id, "currency", input.currency === "USD" ? "ARS" : "USD")}
                title="Doble clic para cambiar moneda">
                <span style={{
                    fontSize: fonts.size.xs2,
                    fontWeight: fonts.weight.medium,
                    color: input.currency === "ARS" ? colors.accent.cyan : colors.accent.green,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                }}>
                    {input.currency}
                </span>
            </div>

            {MONTH_KEYS.map((key, mi) => {
                const val = input[key] as string | undefined;
                const isCellEditing = isEditing && editingCell?.key === key;
                const hasVal = !!val && parseFloat(val) > 0;
                return (
                    <div key={mi}
                        onDoubleClick={() => !isCellEditing && onStartCellEdit(input.id, key, hasVal ? val : "")}
                        style={{
                            fontSize: fonts.size.sm2,
                            fontWeight: fonts.weight.medium,
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
                            <Tooltip content={fmt(val)} style={valueStyle}>
                                <span className="selectable" style={valueSpanStyle}>{fmt(val)}</span>
                            </Tooltip>
                        ) : null}
                    </div>
                );
            })}

            <div style={{ justifyContent: "center", padding: "0 4px" }}>
                <div style={{ ...flexRow, justifyContent: "center", opacity: isHovered ? 1 : 0, transition: "opacity 0.15s" }}>
                    <Button variant="icon" title="Eliminar" style={{ width: 20, height: 20 }} onClick={() => onSetDeleteConfirm({ id: input.id, desc: input.description })}>
                        <Trash2 size={13.5} strokeWidth={2.5} />
                    </Button>
                </div>
            </div>
        </div>
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

    // Fill the space from the table's top down to the bottom of the viewport, then cap the
    // scroll area to a whole number of 34px rows so the bottom edge never cuts a row. Measured
    // against the viewport (not a parent's flex height) so it can't overflow the page, and uses
    // plain JS math (no CSS round()) so it works on any OS webview.
    const rootRef = useRef<HTMLDivElement>(null);
    const [maxH, setMaxH] = useState<number>();
    const footerPresent = months.length > 0;

    const recompute = useCallback(() => {
        const el = rootRef.current;
        // Skip while the tab is hidden (display:none → no offsetParent). Measuring then would
        // read a zero/full-height layout and cause a flash when the tab is first opened.
        if (!el || !el.offsetParent) return;
        const ROW = 34;
        const chrome = 34 + (footerPresent ? 70 : 0); // 34px sticky header + 70px sticky footer
        // Use 93% of the space from the table's top to the viewport bottom for breathing room.
        const avail = (window.innerHeight - el.getBoundingClientRect().top) * 0.93;
        const rows = Math.max(ROW, Math.floor((avail - chrome) / ROW) * ROW);
        setMaxH(chrome + rows);
    }, [footerPresent]);

    // Measure synchronously before every paint, so the snapped height is already correct on the
    // first frame the table becomes visible (no full-height flash). setMaxH bails when unchanged.
    useLayoutEffect(() => { recompute(); });

    // Re-measure on layout changes that don't re-render us: window resize and KPI/header height
    // changes (the parent is flex:1, so its box reflects those).
    useLayoutEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const ro = new ResizeObserver(recompute);
        if (el.parentElement) ro.observe(el.parentElement);
        window.addEventListener("resize", recompute);
        return () => { ro.disconnect(); window.removeEventListener("resize", recompute); };
    }, [recompute]);

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
    }) => (
        <div className="pf-resumen">
            {/* Concepto */}
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
            {/* Tipo */}
            <div />
            {/* Moneda */}
            <div />
            {months.map((m) => {
                const val = m[monthKey] as string | undefined;
                const n = val ? parseFloat(val) : 0;
                const hasVal = n !== 0;
                return (
                    <div key={m.month}
                        style={{
                            fontSize: fonts.size.sm,
                            color: hasVal ? colors.fg.base : "transparent",
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
        <div ref={rootRef}>
            <style>{STYLES}</style>

            {/* ── Single table card ── */}
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, overflow: "hidden" }}>
                <div className="pf-scroll" style={{ overflow: "auto", maxHeight: maxH }}>
                    <div style={{ minWidth: "1050px" }}>
                        <div className="pf-grid-header">
                            <div style={{ justifyContent: "flex-start" }}>Concepto</div>
                            <div style={{ justifyContent: "center" }}>Tipo</div>
                            <div style={{ justifyContent: "center" }}>Mon.</div>
                            {MONTHS.map((m) => <div key={m}>{m}</div>)}
                            <div style={{ justifyContent: "center", padding: "0 4px", fontSize: fonts.size.sm, letterSpacing: "0.1em" }}>
                                <Tooltip content="Doble click para editar las celdas" alwaysShow>···</Tooltip>
                            </div>
                        </div>

                        {inputs.map((input) => (
                            <InputRow key={input.id} input={input} isHovered={hoveredRow === input.id} {...rowProps} />
                        ))}

                        {months.length > 0 && (
                            <div className="pf-grid-foot">
                                <ResumenRow label="Ahorro del mes" labelColor={colors.accent.cyan} monthKey="savings" />
                                <ResumenRow label="Capital acumulado" labelColor={colors.accent.blue} monthKey="capital" />
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
                    title="Eliminar concepto"
                    description="¿Eliminar este concepto? Esta acción no se puede deshacer."
                    confirmLabel="Eliminar"
                    destructive
                />
            )}
        </div>
    );
}
