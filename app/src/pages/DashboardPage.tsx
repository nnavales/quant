import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Percent, BarChart3, Calendar } from "lucide-react";
import { useDashboard } from "@/hooks";
import type { KPI } from "@/api_client/types";
import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { TransactionModal } from "@/components/TransactionModal";
import { KPICard } from "@/components/KPICard";
import { KPISimpleModal } from "@/components/KPIEvolutionModal";
import { NetWorthWidgetContainer } from "@/components/NetWorthWidget";
import { RecentTransactions } from "@/components/RecentTransactions";

const KPI_ICONS: Record<string, React.ElementType> = {
    capital_total: Wallet,
    net_savings_ytd: PiggyBank,
    income_ytd: TrendingUp,
    expenses_ytd: TrendingDown,
    savings_margin: Percent,
    avg_monthly_savings: PiggyBank,
    fixed_cost_ratio: BarChart3,
    fixed_expense_mix: TrendingDown,
    fixed_income_mix: TrendingUp,
    stable_income_coverage: Percent,
    financial_flexibility: Wallet,
    core_burn_rate: Wallet,
    savings_volatility: BarChart3,
    savings_volatility_ratio: Percent,
    projected_yearly_savings: PiggyBank,
    projected_yearly_capital: Wallet,
    capital_growth_rate_ytd: TrendingUp,
    expense_coverage_months: Calendar,
};

const KPI_COLORS: Record<string, string> = {
    capital_total: colors.accent.cyan,
    net_savings_ytd: colors.accent.green,
    income_ytd: colors.accent.green,
    expenses_ytd: colors.accent.red,
    savings_margin: colors.accent.purple,
    avg_monthly_savings: colors.accent.green,
    fixed_cost_ratio: colors.accent.orange,
    fixed_expense_mix: colors.accent.red,
    fixed_income_mix: colors.accent.green,
    stable_income_coverage: colors.accent.purple,
    financial_flexibility: colors.accent.cyan,
    core_burn_rate: colors.accent.yellow,
    savings_volatility: colors.accent.yellow,
    savings_volatility_ratio: colors.accent.yellow,
    projected_yearly_savings: colors.accent.green,
    projected_yearly_capital: colors.accent.cyan,
    capital_growth_rate_ytd: colors.accent.green,
    expense_coverage_months: colors.accent.purple,
};


export function DashboardPage() {
    const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
    const [transactionModal, setTransactionModal] = useState<{ open: boolean; type: "income" | "expense" }>({ open: false, type: "expense" });
    const { data, isLoading, isError } = useDashboard();

    const handleAddIncome = () => setTransactionModal({ open: true, type: "income" });
    const handleAddExpense = () => setTransactionModal({ open: true, type: "expense" });

    if (isLoading) {
        return <div style={{ padding: spacing[4], color: colors.fg.dim }}>Cargando dashboard...</div>;
    }

    if (isError) {
        return <div style={{ padding: spacing[4], color: colors.accent.red }}>Error al cargar dashboard</div>;
    }

    if (!data || !data.monthlySeries || data.monthlySeries.length === 0) {
        return <div style={{ padding: spacing[4], color: colors.fg.dim }}>Sin datos</div>;
    }

    const current = data.monthlySeries[data.monthlySeries.length - 1];
    const previous = data.monthlySeries[data.monthlySeries.length - 2];
    const monthsShort = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sept","Oct","Nov","Dic"];
    const currentMonthLabel = (() => {
        const [y, m] = current.month.split("-");
        return `${monthsShort[parseInt(m) - 1]} ${y}`;
    })();

    const getChangeLabel = (previousMonth?: string) => {
        if (!previousMonth) return "vs mes anterior";
        const prevMonthName = previousMonth.split("-")[1];
        const months = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"];
        const monthNum = prevMonthName ? parseInt(prevMonthName, 10) : 0;
        return `vs ${months[monthNum] || prevMonthName}`;
    };

    return (
        <div style={{ padding: spacing[3], display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {selectedKPI && <KPISimpleModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />}
            <TransactionModal
                isOpen={transactionModal.open}
                onClose={() => setTransactionModal({ open: false, type: transactionModal.type })}
                type={transactionModal.type}
            />

            <div>
                <h1 style={{ fontFamily: fonts.family.display, fontSize: fonts.size.xl, fontWeight: fonts.weight.semibold, color: colors.fg.base, margin: 0, marginBottom: spacing[1] }}>Bienvenido</h1>
                <p style={{ fontFamily: fonts.family.text, fontSize: fonts.size.sm, color: colors.fg.dim, margin: 0 }}>Aquí está tu resumen financiero</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: spacing[3] }}>
                <KPICard label="Balance" value={current.capital} prevValue={previous?.capital} changeLabel={getChangeLabel(previous?.month)} currentMonth={currentMonthLabel} icon={KPI_ICONS.capital_total} iconColor={KPI_COLORS.capital_total} format="currency" />
                <KPICard label="Ahorro" value={current.savings} prevValue={previous?.savings} changeLabel={getChangeLabel(previous?.month)} currentMonth={currentMonthLabel} icon={KPI_ICONS.net_savings_ytd} iconColor={KPI_COLORS.net_savings_ytd} format="currency" />
                <KPICard label="Ingresos" value={current.income} prevValue={previous?.income} changeLabel={getChangeLabel(previous?.month)} currentMonth={currentMonthLabel} icon={KPI_ICONS.income_ytd} iconColor={KPI_COLORS.income_ytd} format="currency" />
                <KPICard label="Gastos" value={current.expense} prevValue={previous?.expense} changeLabel={getChangeLabel(previous?.month)} currentMonth={currentMonthLabel} icon={KPI_ICONS.expenses_ytd} iconColor={KPI_COLORS.expenses_ytd} format="currency" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: spacing[4], alignItems: "stretch" }}>
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <RecentTransactions limit={8} onAddIncome={handleAddIncome} onAddExpense={handleAddExpense} />
                </div>
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <NetWorthWidgetContainer />
                </div>
            </div>
        </div>
    );
}