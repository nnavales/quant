import { useState, useMemo } from "react";
import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { useDashboardMetrics } from "@/hooks";
import { MetricsComparisonTable } from "@/components/MetricsComparisonTable";
import { KPICardToggle } from "@/components/KPICardToggle";
import { KPIEvolutionModal } from "@/components/KPIEvolutionModal";
import {
    Wallet,
    PiggyBank,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import type { MetricCell, MetricComparisonDashboard } from "@/api_client";

export function MetricsComparisonPage() {
    const currentYear = new Date().getFullYear();
    const [year] = useState(currentYear);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

    const { data: metricsData, isLoading: metricsLoading, isError: metricsError } = useDashboardMetrics(year);

    const currentMonth = new Date().getMonth();
    const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const lastClosedLabel = currentMonth > 0 ? `hasta ${MONTHS[currentMonth - 1]}` : "";

    const kpiModalConfig = selectedKPI === "Capital" ? { months: metricsData?.capital?.months, color: colors.accent.blue }
        : selectedKPI === "Ahorro" ? { months: metricsData?.savings?.months, color: colors.accent.cyan }
        : selectedKPI === "Egresos" ? { months: metricsData?.expense?.months, color: colors.accent.red }
        : selectedKPI === "Ingresos" ? { months: metricsData?.income?.months, color: colors.accent.green }
        : undefined;

    const kpis = useMemo(() => {
        if (!metricsData) {
            return {
                capital: {},
                savings: {},
                expense: {},
                income: {},
            };
        }

        const sumClosed = (months: MetricCell[] | undefined, field: "vs_plan" | "vs_fcst"): number | undefined => {
            if (!months || months.length === 0) return undefined;
            let sum = 0;
            let hasValue = false;
            const limit = Math.min(currentMonth, months.length);
            for (let i = 0; i < limit; i++) {
                const val = months[i][field];
                if (val !== undefined) {
                    sum += val;
                    hasValue = true;
                }
            }
            return hasValue ? sum : undefined;
        };

        return {
            capital: {
                planPct: metricsData.capital?.ytd?.vs_plan_pct,
                fcstPct: metricsData.capital?.ytd?.vs_fcst_pct,
                planDiff: sumClosed(metricsData.capital?.months, "vs_plan"),
                fcstDiff: sumClosed(metricsData.capital?.months, "vs_fcst"),
            },
            savings: {
                planPct: metricsData.savings?.ytd?.vs_plan_pct,
                fcstPct: metricsData.savings?.ytd?.vs_fcst_pct,
                planDiff: sumClosed(metricsData.savings?.months, "vs_plan"),
                fcstDiff: sumClosed(metricsData.savings?.months, "vs_fcst"),
            },
            expense: {
                planPct: metricsData.expense?.ytd?.vs_plan_pct,
                fcstPct: metricsData.expense?.ytd?.vs_fcst_pct,
                planDiff: sumClosed(metricsData.expense?.months, "vs_plan"),
                fcstDiff: sumClosed(metricsData.expense?.months, "vs_fcst"),
            },
            income: {
                planPct: metricsData.income?.ytd?.vs_plan_pct,
                fcstPct: metricsData.income?.ytd?.vs_fcst_pct,
                planDiff: sumClosed(metricsData.income?.months, "vs_plan"),
                fcstDiff: sumClosed(metricsData.income?.months, "vs_fcst"),
            },
        };
    }, [metricsData]);

    if (metricsLoading) {
        return (
            <div style={{ padding: spacing[4], color: colors.fg.dim }}>Cargando métricas...</div>
        );
    }
    if (metricsError) {
        return (
            <div style={{ padding: spacing[4], color: colors.accent.red }}>Error al cargar métricas</div>
        );
    }

    return (
        <div
            style={{
                padding: spacing[3],
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
                maxHeight: "calc(100vh - 80px)",
                boxSizing: "border-box",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            {selectedKPI && kpiModalConfig ? (
                <KPIEvolutionModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} metricMonths={kpiModalConfig.months} accentColor={kpiModalConfig.color} />
            ) : selectedKPI ? (
                <KPIEvolutionModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />
            ) : null}
            <div>
                <h1
                    style={{
                        fontFamily: fonts.family.display,
                        fontSize: fonts.size.xl,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.base,
                        margin: 0,
                        marginBottom: spacing[1],
                    }}
                >
                    Panel de Métricas Financieras
                </h1>
                <p
                    style={{
                        fontFamily: fonts.family.text,
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        margin: 0,
                    }}
                >
                    Evolución de indicadores clave y comparativa anual · {year}
                </p>
            </div>

            <div
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: spacing[3] }}
            >
                <KPICardToggle
                    label="Capital"
                    value={kpis.capital.planPct}
                    toggleValue={kpis.capital.fcstPct}
                    format="percent"
                    icon={Wallet}
                    iconColor={colors.accent.blue}
                    onClick={() => setSelectedKPI("Capital")}
                    tooltip="Capital acumulado (Patrimonio Neto = Activos - Pasivos). Variación % del Real contra el Plan y Forecast en el año."
                    year={currentYear}
                    changeDiff={kpis.capital.planDiff !== undefined ? formatCurrency(kpis.capital.planDiff) : undefined}
                    changeDiffColor={kpis.capital.planDiff !== undefined ? (kpis.capital.planDiff >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    changeDiffLabel={kpis.capital.planDiff !== undefined ? `vs Plan ${lastClosedLabel}` : undefined}
                    toggleChangeDiff={kpis.capital.fcstDiff !== undefined ? formatCurrency(kpis.capital.fcstDiff) : undefined}
                    toggleChangeDiffColor={kpis.capital.fcstDiff !== undefined ? (kpis.capital.fcstDiff >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    toggleChangeDiffLabel={kpis.capital.fcstDiff !== undefined ? `vs FCST ${lastClosedLabel}` : undefined}
                    segments={["vs Plan %", "vs FCST %"]}
                />
                <KPICardToggle
                    label="Ahorro"
                    value={kpis.savings.planPct}
                    toggleValue={kpis.savings.fcstPct}
                    format="percent"
                    icon={PiggyBank}
                    iconColor={colors.accent.cyan}
                    onClick={() => setSelectedKPI("Ahorro")}
                    tooltip="Ahorro = Ingresos - Egresos. Variación % del ahorro real contra el Plan y Forecast en el año."
                    year={currentYear}
                    changeDiff={kpis.savings.planDiff !== undefined ? formatCurrency(kpis.savings.planDiff) : undefined}
                    changeDiffColor={kpis.savings.planDiff !== undefined ? (kpis.savings.planDiff >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    changeDiffLabel={kpis.savings.planDiff !== undefined ? `vs Plan ${lastClosedLabel}` : undefined}
                    toggleChangeDiff={kpis.savings.fcstDiff !== undefined ? formatCurrency(kpis.savings.fcstDiff) : undefined}
                    toggleChangeDiffColor={kpis.savings.fcstDiff !== undefined ? (kpis.savings.fcstDiff >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    toggleChangeDiffLabel={kpis.savings.fcstDiff !== undefined ? `vs FCST ${lastClosedLabel}` : undefined}
                    segments={["vs Plan %", "vs FCST %"]}
                />
                <KPICardToggle
                    label="Egresos"
                    value={kpis.expense.planPct}
                    toggleValue={kpis.expense.fcstPct}
                    format="percent"
                    icon={TrendingDown}
                    iconColor={colors.accent.red}
                    onClick={() => setSelectedKPI("Egresos")}
                    tooltip="Total de egresos acumulados en el año. Variación % del gasto real contra el Plan y Forecast. Valores negativos indican menor gasto del previsto (favorable)."
                    year={currentYear}
                    changeDiff={kpis.expense.planDiff !== undefined ? formatCurrency(kpis.expense.planDiff) : undefined}
                    changeDiffColor={kpis.expense.planDiff !== undefined ? (kpis.expense.planDiff <= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    changeDiffLabel={kpis.expense.planDiff !== undefined ? `vs Plan ${lastClosedLabel}` : undefined}
                    toggleChangeDiff={kpis.expense.fcstDiff !== undefined ? formatCurrency(kpis.expense.fcstDiff) : undefined}
                    toggleChangeDiffColor={kpis.expense.fcstDiff !== undefined ? (kpis.expense.fcstDiff <= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    toggleChangeDiffLabel={kpis.expense.fcstDiff !== undefined ? `vs FCST ${lastClosedLabel}` : undefined}
                    segments={["vs Plan %", "vs FCST %"]}
                />
                <KPICardToggle
                    label="Ingresos"
                    value={kpis.income.planPct}
                    toggleValue={kpis.income.fcstPct}
                    format="percent"
                    icon={TrendingUp}
                    iconColor={colors.accent.green}
                    onClick={() => setSelectedKPI("Ingresos")}
                    tooltip="Total de ingresos acumulados en el año. Variación % del ingreso real contra el Plan y Forecast. Valores positivos indican mayor ingreso del previsto (favorable)."
                    year={currentYear}
                    changeDiff={kpis.income.planDiff !== undefined ? formatCurrency(kpis.income.planDiff) : undefined}
                    changeDiffColor={kpis.income.planDiff !== undefined ? (kpis.income.planDiff >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    changeDiffLabel={kpis.income.planDiff !== undefined ? `vs Plan ${lastClosedLabel}` : undefined}
                    toggleChangeDiff={kpis.income.fcstDiff !== undefined ? formatCurrency(kpis.income.fcstDiff) : undefined}
                    toggleChangeDiffColor={kpis.income.fcstDiff !== undefined ? (kpis.income.fcstDiff >= 0 ? colors.accent.green : colors.accent.red) : undefined}
                    toggleChangeDiffLabel={kpis.income.fcstDiff !== undefined ? `vs FCST ${lastClosedLabel}` : undefined}
                    segments={["vs Plan %", "vs FCST %"]}
                />
            </div>

            <MetricsComparisonTable data={metricsData ?? {} as MetricComparisonDashboard} />
        </div>
    );
}
