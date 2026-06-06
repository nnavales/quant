import { useState } from "react";
import { spacing } from "@/styles/theme";
import {
    DollarSection,
    UsdtSection,
    BtcSection,
    EthSection,
    CountryRiskSection,
    InflationSection,
} from "@/components/EconomicMetrics";
import { EconomicComparatives } from "@/components/EconomicComparatives";
import { flexColumn } from "@/styles/layout";
import { HelpModal } from "@/components/ui/HelpModal";
import { PageHeader, HelpButton } from "@/components/ui/PageHeader";
import { helpContent } from "@/data/helpContent";

export function EconomicPage() {
    const [showHelp, setShowHelp] = useState(false);
    return (
        <div style={{ padding: spacing[3], ...flexColumn, gap: spacing[3], animation: "fadeIn 0.2s ease-out" }}>
            <PageHeader
                title="Datos Económicos"
                subtitle="Dólar, tasas y créditos"
                actions={<HelpButton onClick={() => setShowHelp(true)} />}
            />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: spacing[4],
                }}
            >
                <DollarSection />
                <UsdtSection />
                <BtcSection />
                <EthSection />
                <CountryRiskSection />
                <InflationSection />
            </div>

            <EconomicComparatives />

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title={helpContent.economic.title}
                intro={helpContent.economic.intro}
                sections={helpContent.economic.sections}
            />
        </div>
    );
}
