import { Tooltip } from "@/components/ui/Tooltip";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatCurrency } from "@/utils/format";

interface MetricCardProps {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    real?: number;
    fcst?: number;
    plan?: number;
    ly?: number;
    unit?: string;
    compact?: boolean;
}

export function MetricCard({ title, icon: Icon, iconColor, real, fcst, plan, ly, unit = "", compact = false }: MetricCardProps) {
    const vsFcst = real !== undefined && fcst !== undefined ? real - fcst : undefined;
    const vsPlan = real !== undefined && plan !== undefined ? real - plan : undefined;
    const vsLyPct = real !== undefined && ly !== undefined && ly !== 0 ? ((real - ly) / ly) : undefined;

    return (
        <div
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                padding: compact ? spacing[3] : spacing[4],
                display: "flex",
                flexDirection: "column",
                gap: compact ? spacing[1] : spacing[3],
                minHeight: compact ? "auto" : 140,
                animation: "fadeIn 0.3s ease-out",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                <Icon size={compact ? 14 : 18} color={iconColor} />
                <span style={{ fontSize: compact ? fonts.size.xs : fonts.size.sm, color: colors.fg.dim, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {title}
                </span>
            </div>

            <div style={{
                fontSize: compact ? fonts.size.xl : fonts.size["3xl"],
                fontWeight: 700,
                fontFamily: fonts.family.display,
                color: colors.fg.base,
                lineHeight: 1.1,
            }}>
                {formatCurrency(real ?? 0, { decimals: 0 })}
                {unit && <span style={{ fontSize: compact ? fonts.size.sm : fonts.size.lg, color: colors.fg.dim, fontWeight: 400, marginLeft: spacing[1] }}>{unit}</span>}
            </div>

            <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                {fcst !== undefined && (
                    <Tooltip content={`Proyectado: ${formatCurrency(fcst)}`}>
                        <span style={{
                            fontSize: fonts.size.xs,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: fonts.weight.medium,
                            backgroundColor: vsFcst !== undefined ? (vsFcst >= 0 ? `${colors.accent.green}15` : `${colors.accent.red}15`) : `${colors.fill}30`,
                            color: vsFcst !== undefined ? (vsFcst >= 0 ? colors.accent.green : colors.accent.red) : colors.fg.dim,
                        }}>
                            FCST {vsFcst !== undefined ? `${vsFcst >= 0 ? "+" : ""}${formatCurrency(vsFcst)}` : "—"}
                        </span>
                    </Tooltip>
                )}
                {plan !== undefined && (
                    <Tooltip content={`Plan: ${formatCurrency(plan)}`}>
                        <span style={{
                            fontSize: fonts.size.xs,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: fonts.weight.medium,
                            backgroundColor: vsPlan !== undefined ? (vsPlan >= 0 ? `${colors.accent.cyan}15` : `${colors.accent.red}15`) : `${colors.fill}30`,
                            color: vsPlan !== undefined ? (vsPlan >= 0 ? colors.accent.cyan : colors.accent.red) : colors.fg.dim,
                        }}>
                            PLAN {vsPlan !== undefined ? `${vsPlan >= 0 ? "+" : ""}${formatCurrency(vsPlan)}` : "—"}
                        </span>
                    </Tooltip>
                )}
                {ly !== undefined && (
                    <Tooltip content={`Anterior: ${formatCurrency(ly)}`}>
                        <span style={{
                            fontSize: fonts.size.xs,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: fonts.weight.medium,
                            backgroundColor: vsLyPct !== undefined ? (vsLyPct >= 0 ? `${colors.accent.green}15` : `${colors.accent.red}15`) : `${colors.fill}30`,
                            color: vsLyPct !== undefined ? (vsLyPct >= 0 ? colors.accent.green : colors.accent.red) : colors.fg.dim,
                        }}>
                            LY {vsLyPct !== undefined ? `${vsLyPct >= 0 ? "+" : ""}${(vsLyPct * 100).toFixed(1)}%` : "—"}
                        </span>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}