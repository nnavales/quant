import type { TimeSeriesPoint } from "@/api_client/types";
import { RefreshCw } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "@/components/ui/Sparkline";
import { Button } from "@/components/ui/Button";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatNumber } from "@/utils/format";

const cardStyle: React.CSSProperties = {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing[3],
    border: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    minHeight: 130,
    animation: "fadeIn 0.2s ease-out",
};

const titleRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
};

const titleStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: colors.fg.dim,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

const valueStyle: React.CSSProperties = {
    fontSize: "25px",
    fontWeight: 700,
    fontFamily: fonts.family.display,
    color: colors.fg.base,
    marginTop: spacing[1],
};

const deltaWrap: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11.5px",
    minHeight: 24,
};

const sparklineWrap: React.CSSProperties = {
    height: 48,
    marginTop: spacing[1],
};

const spacer: React.CSSProperties = {
    flex: 1,
};

const footerStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    opacity: 0.7,
    marginTop: spacing[1],
};

export const shared = { valueStyle, titleStyle, titleRowStyle, cardStyle };

interface MetricCardProps {
    title: string;
    loading: boolean;
    error?: string | null;
    onRefresh?: () => void;
    children?: React.ReactNode;
    delta?: number | null;
    points?: TimeSeriesPoint[];
    footer?: string | null;
    inverseTrend?: boolean;
}

export function MetricCard({ title, loading, error, onRefresh, children, delta, points, footer, inverseTrend = false }: MetricCardProps) {
    if (loading) {
        return (
            <div style={cardStyle}>
                <div style={titleRowStyle}><div style={titleStyle}>{title}</div></div>
                <div style={{ color: colors.fg.dim }}>Cargando...</div>
            </div>
        );
    }
    if (error) {
        return (
            <div style={cardStyle}>
                <div style={titleRowStyle}><div style={titleStyle}>{title}</div></div>
                <div style={{ color: colors.fg.dim }}>{error}</div>
            </div>
        );
    }

    const positive = delta != null && delta > 0;

    return (
        <div style={cardStyle}>
            <div style={titleRowStyle}>
                <div style={titleStyle}>{title}</div>
                {onRefresh && (
                    <Button variant="icon" onClick={onRefresh} title="Actualizar">
                        <RefreshCw size={14} />
                    </Button>
                )}
            </div>
            {children}
            <div className="selectable" style={deltaWrap}>
                {delta != null && delta !== 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: positive !== inverseTrend ? colors.accent.green : colors.accent.red }}>
                        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="selectable" style={{ fontWeight: 500 }}>{positive ? "+" : ""}{formatNumber(delta)}%</span>
                    </div>
                )}
            </div>
            <div style={sparklineWrap}>
                {points && <Sparkline points={points} />}
            </div>
            <div style={spacer} />
            <div style={footerStyle}>{footer ?? ""}</div>
        </div>
    );
}
