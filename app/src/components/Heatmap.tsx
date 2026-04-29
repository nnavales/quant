import { useState, useMemo } from "react";
import { spacing, radius, shadows } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatCurrency } from "@/utils/format";
import type { DimensionSeriesResponse } from "@/api_client/types";

const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const getHeatmapColor = (value: number, maxValue: number, isIncome: boolean): string => {
    if (value === 0 || maxValue === 0) return colors.bg.surface;

    const intensity = value / maxValue;

    if (isIncome) {
        if (intensity < 0.15) return "#0d1a0d";
        if (intensity < 0.35) return "#1a3a1a";
        if (intensity < 0.6) return "#2a5a2a";
        return colors.accent.green;
    } else {
        if (intensity < 0.15) return "#1a0d0d";
        if (intensity < 0.35) return "#3a1a1a";
        if (intensity < 0.6) return "#6a2a2a";
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

    const handleMouseEnter = (
        e: React.MouseEvent,
        category: string,
        month: string,
        value: number,
        composition: Array<{ key: string; value: number }>
    ) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredCell({
            x: rect.left + rect.width / 2,
            y: rect.top,
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

            {hoveredCell && hoveredCell.composition && hoveredCell.composition.length > 0 && (
                <div
                    style={{
                        position: "fixed",
                        left: hoveredCell.x,
                        top: hoveredCell.y - 10,
                        transform: "translate(-50%, -100%)",
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.fill}`,
                        borderRadius: radius.md,
                        padding: spacing[3],
                        boxShadow: shadows.xl,
                        zIndex: 1000,
                        minWidth: "220px",
                        maxWidth: "420px",
                        pointerEvents: "none",
                        wordBreak: "break-word",
                    }}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: fonts.table.body,
                            marginBottom: spacing[2],
                            color: colors.fg.base,
                            borderBottom: `1px solid ${colors.fill}`,
                            paddingBottom: spacing[2],
                            lineHeight: 1.4,
                        }}
                    >
                        {hoveredCell.category} —{" "}
                        {monthNames[parseInt(hoveredCell.month.split("-")[1]) - 1]}
                    </div>
                    <div
                        style={{
                            fontSize: fonts.table.body,
                            color: colors.fg.dim,
                            marginBottom: spacing[2],
                        }}
                    >
                        Total:{" "}
                        <span
                            style={{
                                fontFamily: fonts.family.display,
                                fontWeight: 600,
                                fontSize: fonts.table.lg,
                                color: colors.fg.base,
                            }}
                        >
                            {formatCurrency(hoveredCell.value)}
                        </span>
                    </div>
                    {hoveredCell.composition.length > 0 && (
                        <div
                            style={{
                                borderTop: `1px solid ${colors.fill}`,
                                paddingTop: spacing[2],
                                marginTop: spacing[2],
                            }}
                        >
                            <div
                                style={{
                                    fontSize: fonts.table.meta,
                                    color: colors.fg.dim,
                                    marginBottom: spacing[1],
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                Composición
                            </div>
                            {hoveredCell.composition.map((comp, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        fontSize: fonts.table.body,
                                        padding: `${spacing[1]} 0`,
                                        gap: spacing[3],
                                    }}
                                >
                                    <span
                                        style={{
                                            color: colors.fg.base,
                                            lineHeight: 1.4,
                                            flex: 1,
                                        }}
                                    >
                                        {comp.key}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: fonts.family.display,
                                            fontWeight: 500,
                                            color: colors.fg.dim,
                                            whiteSpace: "nowrap",
                                            textAlign: "right",
                                        }}
                                    >
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
                <div style={{ width: "24px", backgroundColor: isIncome ? "#0d1a0d" : "#1a0d0d" }} />
                <div style={{ width: "24px", backgroundColor: isIncome ? "#1a3a1a" : "#3a1a1a" }} />
                <div style={{ width: "24px", backgroundColor: isIncome ? "#2a5a2a" : "#6a2a2a" }} />
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
