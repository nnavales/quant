import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Tooltip } from "@/components/ui/Tooltip";
import { Info } from "lucide-react";
import { formatCurrency, formatPercent } from "@/utils/format";
import { flexColumn, flexRow } from "@/styles/layout";

export interface KPICardProps {
    label: string;
    value?: number | null;
    format?: "currency" | "percent" | "number";
    suffix?: string;
    icon: React.ElementType;
    iconColor: string;
    compact?: boolean;
    fixedHeight?: number;
    onClick?: () => void;
    prevValue?: number | null;
    changeLabel?: string;
    tooltip?: string;
    changeDiff?: string;
    changeDiffColor?: string;
    changeDiffLabel?: string;
}

export function KPICard({
    label,
    value,
    format = "number",
    suffix,
    icon: Icon,
    iconColor,
    compact = false,
    fixedHeight,
    onClick,
    prevValue,
    changeLabel,
    tooltip,
    changeDiff,
    changeDiffColor,
    changeDiffLabel,
}: KPICardProps) {
    const hasValue = value !== undefined && value !== null;

    const displayValue = !hasValue
        ? "—"
        : format === "currency"
            ? formatCurrency(value)
            : format === "percent"
              ? formatPercent(value)
              : value.toFixed(0) + (suffix || "");

    const change =
        hasValue && prevValue !== undefined && prevValue !== null && prevValue !== 0
            ? ((value - prevValue) / prevValue) * 100
            : null;
    const isPositive = change !== null && change >= 0;

    const padding = compact ? spacing[2] : spacing[4];
    const fontSize = compact ? fonts.size.base : "25px";
    const iconSize = compact ? 14 : 18;
    const labelSize = compact ? fonts.size.xs : fonts.size.xs3;

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                padding,
                border: `1px solid transparent`,
                display: "flex",
                flexDirection: "column",
                cursor: onClick ? "pointer" : "default",
                position: "relative",
                height: fixedHeight ? `${fixedHeight}px` : undefined,
            }}
        >
            <div
                style={{
                    ...flexRow,
                    gap: spacing[1],
                    marginBottom: spacing[1],
                }}
            >
                <Icon size={iconSize} strokeWidth={2.5} color={iconColor} />
                <span
                    style={{
                        fontSize: labelSize,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.dim,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                    }}
                >
                    {label}
                </span>
                {tooltip && (
                    <span style={{ ...flexRow, marginLeft: "auto" }}>
                        <Tooltip content={tooltip} alwaysShow>
                            <Info size={13} strokeWidth={2.5} color={colors.fg.dim} style={{ opacity: 0.6 }} />
                        </Tooltip>
                    </span>
                )}
            </div>
            <div
                className="selectable"
                style={{
                    fontSize,
                    fontWeight: fonts.weight.bold,
                    fontFamily: fonts.family,
                    color: colors.fg.base,
                }}
            >
                {displayValue}
            </div>
            {(change !== null || changeDiff !== undefined || changeDiffLabel !== undefined) && !compact && (
                <div
                    style={{
                        fontSize: fonts.size.xs2,
                        marginTop: spacing[1],
                        ...flexColumn,
                        gap: "2px",
                    }}
                >
                    {change !== null && (
                        <div style={{ color: isPositive ? colors.accent.green : colors.accent.red }}>
                            <span className="selectable" style={{ fontWeight: fonts.weight.medium }}>{isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%</span>{" "}
                            <span style={{ color: colors.fg.dim }}>{changeLabel || "vs período anterior"}</span>
                        </div>
                    )}
                    {(changeDiff !== undefined || changeDiffLabel !== undefined) && (
                        <div>
                            {changeDiff !== undefined && <span className="selectable" style={{ color: changeDiffColor ?? colors.fg.dim }}>{changeDiff}</span>}
                            {changeDiffLabel !== undefined && <span style={{ color: colors.fg.dim }}>{" "}{changeDiffLabel}</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
