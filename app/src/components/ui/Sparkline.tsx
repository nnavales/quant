import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import type { TimeSeriesPoint } from "@/api_client/types";

const CHART_COLOR = colors.accent.cyan;

interface SparklineProps {
    points: TimeSeriesPoint[];
    color?: string;
}

export function Sparkline({ points, color = CHART_COLOR }: SparklineProps) {
    if (!points || points.length < 2) return null;

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 200;
    const height = 40;
    const padding = 4;

    const getX = (index: number) => padding + (index / (points.length - 1)) * (width - padding * 2);
    const getY = (value: number) =>
        height - padding - ((value - min) / range) * (height - padding * 2);

    let pathD = `M ${getX(0)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${getX(i)} ${getY(points[i].value)}`;
    }

    return (
        <svg width={width} height={height} style={{ marginTop: spacing[2] }}>
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
