import { useState } from "react";
import { useUserConfig } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "@/hooks";
import { getApiErrorMessage } from "@/utils/apiErrors";
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
    Grid3X3,
    Plus,
} from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { KPICardToggle } from "@/components/KPICardToggle";
import { Heatmap, HeatmapLegend } from "@/components/Heatmap";
import { KPIEvolutionModal } from "@/components/KPIEvolutionModal";
import { NetWorthWidgetContainer, AddAssetForm } from "@/components/NetWorthWidget";
import { Button } from "@/components/ui/Button";
import { flexColumn, flexRow, ghostButton } from "@/styles/layout";
import { HelpModal } from "@/components/ui/HelpModal";
import { PageHeader, HelpButton } from "@/components/ui/PageHeader";
import { helpContent } from "@/data/helpContent";

function getGreeting() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return "Buenos días";
    if (h >= 12 && h < 20) return "Buenas tardes";
    return "Buenas noches";
}

export function AnalysisPage() {
    const { data, isLoading, isError, error } = useDashboard();
    const { data: userConfig } = useUserConfig();
    const [dimension, setDimension] = useState<"category" | "channel">("category");
    const [type, setType] = useState<"expense" | "income">("expense");
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

    const kpiColor: Record<string, string> = {
        "Patrimonio Neto": colors.accent.blue,
        "Ahorro Neto YTD": colors.accent.cyan,
        "Egresos YTD": colors.accent.red,
        "Ingresos YTD": colors.accent.green,
    };
    const [viewMode, setViewMode] = useState<"heatmap" | "networth">("heatmap");
    const [showNetWorthForm, setShowNetWorthForm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const currentYear = new Date().getFullYear();

    const hasData = data && data.monthlySeries && data.monthlySeries.length > 0;
    const currentMonth = hasData ? data.monthlySeries[data.monthlySeries.length - 1] : null;
    const prevMonth = hasData && data.monthlySeries.length > 1
        ? data.monthlySeries[data.monthlySeries.length - 2]
        : null;

    const currentIncome = currentMonth?.income;
    const currentExpense = currentMonth?.expense;
    const currentSavings = currentMonth?.savings;
    const prevMonthIncome = prevMonth?.income;
    const prevMonthExpense = prevMonth?.expense;
    const prevMonthSavings = prevMonth?.savings;

    const expenseQuery = useQuery({
        queryKey: ["dashboard", "dimension", dimension, "expense"],
        queryFn: () => dashboardApi.getDimensionSeries(dimension, { type: "expense" }),
    });

    const incomeQuery = useQuery({
        queryKey: ["dashboard", "dimension", dimension, "income"],
        queryFn: () => dashboardApi.getDimensionSeries(dimension, { type: "income" }),
    });

    return (
        <div
            style={{
                padding: spacing[3],
                ...flexColumn,
                gap: spacing[3],
                maxHeight: "calc(100vh - 80px)",
                boxSizing: "border-box",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            {selectedKPI && (
                <KPIEvolutionModal
                    kpi={selectedKPI}
                    onClose={() => setSelectedKPI(null)}
                    accentColor={kpiColor[selectedKPI]}
                />
            )}
            {showNetWorthForm && <AddAssetForm onClose={() => setShowNetWorthForm(false)} />}
            <PageHeader
                title={`${getGreeting()}${userConfig?.username ? `, ${userConfig.username}` : ""}`}
                actions={<HelpButton onClick={() => setShowHelp(true)} />}
            >
                    <div
                        style={{
                            display: "inline-flex",
                            borderRadius: "8px",
                            background: colors.fill,
                            overflow: "hidden",
                            cursor: "pointer",
                            userSelect: "none",
                            alignSelf: "flex-start",
                        }}
                    >
                        <div
                            onClick={() => setViewMode("heatmap")}
                            style={{
                                ...flexRow,
                                justifyContent: "center",
                                gap: "5px",
                                flex: 1,
                                padding: "4px 14px",
                                whiteSpace: "nowrap",
                                fontSize: fonts.size.sm,
                                fontWeight: fonts.weight.medium,
                                color: viewMode === "heatmap" ? colors.fg.base : colors.fg.dim,
                                borderRadius: "7px",
                                background: viewMode === "heatmap" ? colors.bg.surface : "transparent",
                                transition: "background 0.15s ease, color 0.2s",
                                lineHeight: "18px",
                            }}
                        >
                            <Grid3X3 size={14} strokeWidth={2.5} />
                            Heatmap
                        </div>
                        <div
                            onClick={() => setViewMode("networth")}
                            style={{
                                ...flexRow,
                                justifyContent: "center",
                                gap: "5px",
                                flex: 1,
                                padding: "4px 14px",
                                whiteSpace: "nowrap",
                                fontSize: fonts.size.sm,
                                fontWeight: fonts.weight.medium,
                                color: viewMode === "networth" ? colors.fg.base : colors.fg.dim,
                                borderRadius: "7px",
                                background: viewMode === "networth" ? colors.bg.surface : "transparent",
                                transition: "background 0.15s ease, color 0.2s",
                                lineHeight: "18px",
                            }}
                        >
                            <Wallet size={13} strokeWidth={2.5} />
                            Net Worth
                        </div>
                    </div>
            </PageHeader>

            {isLoading ? (
                <div style={{ color: colors.fg.dim, padding: spacing[4] }}>Cargando análisis...</div>
            ) : isError ? (
                <div style={{ color: colors.accent.red, padding: spacing[4] }}>{getApiErrorMessage(error) || "Error al cargar"}</div>
            ) : !data ? (
                <div style={{ color: colors.fg.dim, padding: spacing[4] }}>Sin datos</div>
            ) : (
                <>
                    <div
                        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: spacing[3] }}
                    >
                        <KPICardToggle
                            label="Patrimonio Neto"
                            value={data.currentYtd.CapitalTotal}
                            format="currency"
                            icon={Wallet}
                            iconColor={colors.accent.blue}
                            onClick={() => setSelectedKPI("Patrimonio Neto")}
                            changeDiff={`${(data.currentYtd.CapitalGrowthRateYTD * 100).toFixed(1)}%`}
                            changeDiffColor={data.currentYtd.CapitalGrowthRateYTD >= 0 ? colors.accent.green : colors.accent.red}
                            changeDiffLabel="Tasa de Crecimiento YTD"
                            tooltip="Valor total del patrimonio acumulado al período. La tasa de crecimiento indica el porcentaje del capital generado en el año."

                        />
                        <KPICardToggle
                            label="Ahorro Neto"
                            value={data.currentYtd.NetSavingsYTD}
                            toggleValue={currentSavings}
                            prevValue={data.previousYtd.NetSavingsYTD}
                            togglePrevValue={prevMonthSavings}
                            format="currency"
                            icon={PiggyBank}
                            iconColor={colors.accent.cyan}
                            onClick={() => setSelectedKPI("Ahorro Neto YTD")}
                            tooltip="Diferencia entre ingresos y egresos acumulada en el período. Representa el superávit o déficit generado."

                            segments={["YTD", "MTD"]}
                            changeLabel="vs mismo período año anterior"
                            toggleChangeLabel="vs mes anterior"
                        />
                        <KPICardToggle
                            label="Egresos"
                            value={data.currentYtd.ExpensesYTD}
                            toggleValue={currentExpense}
                            prevValue={data.previousYtd.ExpensesYTD}
                            togglePrevValue={prevMonthExpense}
                            format="currency"
                            icon={TrendingDown}
                            iconColor={colors.accent.red}
                            onClick={() => setSelectedKPI("Egresos YTD")}
                            tooltip="Total de egresos registrados en el período. Incluye egresos fijos y variables."

                            segments={["YTD", "MTD"]}
                            changeLabel="vs mismo período año anterior"
                            toggleChangeLabel="vs mes anterior"
                            inverseTrend
                        />
                        <KPICardToggle
                            label="Ingresos"
                            value={data.currentYtd.IncomeYTD}
                            toggleValue={currentIncome}
                            prevValue={data.previousYtd.IncomeYTD}
                            togglePrevValue={prevMonthIncome}
                            format="currency"
                            icon={TrendingUp}
                            iconColor={colors.accent.green}
                            onClick={() => setSelectedKPI("Ingresos YTD")}
                            tooltip="Total de ingresos registrados en el período. Incluye todas las fuentes de ingreso."

                            segments={["YTD", "MTD"]}
                            changeLabel="vs mismo período año anterior"
                            toggleChangeLabel="vs mes anterior"
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1338px 1fr", gap: spacing[4] }}>
                        {viewMode === "networth" ? (
                            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, border: `1px solid transparent`, overflow: "hidden", ...flexColumn, height: "622px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${spacing[3]} ${spacing[4]}`, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
                                    <span style={{ fontSize: fonts.size.sm, lineHeight: "24px", color: colors.fg.base, textTransform: "uppercase", fontWeight: fonts.weight.medium, letterSpacing: "0.5px" }}>Net Worth</span>
                                    <Button variant="primary" color="default" size="sm"                                     iconLeft={<Plus size={14} strokeWidth={2.5} />} style={{ border: "none", transition: "filter 0.15s ease" }} onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.filter = ""; }} onClick={() => setShowNetWorthForm(true)}>
                                        Agregar Activo
                                    </Button>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <NetWorthWidgetContainer hideFrame />
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    backgroundColor: colors.bg.surface,
                                    borderRadius: radius.lg,
                                    padding: 0,
                                    border: `1px solid transparent`,
                                    overflow: "hidden",
                                    ...flexColumn,
                                    height: "622px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: `${spacing[3]} ${spacing[4]}`,
                                        borderBottom: `1px solid ${colors.border}`,
                                        flexShrink: 0,
                                    }}
                                >
                            <div style={{ ...flexRow, gap: spacing[2] }}>
                                <button
                                    className="heatmap-toggle"
                                    onClick={(e) => { e.stopPropagation(); setType(type === "expense" ? "income" : "expense"); }}
                                    style={{ ...ghostButton, ...flexRow, gap: spacing[1], height: "24px", padding: 0 }}
                                >
                                    <span title="Alternar entre egresos e ingresos" style={{ fontSize: fonts.size.sm, color: type === "expense" ? colors.accent.red : colors.accent.green, fontFamily: fonts.family, textTransform: "uppercase", fontWeight: fonts.weight.medium, letterSpacing: "0.5px", lineHeight: "24px", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>{type === "expense" ? "Egresos" : "Ingresos"}</span>
                                    <span style={{ fontSize: fonts.size.sm, color: colors.fg.dim, fontFamily: fonts.family, textTransform: "uppercase", fontWeight: fonts.weight.medium, letterSpacing: "0.5px", lineHeight: "24px", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>por</span>
                                    <span title="Alternar entre categoría y canal" onClick={(e) => { e.stopPropagation(); setDimension(dimension === "category" ? "channel" : "category"); }} style={{ fontSize: fonts.size.sm, color: colors.fg.base, textTransform: "uppercase", fontWeight: fonts.weight.medium, letterSpacing: "0.5px", cursor: "pointer", lineHeight: "24px" }}>{dimension === "category" ? "Categoría" : "Canal"}</span>
                                    <span style={{ fontSize: fonts.size.sm, color: colors.fg.dim, fontFamily: fonts.family, textTransform: "uppercase", fontWeight: fonts.weight.medium, letterSpacing: "0.5px", lineHeight: "24px", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>{currentYear}</span>
                                </button>
                            </div>
                            <HeatmapLegend isIncome={type === "income"} />
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            {type === "expense" ? (
                                expenseQuery.isLoading ? (
                                    <div style={{ color: colors.fg.dim, padding: spacing[4], textAlign: "center" }}>Cargando...</div>
                                ) : expenseQuery.isError ? (
                                    <div style={{ color: colors.accent.red, padding: spacing[4], textAlign: "center" }}>{getApiErrorMessage(expenseQuery.error) || "Error al cargar"}</div>
                                ) : (
                                    <Heatmap expenseData={expenseQuery.data} isIncome={false} dimension={dimension} currentYear={currentYear} />
                                )
                            ) : incomeQuery.isLoading ? (
                                <div style={{ color: colors.fg.dim, padding: spacing[4], textAlign: "center" }}>Cargando...</div>
                            ) : incomeQuery.isError ? (
                                <div style={{ color: colors.accent.red, padding: spacing[4], textAlign: "center" }}>{getApiErrorMessage(incomeQuery.error) || "Error al cargar"}</div>
                            ) : (
                                <Heatmap expenseData={incomeQuery.data} isIncome={true} dimension={dimension} currentYear={currentYear} />
                            )}
                        </div>
                    </div>
                )}

                <div style={{ ...flexColumn, height: "622px", justifyContent: "space-between" }}>
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
                            Estructura de Costos
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[2],
                            }}
                        >
                            <KPICard
                                label="Ratio Costos Fijos"
                                value={data.currentYtd.FixedCostRatio}
                                format="percent"
                                icon={Building2}
                                iconColor={colors.accent.orange}
                                compact
                                fixedHeight={76}
                                tooltip="Porcentaje de los ingresos acumulados que se destina a cubrir egresos fijos. Mide cuánto pesa tu estructura fija sobre tu ingreso total."
                            />
                            <KPICard
                                label="Mix Egresos Fijos"
                                value={data.currentYtd.FixedExpenseMix}
                                format="percent"
                                icon={PieChart}
                                iconColor={colors.accent.red}
                                compact
                                fixedHeight={76}
                                tooltip="Porcentaje de los egresos acumulados que corresponde a egresos fijos. Mide qué parte de tu egreso total es estructural y menos flexible."
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
                            Estabilidad de Ingresos
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[2],
                            }}
                        >
                            <KPICard
                                label="Mix Ingresos Fijos"
                                value={data.currentYtd.FixedIncomeMix}
                                format="percent"
                                icon={Briefcase}
                                iconColor={colors.accent.green}
                                compact
                                fixedHeight={76}
                                tooltip="Porcentaje de los ingresos totales que corresponde a ingresos fijos. Mide qué parte de tu ingreso total es estable y recurrente."
                            />
                            <KPICard
                                label="Cobertura Ingreso"
                                value={data.currentYtd.StableIncomeCoverage}
                                format="number"
                                suffix="x"
                                icon={Umbrella}
                                iconColor={colors.accent.purple}
                                compact
                                fixedHeight={76}
                                tooltip="Relación entre ingresos fijos y egresos fijos. Mide cuántas veces tu ingreso estable cubre tu estructura fija. Un valor superior a 1 indica una cobertura saludable."
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
                                marginBottom: spacing[1],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Liquidez
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[2],
                            }}
                        >
                            <KPICard
                                label="Flexibilidad"
                                value={data.currentYtd.FinancialFlexibility}
                                format="percent"
                                icon={Shuffle}
                                iconColor={colors.accent.cyan}
                                compact
                                fixedHeight={76}
                                tooltip="Porcentaje de los egresos totales que corresponde a egreso variable. Mide qué parte de tu estructura es ajustable en caso de necesitar recortar egreso."
                            />
                            <KPICard
                                label="Meses Cobertura"
                                value={data.currentYtd.ExpenseCoverageMonths}
                                format="number"
                                icon={Hourglass}
                                iconColor={colors.accent.purple}
                                compact
                                fixedHeight={76}
                                tooltip="Cantidad de meses que tu capital actual podría cubrir tomando como referencia tu egreso mensual actual. Mide tu capacidad de sostén financiero."
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
                                marginBottom: spacing[1],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Proyecciones
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[2],
                            }}
                        >
                            <KPICard
                                label="Ahorro Proyectado"
                                value={data.currentYtd.ProjectedYearlySavings}
                                format="currency"
                                icon={Target}
                                iconColor={colors.accent.cyan}
                                compact
                                fixedHeight={76}
                                tooltip="Ahorro estimado al cierre del año si se mantiene el ritmo actual de ahorro. Mide la proyección anual de generación de ahorro."
                            />
                            <KPICard
                                label="Capital Proyectado"
                                value={data.currentYtd.ProjectedYearlyCapital}
                                format="currency"
                                icon={Gem}
                                iconColor={colors.accent.blue}
                                compact
                                fixedHeight={76}
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
                                marginBottom: spacing[1],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Crecimiento
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[2],
                            }}
                        >
                            <KPICard
                                label="Tasa Crecimiento"
                                value={data.currentYtd.CapitalGrowthRateYTD}
                                format="percent"
                                icon={Sprout}
                                iconColor={colors.accent.green}
                                compact
                                fixedHeight={76}
                                tooltip="Porcentaje del capital actual explicado por el ahorro acumulado del año. Mide la velocidad a la que el ahorro está expandiendo tu base de capital."
                            />
                            <KPICard
                                label="Egreso Core"
                                value={data.currentYtd.CoreBurnRate}
                                format="currency"
                                icon={Flame}
                                iconColor={colors.accent.yellow}
                                compact
                                fixedHeight={76}
                                tooltip="Nivel mínimo de egreso estructural mensual necesario para sostener tu operación personal. Representa el 'piso' de egreso que no puede reducirse fácilmente."
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
                                marginBottom: spacing[1],
                                paddingLeft: spacing[1],
                            }}
                        >
                            Riesgo
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: spacing[2],
                            }}
                        >
                            <KPICard
                                label="Volatilidad"
                                value={data.currentYtd.SavingsVolatility}
                                format="number"
                                icon={Waves}
                                iconColor={colors.accent.yellow}
                                compact
                                fixedHeight={76}
                                tooltip="Mide la variabilidad del ahorro mensual a lo largo del año. Un valor más alto indica menor estabilidad en la generación de ahorro mes a mes."
                            />
                            <KPICard
                                label="Ratio Volatilidad"
                                value={data.currentYtd.SavingsVolatilityRatio}
                                format="percent"
                                icon={Gauge}
                                iconColor={colors.accent.yellow}
                                compact
                                fixedHeight={76}
                                tooltip="Relación entre la volatilidad del ahorro y el ahorro promedio. Mide la estabilidad relativa de la generación de ahorro."
                            />
                        </div>
                    </div>
                </div>
            </div>
            </>
            )}
            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title={helpContent.analysis.title}
                intro={helpContent.analysis.intro}
                sections={helpContent.analysis.sections}
            />
        </div>
    );
}
