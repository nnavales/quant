import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "@/hooks";
import { dashboard as dashboardApi } from "@/api_client/endpoints";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

import {
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Wallet,
    Building2,
    PieChart,
    Briefcase,
    Umbrella,
    Shuffle,
    Hourglass,
    Target,
    Gem,
    Sprout,
    Flame,
    Waves,
    Gauge,
} from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { Heatmap, HeatmapLegend } from "@/components/Heatmap";
import { KPIEvolutionModal } from "@/components/KPIEvolutionModal";

export function AnalysisPage() {
    const { data, isLoading, isError } = useDashboard();
    const [dimension, setDimension] = useState<"category" | "channel">("category");
    const [type, setType] = useState<"expense" | "income">("expense");
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const currentYear = new Date().getFullYear();

    const expenseQuery = useQuery({
        queryKey: ["dashboard", "dimension", dimension, "expense"],
        queryFn: () => dashboardApi.getDimensionSeries(dimension, { type: "expense" }),
    });

    const incomeQuery = useQuery({
        queryKey: ["dashboard", "dimension", dimension, "income"],
        queryFn: () => dashboardApi.getDimensionSeries(dimension, { type: "income" }),
    });

    if (isLoading)
        return (
            <div style={{ padding: spacing[4], color: colors.fg.dim }}>Cargando análisis...</div>
        );
    if (isError)
        return (
            <div style={{ padding: spacing[4], color: colors.accent.red }}>Error al cargar</div>
        );
    if (!data) return <div style={{ padding: spacing[4], color: colors.fg.dim }}>Sin datos</div>;

    return (
        <div
            style={{
                padding: spacing[3],
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            {selectedKPI && <KPIEvolutionModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />}
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
                    Análisis Financiero
                </h1>
                <p
                    style={{
                        fontFamily: fonts.family.text,
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        margin: 0,
                    }}
                >
                    KPIs y evolución histórica
                </p>
            </div>

            <div
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: spacing[3] }}
            >
                <KPICard
                    label="Ingresos YTD"
                    value={data.currentYtd.IncomeYTD}
                    prevValue={data.previousYtd.IncomeYTD}
                    format="currency"
                    icon={TrendingUp}
                    iconColor={colors.accent.green}
                    onClick={() => setSelectedKPI("Ingresos YTD")}
                    tooltip="Ingresos totales acumulados del año hasta la fecha."
                    year={currentYear}
                />
                <KPICard
                    label="Gastos YTD"
                    value={data.currentYtd.ExpensesYTD}
                    prevValue={data.previousYtd.ExpensesYTD}
                    format="currency"
                    icon={TrendingDown}
                    iconColor={colors.accent.red}
                    onClick={() => setSelectedKPI("Gastos YTD")}
                    tooltip="Egresos totales acumulados del año hasta la fecha."
                    year={currentYear}
                />
                <KPICard
                    label="Ahorro Neto YTD"
                    value={data.currentYtd.NetSavingsYTD}
                    prevValue={data.previousYtd.NetSavingsYTD}
                    format="currency"
                    icon={PiggyBank}
                    iconColor={colors.accent.green}
                    onClick={() => setSelectedKPI("Ahorro Neto YTD")}
                    tooltip="Ahorro neto acumulado del año hasta la fecha. Surge de la diferencia entre ingresos y egresos acumulados."
                    year={currentYear}
                />
                <KPICard
                    label="Balance Total"
                    value={data.currentYtd.CapitalTotal}
                    format="currency"
                    icon={Wallet}
                    iconColor={colors.accent.cyan}
                    onClick={() => setSelectedKPI("Balance Total")}
                    directChange={data.currentYtd.CapitalGrowthRateYTD}
                    changeLabel="Tasa de Crecimiento YTD"
                    tooltip="Capital total acumulado actual."
                    year={currentYear}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: spacing[4] }}>
                <div
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[4],
                        border: `1px solid ${colors.border}`,
                        overflow: "visible",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: spacing[3],
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setType(type === "expense" ? "income" : "expense");
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: spacing[1],
                                    padding: spacing[1],
                                }}
                            >
                                <span
                                    className="tab-title"
                                    style={{
                                        fontSize: fonts.size.sm,
                                        color:
                                            type === "expense"
                                                ? colors.accent.red
                                                : colors.accent.green,
                                        textTransform: "uppercase",
                                        fontWeight: 500,
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {type === "expense" ? "Gastos" : "Ingresos"}
                                </span>
                                <span
                                    style={{
                                        fontSize: fonts.size.sm,
                                        color: colors.fg.dim,
                                        textTransform: "uppercase",
                                        fontWeight: 500,
                                        letterSpacing: "0.5px",
                                        borderBottom: "1px solid transparent",
                                    }}
                                >
                                    por
                                </span>
                                <span
                                    className="tab-title"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDimension(
                                            dimension === "category" ? "channel" : "category"
                                        );
                                    }}
                                    style={{
                                        fontSize: fonts.size.sm,
                                        color: colors.fg.base,
                                        textTransform: "uppercase",
                                        fontWeight: 500,
                                        letterSpacing: "0.5px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {dimension === "category" ? "Categoría" : "Canal"}
                                </span>
                                <span
                                    style={{
                                        fontSize: fonts.size.sm,
                                        color: colors.fg.dim,
                                        textTransform: "uppercase",
                                        fontWeight: 500,
                                        letterSpacing: "0.5px",
                                        borderBottom: "1px solid transparent",
                                    }}
                                >
                                    {currentYear}
                                </span>
                            </button>
                        </div>
                        <HeatmapLegend isIncome={type === "income"} />
                    </div>

                    {type === "expense" ? (
                        expenseQuery.isLoading ? (
                            <div
                                style={{
                                    color: colors.fg.dim,
                                    padding: spacing[4],
                                    textAlign: "center",
                                }}
                            >
                                Cargando...
                            </div>
                        ) : expenseQuery.isError ? (
                            <div
                                style={{
                                    color: colors.accent.red,
                                    padding: spacing[4],
                                    textAlign: "center",
                                }}
                            >
                                Error al cargar
                            </div>
                        ) : (
                            <Heatmap
                                expenseData={expenseQuery.data}
                                isIncome={false}
                                dimension={dimension}
                                currentYear={currentYear}
                            />
                        )
                    ) : incomeQuery.isLoading ? (
                        <div
                            style={{
                                color: colors.fg.dim,
                                padding: spacing[4],
                                textAlign: "center",
                            }}
                        >
                            Cargando...
                        </div>
                    ) : incomeQuery.isError ? (
                        <div
                            style={{
                                color: colors.accent.red,
                                padding: spacing[4],
                                textAlign: "center",
                            }}
                        >
                            Error al cargar
                        </div>
                    ) : (
                        <Heatmap
                            expenseData={incomeQuery.data}
                            isIncome={true}
                            dimension={dimension}
                            currentYear={currentYear}
                        />
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: spacing[3],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Estructura de Costos
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[3],
                            }}
                        >
                            <KPICard
                                label="Ratio Costos Fijos"
                                value={data.currentYtd.FixedCostRatio}
                                format="percent"
                                icon={Building2}
                                iconColor={colors.accent.orange}
                                compact
                                tooltip="Porcentaje de los ingresos acumulados que se destina a cubrir gastos fijos. Mide cuánto pesa tu estructura fija sobre tu ingreso total."
                            />
                            <KPICard
                                label="Mix Gastos Fijos"
                                value={data.currentYtd.FixedExpenseMix}
                                format="percent"
                                icon={PieChart}
                                iconColor={colors.accent.red}
                                compact
                                tooltip="Porcentaje de los egresos acumulados que corresponde a gastos fijos. Mide qué parte de tu gasto total es estructural y menos flexible."
                            />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: spacing[3],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Estabilidad de Ingresos
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[3],
                            }}
                        >
                            <KPICard
                                label="Mix Ingresos Fijos"
                                value={data.currentYtd.FixedIncomeMix}
                                format="percent"
                                icon={Briefcase}
                                iconColor={colors.accent.green}
                                compact
                                tooltip="Porcentaje de los egresos totales que corresponde a gastos fijos. Mide qué parte de tu gasto total es estructural y menos flexible."
                            />
                            <KPICard
                                label="Cobertura Ingreso"
                                value={data.currentYtd.StableIncomeCoverage}
                                format="number"
                                suffix="x"
                                icon={Umbrella}
                                iconColor={colors.accent.purple}
                                compact
                                tooltip="Relación entre ingresos fijos y gastos fijos. Mide cuántas veces tu ingreso estable cubre tu estructura fija. Un valor superior a 1 indica una cobertura saludable."
                            />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: spacing[2],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Liquidez
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[3],
                            }}
                        >
                            <KPICard
                                label="Flexibilidad"
                                value={data.currentYtd.FinancialFlexibility}
                                format="percent"
                                icon={Shuffle}
                                iconColor={colors.accent.cyan}
                                compact
                                tooltip="Porcentaje de los egresos totales que corresponde a gasto variable. Mide qué parte de tu estructura es ajustable en caso de necesitar recortar gasto."
                            />
                            <KPICard
                                label="Meses Cobertura"
                                value={data.currentYtd.ExpenseCoverageMonths}
                                format="number"
                                icon={Hourglass}
                                iconColor={colors.accent.purple}
                                compact
                                tooltip="Cantidad de meses que tu capital actual podría cubrir tomando como referencia tu gasto mensual actual. Mide tu capacidad de sostén financiero."
                            />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: spacing[2],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Proyecciones
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[3],
                            }}
                        >
                            <KPICard
                                label="Ahorro Proyectado"
                                value={data.currentYtd.ProjectedYearlySavings}
                                format="currency"
                                icon={Target}
                                iconColor={colors.accent.green}
                                compact
                                tooltip="Ahorro estimado al cierre del año si se mantiene el ritmo actual de ahorro. Mide la proyección anual de generación de ahorro."
                            />
                            <KPICard
                                label="Capital Proyectado"
                                value={data.currentYtd.ProjectedYearlyCapital}
                                format="currency"
                                icon={Gem}
                                iconColor={colors.accent.cyan}
                                compact
                                tooltip="Capital estimado al cierre del año si se mantiene el ritmo actual de acumulación. Mide la proyección de patrimonio al cierre del año."
                            />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: spacing[2],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Crecimiento
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[3],
                            }}
                        >
                            <KPICard
                                label="Tasa Crecimiento"
                                value={data.currentYtd.CapitalGrowthRateYTD}
                                format="percent"
                                icon={Sprout}
                                iconColor={colors.accent.green}
                                compact
                                tooltip="Porcentaje del capital actual explicado por el ahorro acumulado del año. Mide la velocidad a la que el ahorro está expandiendo tu base de capital."
                            />
                            <KPICard
                                label="Gasto Core"
                                value={data.currentYtd.CoreBurnRate}
                                format="currency"
                                icon={Flame}
                                iconColor={colors.accent.yellow}
                                compact
                                tooltip="Nivel mínimo de gasto estructural mensual necesario para sostener tu operación personal. Representa el 'piso' de gasto que no puede reducirse fácilmente."
                            />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: spacing[2],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Riesgo
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[3],
                            }}
                        >
                            <KPICard
                                label="Volatilidad"
                                value={data.currentYtd.SavingsVolatility}
                                format="number"
                                icon={Waves}
                                iconColor={colors.accent.yellow}
                                compact
                                tooltip="Mide la variabilidad del ahorro mensual a lo largo del año. Un valor más alto indica menor estabilidad en la generación de ahorro mes a mes."
                            />
                            <KPICard
                                label="Ratio Volatilidad"
                                value={data.currentYtd.SavingsVolatilityRatio}
                                format="percent"
                                icon={Gauge}
                                iconColor={colors.accent.yellow}
                                compact
                                tooltip="Relación entre la volatilidad del ahorro y el ahorro promedio. Mide la estabilidad relativa de la generación de ahorro."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
