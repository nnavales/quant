import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Tooltip } from "@/components/ui/Tooltip";
import { HelpCircle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/utils/format";

export interface KPICardProps {
    label: string;
    value: number;
    format?: "currency" | "percent" | "number";
    suffix?: string;
    icon: React.ElementType;
    iconColor: string;
    compact?: boolean;
    onClick?: () => void;
    prevValue?: number;
    changeLabel?: string;
    directChange?: number;
    tooltip?: string;
    year?: number;
    currentMonth?: string;
}

export function KPICard({
    label,
    value,
    format = "number",
    suffix,
    icon: Icon,
    iconColor,
    compact = false,
    onClick,
    prevValue,
    changeLabel,
    directChange,
    tooltip,
    year,
    currentMonth,
}: KPICardProps) {
    const displayValue =
        format === "currency"
            ? formatCurrency(value)
            : format === "percent"
              ? formatPercent(value)
              : value.toFixed(0) + (suffix || "");

    const change =
        prevValue !== undefined && prevValue !== 0
            ? ((value - prevValue) / prevValue) * 100
            : null;
    const isPositive = change !== null && change >= 0;

    const padding = compact ? spacing[2] : spacing[4];
    const fontSize = compact ? fonts.size.base : fonts.size["2xl"];
    const iconSize = compact ? 14 : 18;
    const labelSize = compact ? fonts.size.xs : fonts.size.xs;

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                padding,
                border: `1px solid ${colors.fill}`,
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                cursor: onClick ? "pointer" : "default",
                position: "relative",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[1],
                    marginBottom: spacing[1],
                }}
            >
                <Icon size={iconSize} color={iconColor} />
                <span
                    style={{
                        fontSize: labelSize,
                        color: colors.fg.dim,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                    }}
                >
                    {label}
                </span>
                {tooltip && !compact && (
                    <Tooltip content={tooltip} alwaysShow>
                        <HelpCircle size={12} color={colors.fg.dim} style={{ opacity: 0.5 }} />
                    </Tooltip>
                )}
                {year && (
                    <span
                        style={{
                            fontSize: fonts.size.xs,
                            color: colors.fg.dim,
                            opacity: 0.7,
                            marginLeft: "auto",
                        }}
                    >
                        {year}
                    </span>
                )}
                {currentMonth && !year && (
                    <span
                        style={{
                            fontSize: fonts.size.xs,
                            color: colors.fg.dim,
                            opacity: 0.7,
                            marginLeft: "auto",
                        }}
                    >
                        {currentMonth}
                    </span>
                )}
                {tooltip && compact && (
                    <span style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                        <Tooltip content={tooltip} alwaysShow>
                            <HelpCircle size={12} color={colors.fg.dim} style={{ opacity: 0.5 }} />
                        </Tooltip>
                    </span>
                )}
            </div>
            <div
                style={{
                    fontSize,
                    fontWeight: 600,
                    fontFamily: fonts.family.display,
                    color: colors.fg.base,
                }}
            >
                {displayValue}
            </div>
            {change !== null && !compact && (
                <div
                    style={{
                        fontSize: fonts.size.xs,
                        color: isPositive ? colors.accent.green : colors.accent.red,
                        marginTop: spacing[1],
                    }}
                >
                    {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%{" "}
                    {changeLabel || "vs período anterior"}
                </div>
            )}
            {directChange !== undefined && !compact && (
                <div
                    style={{
                        fontSize: fonts.size.xs,
                        color: directChange >= 0 ? colors.accent.green : colors.accent.red,
                        marginTop: spacing[1],
                    }}
                >
                    {directChange >= 0 ? "▲" : "▼"} {Math.abs(directChange * 100).toFixed(1)}%{" "}
                    {changeLabel}
                </div>
            )}
        </div>
    );
}
