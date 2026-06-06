import { useState, useRef, useEffect } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Tooltip } from "@/components/ui/Tooltip";
import { Info } from "lucide-react";
import { formatCurrency, formatPercent } from "@/utils/format";
import { flexColumn, flexRow } from "@/styles/layout";

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
    togglePrevValue?: number | null;
    changeLabel?: string;
    tooltip?: string;
    changeDiff?: string;
    changeDiffColor?: string;
    changeDiffLabel?: string;
    toggleChangeDiff?: string;
    toggleChangeDiffColor?: string;
    toggleChangeDiffLabel?: string;
    segments?: [string, string];
    toggleChangeLabel?: string;
    inverseTrend?: boolean;
    closedChangeDiff?: string;
    closedChangeDiffColor?: string;
    closedChangeDiffLabel?: string;
    closedToggleChangeDiff?: string;
    closedToggleChangeDiffColor?: string;
    closedToggleChangeDiffLabel?: string;
}

function SlidingToggle({
    segments,
    showToggle,
    setShowToggle,
    iconColor,
}: {
    segments: [string, string];
    showToggle: boolean;
    setShowToggle: (v: boolean) => void;
    iconColor: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelRefs = useRef<(HTMLSpanElement | null)[]>([null, null]);
    const [indicatorStyle, setIndicatorStyle] = useState({
        width: 0,
        transform: "translateX(0px)",
    });

    useEffect(() => {
        const el = labelRefs.current[showToggle ? 1 : 0];
        if (el && containerRef.current) {
            const parentRect = containerRef.current.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            setIndicatorStyle({
                width: rect.width,
                transform: `translateX(${rect.left - parentRect.left}px)`,
            });
        }
    }, [showToggle, segments]);

    return (
        <div
            ref={containerRef}
            style={{ position: "relative", display: "flex", marginLeft: spacing[2] }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: indicatorStyle.width,
                    transform: indicatorStyle.transform,
                    backgroundColor: colors.fill,
                    borderRadius: "4px",
                    transition: "transform 0.2s, width 0.2s",
                }}
            />
            {segments.map((seg, i) => {
                const isActive = (i === 0) !== showToggle;
                return (
                    <span
                        key={seg}
                        ref={(el) => {
                            labelRefs.current[i] = el;
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isActive) setShowToggle(i === 1);
                        }}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            fontSize: fonts.size.xs,
                            fontWeight: isActive ? fonts.weight.semibold : fonts.weight.medium,
                            color: isActive ? iconColor : colors.fg.dim,
                            padding: "1px 6px",
                            cursor: "pointer",
                            lineHeight: "18px",
                            userSelect: "none",
                        }}
                    >
                        {seg}
                    </span>
                );
            })}
        </div>
    );
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
    togglePrevValue,
    changeLabel,
    tooltip,
    segments,
    toggleChangeLabel,
    changeDiff,
    changeDiffColor,
    changeDiffLabel,
    toggleChangeDiff,
    toggleChangeDiffColor,
    toggleChangeDiffLabel,
    inverseTrend = false,
    closedChangeDiff,
    closedChangeDiffColor,
    closedChangeDiffLabel,
    closedToggleChangeDiff,
    closedToggleChangeDiffColor,
    closedToggleChangeDiffLabel,
}: KPICardToggleProps) {
    const [showToggle, setShowToggle] = useState(false);
    const [closedMode, setClosedMode] = useState(false);
    const [labelHover, setLabelHover] = useState(false);

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

    const otherDisplayValue =
        otherValue !== undefined && otherValue !== null
            ? format === "currency"
                ? formatCurrency(otherValue)
                : format === "percent"
                  ? formatPercent(otherValue)
                  : otherValue.toFixed(0) + (suffix || "")
            : "—";

    const effectivePrevValue =
        showToggle && togglePrevValue !== undefined ? togglePrevValue : prevValue;
    const change =
        hasValue &&
        effectivePrevValue !== undefined &&
        effectivePrevValue !== null &&
        effectivePrevValue !== 0
            ? ((activeValue - effectivePrevValue) / effectivePrevValue) * 100
            : null;
    const isPositive = change !== null && change >= 0;

    const padding = compact ? spacing[2] : spacing[4];
    const fontSize = compact ? fonts.size.base : "25px";
    const iconSize = compact ? 14 : 18;
    const labelSize = compact ? fonts.size.xs : fonts.size.xs3;

    const hasSegments = !!segments && !compact;
    const effectiveLabel = hasSegments ? label : showToggle ? (toggleLabel ?? label) : label;

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                padding,
                border: `1px solid transparent`,
                borderLeft: `3px solid ${iconColor}`,
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
                    {effectiveLabel}
                </span>
                {hasSegments && (
                    <SlidingToggle
                        segments={segments}
                        showToggle={showToggle}
                        setShowToggle={setShowToggle}
                        iconColor={iconColor}
                    />
                )}
                {tooltip && (
                    <span style={{ ...flexRow, marginLeft: "auto" }}>
                        <Tooltip content={tooltip} alwaysShow>
                            <Info size={13} strokeWidth={2.5} color={colors.fg.dim} style={{ opacity: 0.6 }} />
                        </Tooltip>
                    </span>
                )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: spacing[2] }}>
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
                {!hasSegments && otherValue !== undefined && otherValue !== null && !compact && (
                    <span
                        style={{
                            fontSize,
                            fontWeight: fonts.weight.semibold,
                            fontFamily: fonts.family,
                            color: colors.fg.dim,
                        }}
                    >
                        /
                    </span>
                )}
                {!hasSegments && otherValue !== undefined && otherValue !== null && !compact && (
                    <span
                        className="selectable"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowToggle((prev) => !prev);
                        }}
                        style={{
                            fontSize: fonts.size.lg,
                            fontFamily: fonts.family,
                            fontWeight: fonts.weight.medium,
                            color: colors.fg.dim,
                            cursor: "pointer",
                        }}
                    >
                        {otherDisplayValue}
                    </span>
                )}
            </div>
            {(change !== null ||
                (closedMode
                    ? showToggle
                        ? (closedToggleChangeDiff ?? closedToggleChangeDiffLabel)
                        : (closedChangeDiff ?? closedChangeDiffLabel)
                    : showToggle
                      ? (toggleChangeDiff ?? toggleChangeDiffLabel)
                      : (changeDiff ?? changeDiffLabel)) !== undefined) &&
                !compact && (
                    <div
                        style={{
                            fontSize: fonts.size.xs2,

                            marginTop: spacing[1],
                            ...flexColumn,
                            gap: "2px",
                        }}
                    >
                        {change !== null && (
                            <div
                                style={{
                                    color: inverseTrend
                                        ? isPositive
                                            ? colors.accent.red
                                            : colors.accent.green
                                        : isPositive
                                          ? colors.accent.green
                                          : colors.accent.red,
                                }}
                            >
                                <span
                                    className="selectable"
                                    style={{ fontWeight: fonts.weight.medium }}
                                >
                                    {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                                </span>{" "}
                                <span style={{ color: colors.fg.dim }}>
                                    {showToggle && toggleChangeLabel
                                        ? toggleChangeLabel
                                        : changeLabel || "vs período anterior"}
                                </span>
                            </div>
                        )}
                        {(() => {
                            const isToggleActive = showToggle;
                            const toggleMode = () => setClosedMode((p) => !p);
                            const canToggleClosed =
                                closedChangeDiff !== undefined ||
                                closedChangeDiffLabel !== undefined ||
                                closedToggleChangeDiff !== undefined ||
                                closedToggleChangeDiffLabel !== undefined;
                            const labelStyle = {
                                color: colors.fg.dim as string,
                                cursor: canToggleClosed
                                    ? ("pointer" as const)
                                    : ("default" as const),
                                textDecoration:
                                    labelHover && canToggleClosed ? "underline" : "none",
                                textUnderlineOffset: 2,
                            };
                            const labelClick = canToggleClosed
                                ? (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      toggleMode();
                                  }
                                : undefined;
                            const labelEnter = canToggleClosed
                                ? () => setLabelHover(true)
                                : undefined;
                            const labelLeave = canToggleClosed
                                ? () => setLabelHover(false)
                                : undefined;
                            if (closedMode) {
                                if (isToggleActive) {
                                    return (closedToggleChangeDiff ??
                                        closedToggleChangeDiffLabel) !== undefined ? (
                                        <div>
                                            {closedToggleChangeDiff !== undefined && (
                                                <span
                                                    className="selectable"
                                                    style={{
                                                        fontWeight: fonts.weight.medium,
                                                        color:
                                                            closedToggleChangeDiffColor ??
                                                            colors.fg.dim,
                                                    }}
                                                >
                                                    {closedToggleChangeDiff}
                                                </span>
                                            )}
                                            {closedToggleChangeDiffLabel !== undefined && (
                                                <>
                                                    {" "}
                                                    <span
                                                        onClick={labelClick}
                                                        onMouseEnter={labelEnter}
                                                        onMouseLeave={labelLeave}
                                                        style={labelStyle}
                                                    >
                                                        {closedToggleChangeDiffLabel}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ) : null;
                                }
                                return (closedChangeDiff ?? closedChangeDiffLabel) !== undefined ? (
                                    <div>
                                        {closedChangeDiff !== undefined && (
                                            <span
                                                className="selectable"
                                                style={{
                                                    fontWeight: fonts.weight.medium,
                                                    color: closedChangeDiffColor ?? colors.fg.dim,
                                                }}
                                            >
                                                {closedChangeDiff}
                                            </span>
                                        )}
                                        {closedChangeDiffLabel !== undefined && (
                                            <>
                                                {" "}
                                                <span
                                                    onClick={labelClick}
                                                    onMouseEnter={labelEnter}
                                                    onMouseLeave={labelLeave}
                                                    style={labelStyle}
                                                >
                                                    {closedChangeDiffLabel}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ) : null;
                            }
                            if (isToggleActive) {
                                return (toggleChangeDiff ?? toggleChangeDiffLabel) !== undefined ? (
                                    <div>
                                        {toggleChangeDiff !== undefined && (
                                            <span
                                                className="selectable"
                                                style={{
                                                    fontWeight: fonts.weight.medium,
                                                    color: toggleChangeDiffColor ?? colors.fg.dim,
                                                }}
                                            >
                                                {toggleChangeDiff}
                                            </span>
                                        )}
                                        {toggleChangeDiffLabel !== undefined && (
                                            <>
                                                {" "}
                                                <span
                                                    onClick={labelClick}
                                                    onMouseEnter={labelEnter}
                                                    onMouseLeave={labelLeave}
                                                    style={labelStyle}
                                                >
                                                    {toggleChangeDiffLabel}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ) : null;
                            }
                            return (changeDiff ?? changeDiffLabel) !== undefined ? (
                                <div>
                                    {changeDiff !== undefined && (
                                        <span
                                            className="selectable"
                                            style={{
                                                fontWeight: fonts.weight.semibold,
                                                color: changeDiffColor ?? colors.fg.dim,
                                            }}
                                        >
                                            {changeDiff}
                                        </span>
                                    )}
                                    {changeDiffLabel !== undefined && (
                                        <>
                                            {" "}
                                            <span
                                                onClick={labelClick}
                                                onMouseEnter={labelEnter}
                                                onMouseLeave={labelLeave}
                                                style={labelStyle}
                                            >
                                                {changeDiffLabel}
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}
        </div>
    );
}
