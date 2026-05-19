import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatCurrency } from "@/utils/format";
import type { DimensionSeriesResponse } from "@/api_client/types";

const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONTHS_FULL = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const getHeatmapColor = (value: number, maxValue: number, isIncome: boolean): string => {
    if (value === 0 || maxValue === 0) return colors.bg.surface;

    const intensity = value / maxValue;

    if (isIncome) {
        if (intensity < 0.15) return colors.heatmap.green.low;
        if (intensity < 0.35) return colors.heatmap.green.mid;
        if (intensity < 0.6) return colors.heatmap.green.high;
        return colors.accent.green;
    } else {
        if (intensity < 0.15) return colors.heatmap.red.low;
        if (intensity < 0.35) return colors.heatmap.red.mid;
        if (intensity < 0.6) return colors.heatmap.red.high;
        return colors.accent.red;
    }
};

interface HeatmapDataPoint {
    month: string;
    value: number;
    composition?: Array<{ key: string; value: number }>;
}

export interface HeatmapProps {
    expenseData: DimensionSeriesResponse | undefined;
    isIncome?: boolean;
    dimension?: "category" | "channel";
    currentYear: number;
}

const formatCompactCurrency = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000_000) {
        return `$${(value / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "")}T`;
    }
    if (abs >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
    }
    if (abs >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (abs >= 1_000) {
        return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    }
    return `$${value.toFixed(0)}`;
};

export function Heatmap({
    expenseData,
    isIncome = false,
    dimension = "category",
    currentYear,
}: HeatmapProps) {
    const [hoveredCell, setHoveredCell] = useState<{
        x: number;
        y: number;
        category: string;
        month: string;
        value: number;
        composition: Array<{ key: string; value: number }>;
    } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!hoveredCell || !tooltipRef.current) return;
        const rect = tooltipRef.current.getBoundingClientRect();
        const pad = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = hoveredCell.x - rect.width / 2;
        let top = hoveredCell.y + 10;

        if (left < pad) left = pad;
        if (left + rect.width > vw - pad) left = vw - rect.width - pad;

        if (top + rect.height > vh - pad) {
            top = hoveredCell.y - rect.height - 10;
        }
        if (top < pad) top = pad;

        tooltipRef.current.style.left = `${Math.round(left)}px`;
        tooltipRef.current.style.top = `${Math.round(top)}px`;
    }, [hoveredCell]);

    const handleMouseEnter = (
        e: React.MouseEvent,
        category: string,
        month: string,
        value: number,
        composition: Array<{ key: string; value: number }>
    ) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredCell({
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.bottom),
            category,
            month,
            value,
            composition: composition || [],
        });
    };

    const { months, categories, heatmapData, maxValue } = useMemo(() => {
        if (!expenseData)
            return {
                months: [] as string[],
                categories: [] as string[],
                heatmapData: {} as Record<string, Record<string, HeatmapDataPoint>>,
                maxValue: 0,
            };

        const displayMonths = Array.from({ length: 12 }, (_, i) => {
            const month = (i + 1).toString().padStart(2, "0");
            return `${currentYear}-${month}`;
        });

        const categoryTotals: Record<string, number> = {};
        expenseData.data.forEach((series) => {
            series.data.forEach((d) => {
                if (displayMonths.includes(d.month)) {
                    categoryTotals[series.key] = (categoryTotals[series.key] || 0) + d.value;
                }
            });
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);

        const matrix: Record<string, Record<string, HeatmapDataPoint>> = {};
        sortedCategories.forEach((cat) => {
            matrix[cat] = {};
            displayMonths.forEach((month) => {
                const dataPoint = expenseData.data
                    ?.find((s) => s.key === cat)
                    ?.data.find((d) => d.month === month);
                matrix[cat][month] = {
                    month,
                    value: dataPoint?.value || 0,
                    composition: dataPoint?.composition || [],
                };
            });
        });

        const max = Math.max(
            ...sortedCategories.flatMap((cat) =>
                displayMonths.map((month) => matrix[cat][month].value)
            ),
            1
        );

        return {
            months: displayMonths,
            categories: sortedCategories,
            heatmapData: matrix,
            maxValue: max,
        };
    }, [expenseData, currentYear]);

    if (categories.length === 0) {
        return (
            <div style={{ color: colors.fg.dim, padding: spacing[4], textAlign: "center" }}>
                Sin datos disponibles
            </div>
        );
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <table
                style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "2px",
                    fontSize: fonts.table.body,
                    tableLayout: "fixed",
                }}
            >
                <colgroup>
                    <col style={{ width: "140px", minWidth: "140px" }} />
                    {months.map((month) => (
                        <col key={month} />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <th
                            style={{
                                textAlign: "left",
                                padding: `${spacing[2]} ${spacing[3]}`,
                                color: colors.fg.dim,
                                fontWeight: 500,
                                fontSize: fonts.table.header,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {dimension === "channel" ? "Canal" : "Categoría"}
                        </th>
                        {months.map((month) => (
                            <th
                                key={month}
                                style={{
                                    textAlign: "center",
                                    padding: `${spacing[2]} ${spacing[1]}`,
                                    color: colors.fg.dim,
                                    fontWeight: 500,
                                    fontSize: fonts.table.header,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {monthNames[parseInt(month.split("-")[1]) - 1]}
                            </th>
                        ))}
                    </tr>
                </thead>
            </table>
            <div style={{ overflow: "auto", flex: 1, minHeight: 0, backgroundColor: colors.bg.surface }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: "2px",
                        fontSize: fonts.table.body,
                        tableLayout: "fixed",
                    }}
                >
                    <colgroup>
                        <col style={{ width: "140px", minWidth: "140px" }} />
                        {months.map((month) => (
                            <col key={month} />
                        ))}
                    </colgroup>
                    <tbody>
                    {categories.map((category) => (
                        <tr key={category}>
                            <td
                                style={{
                                    textAlign: "left",
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    color: colors.fg.base,
                                    fontWeight: 500,
                                    fontSize: fonts.table.body,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {category}
                            </td>
                            {months.map((month) => {
                                const { value, composition } = heatmapData[category]?.[month] || {
                                    value: 0,
                                    composition: [],
                                };
                                const intensity = maxValue > 0 ? value / maxValue : 0;

                                return (
                                <td
                                    key={month}
                                    style={{
                                        textAlign: "center",
                                        padding: `${spacing[2]} ${spacing[1]}`,
                                        backgroundColor: getHeatmapColor(
                                            value,
                                            maxValue,
                                            isIncome
                                        ),
                                        color:
                                            intensity > 0.5
                                                ? colors.bg.base
                                                : colors.fg.dim,
                                        fontFamily: fonts.family.display,
                                        fontSize: fonts.table.meta,
                                        fontWeight: 500,
                                        borderRadius: radius.sm,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s, transform 0.15s",
                                    }}
                                        onMouseEnter={(e) =>
                                            handleMouseEnter(
                                                e,
                                                category,
                                                month,
                                                value,
                                                composition || []
                                            )
                                        }
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        <span
                                            style={{
                                                display: "block",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {formatCompactCurrency(value)}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            {hoveredCell && hoveredCell.composition && hoveredCell.composition.length > 0 && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: "fixed",
                        left: 0,
                        top: 0,
                        backgroundColor: colors.bg.header,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        outline: `1px solid ${colors.fill}`,
                        zIndex: 1000,
                        minWidth: "180px",
                        maxWidth: "300px",
                        pointerEvents: "none",
                        wordBreak: "break-word",
                        WebkitFontSmoothing: "antialiased",
                        MozOsxFontSmoothing: "grayscale",
                        lineHeight: 1.5,
                    }}
                >
                    <div style={{
                        marginBottom: spacing[1],
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: spacing[1],
                    }}>
                        <div style={{
                            fontWeight: 600,
                            fontSize: "13px",
                            color: colors.fg.base,
                            lineHeight: 1.3,
                        }}>
                            {hoveredCell.category}
                        </div>
                        <div style={{
                            fontSize: "11px",
                            color: colors.fg.dim,
                            marginTop: "1px",
                            lineHeight: 1.3,
                        }}>
                            {MONTHS_FULL[parseInt(hoveredCell.month.split("-")[1]) - 1]}
                        </div>
                    </div>
                    <div style={{
                        fontSize: "12.5px",
                        color: colors.fg.dim,
                        marginBottom: spacing[1],
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: spacing[2],
                    }}>
                        <span style={{ lineHeight: 1.4 }}>Total</span>
                        <span style={{
                            fontFamily: fonts.family.display,
                            fontWeight: 600,
                            fontSize: "12.5px",
                            color: colors.fg.base,
                            whiteSpace: "nowrap",
                            textAlign: "right",
                        }}>
                            {formatCurrency(hoveredCell.value)}
                        </span>
                    </div>
                    {hoveredCell.composition.length > 0 && (
                        <div style={{
                            borderTop: `1px solid ${colors.border}`,
                            paddingTop: spacing[1],
                            marginTop: spacing[1],
                        }}>
                            <div style={{
                                fontSize: "11px",
                                color: colors.fg.dim,
                                marginBottom: spacing[1],
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}>
                                Composición
                            </div>
                            {hoveredCell.composition.map((comp, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "12.5px",
                                        padding: "1px 0",
                                        gap: spacing[2],
                                    }}
                                >
                                    <span style={{
                                        color: colors.fg.dim,
                                        lineHeight: 1.4,
                                        flex: 1,
                                    }}>
                                        {comp.key}
                                    </span>
                                    <span style={{
                                        fontFamily: fonts.family.display,
                                        fontWeight: 600,
                                        color: colors.fg.base,
                                        whiteSpace: "nowrap",
                                        textAlign: "right",
                                    }}>
                                        {formatCurrency(comp.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function HeatmapLegend({ isIncome }: { isIncome: boolean }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
            }}
        >
            <span style={{ fontSize: fonts.table.meta, color: colors.fg.dim }}>Menor</span>
            <div
                style={{
                    display: "flex",
                    height: "12px",
                    borderRadius: radius.sm,
                    overflow: "hidden",
                }}
            >
                <div style={{ width: "24px", backgroundColor: isIncome ? colors.heatmap.green.low : colors.heatmap.red.low }} />
                <div style={{ width: "24px", backgroundColor: isIncome ? colors.heatmap.green.mid : colors.heatmap.red.mid }} />
                <div style={{ width: "24px", backgroundColor: isIncome ? colors.heatmap.green.high : colors.heatmap.red.high }} />
                <div
                    style={{
                        width: "24px",
                        backgroundColor: isIncome ? colors.accent.green : colors.accent.red,
                    }}
                />
            </div>
            <span style={{ fontSize: fonts.table.meta, color: colors.fg.dim }}>Mayor</span>
        </div>
    );
}
