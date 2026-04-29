import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import {
    DollarSection,
    UsdtSection,
    BtcSection,
    EthSection,
    CountryRiskSection,
    InflationSection,
} from "@/components/EconomicMetrics";
import { EconomicComparatives } from "@/components/EconomicComparatives";

export function EconomicPage() {
    return (
        <div style={{ padding: spacing[3], display: "flex", flexDirection: "column", gap: spacing[4] }}>
            <div>
                <h1 style={{ fontFamily: fonts.family.display, fontSize: fonts.size.xl, fontWeight: fonts.weight.semibold, color: colors.fg.base, margin: 0, marginBottom: spacing[1] }}>Datos Económicos</h1>
                <p style={{ fontFamily: fonts.family.text, fontSize: fonts.size.sm, color: colors.fg.dim, margin: 0 }}>Dólar, inflación y más</p>
            </div>

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: spacing[4], marginTop: spacing[8] }}>
                <EconomicComparatives />
            </div>
        </div>
    );
}
