import { useState } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Tooltip } from "@/components/ui/Tooltip";
import { HelpCircle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/utils/format";

export interface KPICardToggleProps {
    label: string;
    toggleLabel?: string;
    value?: number | null;
    toggleValue?: number | null;
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
    year?: number;
    currentMonth?: string;
    changeDiff?: string;
    changeDiffColor?: string;
    changeDiffLabel?: string;
    toggleChangeDiff?: string;
    toggleChangeDiffColor?: string;
    toggleChangeDiffLabel?: string;
    segments?: [string, string];
    toggleChangeLabel?: string;
    inverseTrend?: boolean;
}

export function KPICardToggle({
    label,
    toggleLabel,
    value,
    toggleValue,
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
    year,
    currentMonth,
    segments,
    toggleChangeLabel,
    changeDiff,
    changeDiffColor,
    changeDiffLabel,
    toggleChangeDiff,
    toggleChangeDiffColor,
    toggleChangeDiffLabel,
    inverseTrend = false,
}: KPICardToggleProps) {
    const [showToggle, setShowToggle] = useState(false);

    const activeValue = showToggle ? toggleValue : value;
    const otherValue = showToggle ? value : toggleValue;
    const hasValue = activeValue !== undefined && activeValue !== null;

    const displayValue = !hasValue
        ? "—"
        : format === "currency"
            ? formatCurrency(activeValue)
            : format === "percent"
              ? formatPercent(activeValue)
              : activeValue.toFixed(0) + (suffix || "");

    const otherDisplayValue = otherValue !== undefined && otherValue !== null
        ? format === "currency"
            ? formatCurrency(otherValue)
            : format === "percent"
              ? formatPercent(otherValue)
              : otherValue.toFixed(0) + (suffix || "")
        : "—";

    const change =
        hasValue && prevValue !== undefined && prevValue !== null && prevValue !== 0
            ? ((activeValue - prevValue) / prevValue) * 100
            : null;
    const isPositive = change !== null && change >= 0;

    const padding = compact ? spacing[2] : spacing[4];
    const fontSize = compact ? fonts.size.base : "25px";
    const iconSize = compact ? 14 : 18;
    const labelSize = compact ? fonts.size.xs : "12px";

    const hasSegments = !!segments && !compact;
    const displayLabel = hasSegments ? label : (showToggle ? (toggleLabel ?? label) : label);

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                padding,
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${iconColor}`,
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                cursor: onClick ? "pointer" : "default",
                position: "relative",
                height: fixedHeight ? `${fixedHeight}px` : undefined,
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
                        fontWeight: 600,
                        color: colors.fg.dim,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                    }}
                >
                    {displayLabel}
                </span>
                {tooltip && !compact && (
                    <Tooltip content={tooltip} alwaysShow>
                        <HelpCircle size={12} color={colors.fg.dim} style={{ opacity: 0.5 }} />
                    </Tooltip>
                )}
                {hasSegments && (
                    <div style={{ display: "flex", gap: 2, marginLeft: spacing[2] }}>
                        {segments.map((seg, i) => {
                            const isActive = (i === 0) !== showToggle;
                            return (
                                <span
                                    key={seg}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isActive) setShowToggle(i === 1);
                                    }}
                                    style={{
                                        fontSize: fonts.size.xs,
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? iconColor : colors.fg.dim,
                                        backgroundColor: isActive ? colors.fill : "transparent",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        border: isActive ? "none" : `1px solid ${colors.border}`,
                                        lineHeight: "18px",
                                    }}
                                >
                                    {seg}
                                </span>
                            );
                        })}
                    </div>
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
            <div style={{ display: "flex", alignItems: "baseline", gap: spacing[2] }}>
                <div
                    className="selectable"
                    style={{
                        fontSize,
                        fontWeight: 700,
                        fontFamily: fonts.family.display,
                        color: colors.fg.base,
                    }}
                >
                    {displayValue}
                </div>
                {!hasSegments && otherValue !== undefined && otherValue !== null && !compact && (
                    <span style={{ fontSize, fontWeight: 600, fontFamily: fonts.family.display, color: colors.fg.dim }}>/</span>
                )}
                {!hasSegments && otherValue !== undefined && otherValue !== null && !compact && (
                    <span
                        className="selectable"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowToggle(prev => !prev);
                        }}
                        style={{
                            fontSize: fonts.size.lg,
                            fontFamily: fonts.family.display,
                            fontWeight: 500,
                            color: colors.fg.dim,
                            cursor: "pointer",
                        }}
                    >
                        {otherDisplayValue}
                    </span>
                )}
            </div>
            {(change !== null || (showToggle ? (toggleChangeDiff ?? toggleChangeDiffLabel) : (changeDiff ?? changeDiffLabel)) !== undefined) && !compact && (
                <div
                    style={{
                        fontSize: "11.5px",
                        marginTop: spacing[1],
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                    }}
                >
                    {change !== null && (
                        <div style={{ color: inverseTrend ? (isPositive ? colors.accent.red : colors.accent.green) : (isPositive ? colors.accent.green : colors.accent.red) }}>
                            <span className="selectable" style={{ fontWeight: 500 }}>{isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%</span>{" "}
                            <span style={{ color: colors.fg.dim }}>{showToggle && toggleChangeLabel ? toggleChangeLabel : (changeLabel || "vs período anterior")}</span>
                        </div>
                    )}
                    {showToggle ? (
                        (toggleChangeDiff ?? toggleChangeDiffLabel) !== undefined && (
                            <div>
                                {toggleChangeDiff !== undefined && <span className="selectable" style={{ color: toggleChangeDiffColor ?? colors.fg.dim }}>{toggleChangeDiff}</span>}
                                {toggleChangeDiffLabel !== undefined && <span style={{ color: colors.fg.dim }}>{" "}{toggleChangeDiffLabel}</span>}
                            </div>
                        )
                    ) : (
                        (changeDiff ?? changeDiffLabel) !== undefined && (
                            <div>
                                {changeDiff !== undefined && <span className="selectable" style={{ color: changeDiffColor ?? colors.fg.dim }}>{changeDiff}</span>}
                                {changeDiffLabel !== undefined && <span style={{ color: colors.fg.dim }}>{" "}{changeDiffLabel}</span>}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
