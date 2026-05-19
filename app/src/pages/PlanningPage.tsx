import { useState, useCallback } from "react";
import { usePlanningForecast, usePlanningPlan, useCreatePlanningInput, useUpdatePlanningInput, useDeletePlanningInput, useCreatePlanningGoal, useUpdatePlanningGoal, useDeletePlanningGoal, useGenerateGoals, usePlanningConfig, useUpdatePlanningConfig, useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate } from "@/hooks";
import type { PlanningInput } from "@/api_client/types";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Wallet, Settings2, LayoutGrid } from "lucide-react";
import { toast } from "@/utils/toast";
import { KPICard } from "@/components/KPICard";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PlanningForecastTable } from "@/components/PlanningForecastTable";
import { PlanningPlanTable } from "@/components/PlanningPlanTable";

type Tab = "forecast" | "plan";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const FULL_MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTH_KEYS: (keyof PlanningInput)[] = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function centsToNum(val: string | undefined | null): number | null {
    if (!val) return null;
    const n = parseInt(val, 10);
    if (isNaN(n) || n === 0) return null;
    return n;
}

export function PlanningPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const { data, isLoading } = usePlanningForecast(String(year));
    const { data: planData } = usePlanningPlan(String(year));

    const inputs = data?.inputs || [];
    const months = data?.months || [];

    // Forecast editing state
    const createInput = useCreatePlanningInput();
    const updateInput = useUpdatePlanningInput();
    const deleteInput = useDeletePlanningInput();

    const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
    const [editCellVal, setEditCellVal] = useState("");
    const [editOriginalVal, setEditOriginalVal] = useState("");

    const startCellEdit = useCallback((id: string, key: string, currentValue: string | undefined) => {
        setEditingCell({ id, key });
        const v = currentValue && currentValue !== "0" ? currentValue : "";
        setEditCellVal(v);
        setEditOriginalVal(v);
    }, []);

    const saveCellEdit = useCallback(() => {
        if (!editingCell) return;
        const val = editingCell.key === "description" ? (editCellVal.trim() || editOriginalVal) : (editCellVal || "0");
        if (editCellVal === editOriginalVal || val === editOriginalVal) {
            setEditingCell(null);
            setEditCellVal("");
            return;
        }
        const data = { [editingCell.key]: val };
        updateInput.mutate({ id: editingCell.id, data: data as Parameters<typeof updateInput.mutate>["0"]["data"] }, {
            onSuccess: () => toast("Concepto actualizado", "success"),
            onError: () => toast("Error al actualizar concepto", "error"),
        });
        setEditingCell(null);
        setEditCellVal("");
    }, [editingCell, editCellVal, editOriginalVal, updateInput]);

    const saveFieldEdit = useCallback((id: string, key: string, value: string) => {
        updateInput.mutate({ id, data: { [key]: value } as Parameters<typeof updateInput.mutate>["0"]["data"] }, {
            onSuccess: () => toast("Concepto actualizado", "success"),
            onError: () => toast("Error al actualizar concepto", "error"),
        });
    }, [updateInput]);

    const cancelCellEdit = useCallback(() => {
        setEditingCell(null);
        setEditCellVal("");
    }, []);

    // Plan editing state
    const createGoal = useCreatePlanningGoal();
    const updateGoal = useUpdatePlanningGoal();
    const deleteGoal = useDeletePlanningGoal();

    const [planEditingCell, setPlanEditingCell] = useState<{ id: string | null; key: string; metric: "income" | "expense" } | null>(null);
    const [planEditCellVal, setPlanEditCellVal] = useState("");
    const [planEditOriginalVal, setPlanEditOriginalVal] = useState("");

    const startPlanCellEdit = useCallback((metric: "income" | "expense", key: string, value: string | undefined) => {
        const goal = metric === "income"
            ? (planData?.goals || []).find((g) => g.metric === "income")
            : (planData?.goals || []).find((g) => g.metric === "expense");
        setPlanEditingCell({ id: goal?.id ?? null, key, metric });
        const v = value && value !== "0" ? value : "";
        setPlanEditCellVal(v);
        setPlanEditOriginalVal(v);
    }, [planData]);

    const savePlanCellEdit = useCallback(() => {
        if (!planEditingCell) return;
        const val = planEditCellVal || "0";
        if (planEditCellVal === planEditOriginalVal || val === planEditOriginalVal) {
            setPlanEditingCell(null);
            setPlanEditCellVal("");
            return;
        }
        const data = { [planEditingCell.key]: val };
        if (planEditingCell.id) {
            updateGoal.mutate({ id: planEditingCell.id, data: data as Parameters<typeof updateGoal.mutate>["0"]["data"] }, {
                onSuccess: () => toast("Objetivo actualizado", "success"),
                onError: () => toast("Error al actualizar objetivo", "error"),
            });
} else {
             createGoal.mutate({ year: Number(year), metric: planEditingCell.metric, [planEditingCell.key]: val } as Parameters<typeof createGoal.mutate>[0], {
                onSuccess: () => toast("Objetivo creado", "success"),
                onError: () => toast("Error al crear objetivo", "error"),
            });
        }
        setPlanEditingCell(null);
        setPlanEditCellVal("");
    }, [planEditingCell, planEditCellVal, planEditOriginalVal, updateGoal, createGoal]);

    const cancelPlanCellEdit = useCallback(() => {
        setPlanEditingCell(null);
        setPlanEditCellVal("");
    }, []);

    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("forecast");
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; desc: string } | null>(null);

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [cfgCapital, setCfgCapital] = useState("");
    const [cfgRates, setCfgRates] = useState<string[]>(Array(12).fill(""));

    const generateGoals = useGenerateGoals();

    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [genExtraIncome, setGenExtraIncome] = useState("");
    const [genExtraExpense, setGenExtraExpense] = useState("");

    const { data: existingCfg } = usePlanningConfig(String(year));
    const { data: existingRates } = useExchangeRates(String(year));
    const updateConfig = useUpdatePlanningConfig();
    const createRate = useCreateExchangeRate();
    const updateRate = useUpdateExchangeRate();

    const [showNewModal, setShowNewModal] = useState(false);
    const [newDesc, setNewDesc] = useState("");
    const [newType, setNewType] = useState<"income" | "expense">("expense");
    const [newCurrency, setNewCurrency] = useState<"ARS" | "USD">("USD");
    const [newAmounts, setNewAmounts] = useState<string[]>(Array(12).fill(""));

    const handleOpenNew = useCallback(() => {
        setNewDesc("");
        setNewType("expense");
        setNewCurrency("USD");
        setNewAmounts(Array(12).fill(""));
        setShowNewModal(true);
    }, []);

    const handleSaveNew = useCallback(() => {
        if (!newDesc.trim()) return;
        const data: Record<string, string | number> = {
            year, description: newDesc.trim(), type: newType, currency: newCurrency,
        };
        newAmounts.forEach((v, i) => {
            if (v) data[MONTH_KEYS[i]] = v;
        });
        createInput.mutate(data as Parameters<typeof createInput.mutate>[0], {
            onSuccess: () => {
                toast("Concepto creado", "success");
                setShowNewModal(false);
            },
            onError: () => toast("Error al crear concepto", "error"),
        });
    }, [year, newDesc, newType, newCurrency, newAmounts, createInput]);

    const handleDelete = useCallback((id: string) => {
        deleteInput.mutate(id, {
            onSuccess: () => toast("Concepto eliminado", "success"),
            onError: () => toast("Error al eliminar concepto", "error"),
        });
    }, [deleteInput]);

    const handlePlanDelete = useCallback((id: string) => {
        deleteGoal.mutate(id, {
            onSuccess: () => toast("Objetivo eliminado", "success"),
            onError: () => toast("Error al eliminar objetivo", "error"),
        });
    }, [deleteGoal]);

    const handleGenerateGoals = useCallback(() => {
        generateGoals.mutate({
            year: Number(year),
            extra_income: genExtraIncome || "0",
            extra_expense: genExtraExpense || "0",
        } as Parameters<typeof generateGoals.mutate>[0], {
            onSuccess: () => {
                toast("Objetivos generados", "success");
                setShowGenerateModal(false);
                setGenExtraIncome("");
                setGenExtraExpense("");
            },
            onError: () => toast("Error al generar objetivos", "error"),
        });
    }, [year, genExtraIncome, genExtraExpense, generateGoals]);

    // Tab-aware KPIs
    const kpiData = activeTab === "plan" ? planData : data;
    const kpiTotals = kpiData?.totals;
    const kpiMonths = kpiData?.months || [];

    const kpis = (() => {
        if (!kpiTotals) return null;
        const income = centsToNum(kpiTotals.income) ?? 0;
        const expense = centsToNum(kpiTotals.expense) ?? 0;
        const savings = centsToNum(kpiTotals.savings) ?? 0;
        const capital = centsToNum(kpiTotals.capital) ?? 0;
        const totalOps = income + expense;
        const incomePct = totalOps > 0 ? income / totalOps : 0;
        const expensePct = totalOps > 0 ? expense / totalOps : 0;
        const hasSavingsMargin = income > 0 && savings !== 0;
        const savingsMargin = hasSavingsMargin ? savings / income : 0;
        const initialCap = kpiMonths.length > 0 ? (centsToNum(kpiMonths[0].capital) ?? 0) - (centsToNum(kpiMonths[0].savings) ?? 0) : 0;
        const hasCapGrowth = capital > 0 && initialCap > 0;
        const capGrowth = hasCapGrowth ? (capital - initialCap) / capital : 0;

const isPlan = activeTab === "plan";
         const incomeLabel = isPlan ? "Ingreso Objetivo" : "Ingresos Proyectados";
         const expenseLabel = isPlan ? "Egreso Objetivo" : "Gastos Proyectados";
         const savingsLabel = isPlan ? "Ahorro Neto Objetivo" : "Ahorro Neto Proyectado";
         const capitalLabel = isPlan ? "Patrimonio Neto Objetivo" : "Patrimonio Neto Proyectado";

          return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: spacing[3] }}>
                <KPICard
                    label={capitalLabel}
                    value={capital}
                    format="currency"
                    icon={Wallet}
                    iconColor={colors.accent.blue}
                    year={year}
                    tooltip={isPlan
                        ? "Capital acumulado objetivo al cierre del año."
                        : "Capital acumulado proyectado al cierre del año, incluyendo el capital inicial."}
                    changeDiff={hasCapGrowth ? `${(capGrowth * 100).toFixed(1)}%` : undefined}
                    changeDiffColor={hasCapGrowth ? (capGrowth >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    changeDiffLabel={hasCapGrowth ? "crecimiento acumulado" : undefined}
                />
                <KPICard
                    label={savingsLabel}
                    value={savings}
                    format="currency"
                    icon={PiggyBank}
                    iconColor={colors.accent.cyan}
                    year={year}
                    tooltip={isPlan
                        ? "Diferencia entre ingresos y gastos objetivo."
                        : "Diferencia entre ingresos y gastos proyectados para el año."}
                    changeDiff={hasSavingsMargin ? `${(savingsMargin * 100).toFixed(1)}%` : undefined}
                    changeDiffColor={hasSavingsMargin ? (savingsMargin >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    changeDiffLabel={hasSavingsMargin ? "margen de ahorro" : undefined}
                />
                <KPICard
                    label={expenseLabel}
                    value={expense}
                    format="currency"
                    icon={TrendingDown}
                    iconColor={colors.accent.red}
                    year={year}
                    tooltip={isPlan
                        ? "Egresos objetivo según los objetivos de planificación."
                        : "Egresos totales proyectados según los conceptos cargados en el forecast anual."}
                    changeDiff={`${(expensePct * 100).toFixed(1)}%`}
                    changeDiffLabel="del total operado"
                />
                <KPICard
                    label={incomeLabel}
                    value={income}
                    format="currency"
                    icon={TrendingUp}
                    iconColor={colors.accent.green}
                    year={year}
                    tooltip={isPlan
                        ? "Ingresos objetivo según los objetivos de planificación."
                        : "Ingresos totales proyectados según los conceptos cargados en el forecast anual."}
                    changeDiff={`${(incomePct * 100).toFixed(1)}%`}
                    changeDiffLabel="del total operado"
                />
            </div>
        );
    })();

    if (isLoading) {
        return (
            <div style={{ padding: spacing[4], color: colors.fg.dim, textAlign: "center", fontSize: fonts.size.sm }}>
                Cargando...
            </div>
        );
    }

    return (
        <div style={{ padding: spacing[3], display: "flex", flexDirection: "column", gap: spacing[4], animation: "fadeIn 0.2s ease-out" }}>
            <style>{`
                .planning-scroll::-webkit-scrollbar { display: none; }
                .planning-scroll { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1
                        onClick={() => setActiveTab(activeTab === "forecast" ? "plan" : "forecast")}
                        title="Clic para cambiar de tabla"
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.xl,
                            fontWeight: fonts.weight.semibold,
                            color: colors.fg.base,
                            margin: 0,
                            marginBottom: spacing[1],
                            cursor: "pointer",
                            userSelect: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: spacing[2],
                        }}>
                        <span style={{ color: activeTab === "forecast" ? colors.fg.base : colors.fg.dim, transition: "color 0.15s" }}>
                            Forecast
                        </span>
                        <span style={{ color: colors.fg.dim, fontWeight: fonts.weight.regular }}>/</span>
                        <span style={{ color: activeTab === "plan" ? colors.fg.base : colors.fg.dim, transition: "color 0.15s" }}>
                            Plan
                        </span>
                    </h1>
                    <p style={{
                        fontFamily: fonts.family.text,
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        margin: 0,
                    }}>
                        Proyecciones anuales y objetivos financieros
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: spacing[2], backgroundColor: colors.fill, borderRadius: radius.md, padding: "2px" }}>
                    <button onClick={() => setYear((y) => y - 1)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.fg.dim, padding: "4px 6px", borderRadius: radius.sm, display: "flex", alignItems: "center" }}>
                        <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: fonts.size.base, fontWeight: fonts.weight.semibold, color: colors.fg.base, padding: "0 8px", minWidth: "44px", textAlign: "center" }}>
                        {year}
                    </span>
                    <button onClick={() => setYear((y) => y + 1)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.fg.dim, padding: "4px 6px", borderRadius: radius.sm, display: "flex", alignItems: "center" }}>
                        <ChevronRight size={14} />
                    </button>
<button onClick={() => {
                         setCfgCapital(existingCfg?.initial_capital || "0");
                         const rates = existingRates || [];
                         const monthRates = Array(12).fill("");
                         rates.forEach((r) => {
                             const m = parseInt(r.month.split("-")[1], 10) - 1;
                             monthRates[m] = String(r.exchange_rate);
                         });
                         setCfgRates(monthRates);
                         setShowSettingsModal(true);
                     }}
                         style={{ background: "none", border: "none", cursor: "pointer", color: colors.fg.dim, padding: "4px 6px", borderRadius: radius.sm, display: "flex", alignItems: "center", marginLeft: spacing[1] }}>
<Settings2 size={14} />
                      </button>
                 </div>
            </div>

            {/* Totals cards */}
            {kpis}

            {/* Tab content */}
            {activeTab === "forecast" && (
                <PlanningForecastTable
                    inputs={inputs}
                    months={months}
                    editingCell={editingCell}
                    editCellVal={editCellVal}
                    onEditCellValChange={setEditCellVal}
                    onStartCellEdit={startCellEdit}
                    onSaveCellEdit={saveCellEdit}
                    onCancelCellEdit={cancelCellEdit}
                    onSaveFieldEdit={saveFieldEdit}
                    hoveredRow={hoveredRow}
                    onSetHoveredRow={setHoveredRow}
                    deleteConfirm={deleteConfirm}
                    onSetDeleteConfirm={setDeleteConfirm}
                    onOpenNew={handleOpenNew}
                    onDelete={handleDelete}
                />
            )}

            {activeTab === "plan" && (
                <PlanningPlanTable
                    goals={planData?.goals || []}
                    editingCell={planEditingCell}
                    editCellVal={planEditCellVal}
                    onEditCellValChange={setPlanEditCellVal}
                    onStartCellEdit={startPlanCellEdit}
                    onSaveCellEdit={savePlanCellEdit}
                    onCancelCellEdit={cancelPlanCellEdit}
                    deleteConfirm={deleteConfirm}
                    onSetDeleteConfirm={setDeleteConfirm}
onDelete={handlePlanDelete}
                 />
)}

             {activeTab === "plan" && (
                 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[3] }}>
                     <button onClick={() => setShowGenerateModal(true)}
                         style={{ background: "none", border: "none", cursor: "pointer", color: colors.fg.dim, padding: "4px 6px", borderRadius: radius.sm, display: "flex", alignItems: "center", fontSize: fonts.size.xs, fontWeight: fonts.weight.medium }}
onMouseEnter={(e) => e.currentTarget.style.color = colors.fg.base}
                             onMouseLeave={(e) => e.currentTarget.style.color = colors.fg.dim}>
                             <LayoutGrid size={14} style={{ marginRight: spacing[1] }} /> Generar Plan
                     </button>
                 </div>
             )}

             {/* Generate Goals Modal */}
            {showGenerateModal && (
                <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} opacity={0.8}>
                    <ModalContent onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.xl,
                        width: "420px",
                        maxHeight: "80vh",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        border: `1px solid ${colors.border}`,
                        outline: `1px solid ${colors.border}`,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${colors.fill}` }}>
                            <h2 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Generar Plan {year}</h2>
                            <Button variant="plain" onClick={() => setShowGenerateModal(false)}>✕</Button>
                        </div>
                        <div style={{ padding: `${spacing[4]} ${spacing[5]}`, overflowY: "auto", display: "flex", flexDirection: "column", gap: spacing[3] }}>
                            <p style={{ fontSize: fonts.size.sm, color: colors.fg.dim, margin: 0 }}>
                                Se generarán los objetivos de ingreso y egreso para el año {year} basándose en los datos del forecast anual. Se utilizará el capital inicial configurado y los ajustes indicados abajo.
                            </p>
                            <div>
                                <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Extra Ingreso (mensual)</label>
                                <input value={genExtraIncome} onChange={(e) => setGenExtraIncome(e.target.value)}
                                    placeholder="0"
                                    style={{ width: "100%", padding: `${spacing[2]} ${spacing[3]}`, backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.fg.base, fontSize: fonts.size.sm, height: "40px", boxSizing: "border-box", outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Extra Egreso (mensual)</label>
                                <input value={genExtraExpense} onChange={(e) => setGenExtraExpense(e.target.value)}
                                    placeholder="0"
                                    style={{ width: "100%", padding: `${spacing[2]} ${spacing[3]}`, backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.fg.base, fontSize: fonts.size.sm, height: "40px", boxSizing: "border-box", outline: "none" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: spacing[3], padding: `${spacing[3]} ${spacing[5]}`, borderTop: `1px solid ${colors.fill}` }}>
                            <Button variant="secondary" type="button" onClick={() => setShowGenerateModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" onClick={handleGenerateGoals} fullWidth>Generar</Button>
                        </div>
                    </ModalContent>
                </Modal>
            )}

            {/* New concept modal */}
            {showNewModal && (
                <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} opacity={0.8}>
                    <ModalContent onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.xl,
                        width: "660px",
                        maxHeight: "80vh",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        border: `1px solid ${colors.border}`,
                        outline: `1px solid ${colors.border}`,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${colors.fill}` }}>
                            <h2 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Nuevo concepto</h2>
                            <Button variant="plain" onClick={() => setShowNewModal(false)}>✕</Button>
                        </div>
                        <div style={{ padding: `${spacing[4]} ${spacing[5]}`, overflowY: "auto", display: "flex", flexDirection: "column", gap: spacing[3] }}>
                            <div>
                                <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Descripción</label>
                                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Ej: Salario, Alquiler, etc."
                                    style={{ width: "100%", padding: `${spacing[2]} ${spacing[3]}`, backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.fg.base, fontSize: fonts.size.sm, height: "40px", boxSizing: "border-box", outline: "none" }} />
                            </div>
                            <div style={{ display: "flex", gap: spacing[3] }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo</label>
                                    <div style={{ display: "flex", backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "2px", overflow: "hidden" }}>
                                        <Button type="button" variant="tab" color="red" active={newType === "expense"} onClick={() => setNewType("expense")} fullWidth iconLeft={<TrendingDown size={16} />}>Gasto</Button>
                                        <Button type="button" variant="tab" color="green" active={newType === "income"} onClick={() => setNewType("income")} fullWidth iconLeft={<TrendingUp size={16} />}>Ingreso</Button>
                                    </div>
                                </div>
                                <div style={{ width: "140px" }}>
                                    <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Moneda</label>
                                    <div style={{ display: "flex", backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "2px", overflow: "hidden" }}>
                                        <Button type="button" variant="tab" color="green" active={newCurrency === "USD"} onClick={() => setNewCurrency("USD")} fullWidth>USD</Button>
                                        <Button type="button" variant="tab" color="cyan" active={newCurrency === "ARS"} onClick={() => setNewCurrency("ARS")} fullWidth>ARS</Button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Valores mensuales</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing[2] }}>
                                    {FULL_MONTHS.map((m, i) => (
                                        <div key={m}>
                                            <label style={{ fontSize: "10px", color: colors.fg.dim, display: "block", marginBottom: "2px" }}>{m}</label>
                                            <input value={newAmounts[i]} onChange={(e) => setNewAmounts((p) => { const n = [...p]; n[i] = e.target.value; return n; })}
                                                placeholder="—"
                                                style={{ width: "100%", padding: `${spacing[1]} ${spacing[2]}`, backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.fg.base, fontSize: fonts.size.sm, height: "36px", boxSizing: "border-box", outline: "none" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: spacing[3], padding: `${spacing[3]} ${spacing[5]}`, borderTop: `1px solid ${colors.fill}` }}>
                            <Button variant="secondary" type="button" onClick={() => setShowNewModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" onClick={handleSaveNew} disabled={!newDesc.trim()} fullWidth>Crear concepto</Button>
                        </div>
                    </ModalContent>
                </Modal>
            )}

            {/* Settings modal */}
            {showSettingsModal && (
                <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} opacity={0.8}>
                    <ModalContent onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: colors.bg.surface, borderRadius: radius.xl, width: "460px",
                        maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column",
                        border: `1px solid ${colors.border}`, outline: `1px solid ${colors.border}`,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${colors.fill}` }}>
                            <h2 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Configuración {year}</h2>
                            <Button variant="plain" onClick={() => setShowSettingsModal(false)}>✕</Button>
                        </div>
                        <div style={{ padding: `${spacing[4]} ${spacing[5]}`, overflowY: "auto", display: "flex", flexDirection: "column", gap: spacing[4] }}>
                            <div>
                                <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Capital Inicial (USD)</label>
                                <input value={cfgCapital} onChange={(e) => setCfgCapital(e.target.value)}
                                    placeholder="Ej: 10000000"
                                    style={{ width: "100%", padding: `${spacing[2]} ${spacing[3]}`, backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.fg.base, fontSize: fonts.size.sm, height: "40px", boxSizing: "border-box", outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, fontWeight: 500, marginBottom: spacing[2], display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo de Cambio USD/ARS</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing[2] }}>
                                    {MONTHS.map((m, i) => (
                                        <div key={m}>
                                            <label style={{ fontSize: "10px", color: colors.fg.dim, display: "block", marginBottom: "2px" }}>{m}</label>
                                            <input value={cfgRates[i]} onChange={(e) => setCfgRates((p) => { const n = [...p]; n[i] = e.target.value; return n; })}
                                                placeholder="—"
                                                style={{ width: "100%", padding: `${spacing[1]} ${spacing[2]}`, backgroundColor: colors.bg.base, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.fg.base, fontSize: fonts.size.xs, height: "32px", boxSizing: "border-box", outline: "none" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: spacing[3], padding: `${spacing[3]} ${spacing[5]}`, borderTop: `1px solid ${colors.fill}` }}>
                            <Button variant="secondary" type="button" onClick={() => setShowSettingsModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" onClick={() => {
                                updateConfig.mutate({ year: String(year), data: { initial_capital: cfgCapital } });
                                cfgRates.forEach((rate, i) => {
                                    if (!rate) return;
                                    const month = `${year}-${String(i + 1).padStart(2, "0")}`;
                                    const existing = existingRates?.find((r) => r.month === month);
                                    if (existing) {
                                        updateRate.mutate({ date: month, data: { exchange_rate: parseFloat(rate) } });
                                    } else {
                                        createRate.mutate({ month, exchange_rate: parseFloat(rate) });
                                    }
                                });
                                setShowSettingsModal(false);
                                toast("Configuración guardada", "success");
                            }} fullWidth>Guardar</Button>
                        </div>
                    </ModalContent>
                </Modal>
            )}
        </div>
    );
}