import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { flexBetween } from "@/styles/layout";

const cardStyle: React.CSSProperties = {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing[5],
    border: `1px solid transparent`,
    display: "flex",
    flexDirection: "column",
    minHeight: 150,
    animation: "fadeIn 0.2s ease-out",
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    textTransform: "uppercase",
    fontWeight: fonts.weight.medium,
    marginBottom: spacing[3],
    letterSpacing: "0.5px",
};

interface CardProps {
    title: string;
    children: React.ReactNode;
    onRefresh?: () => void;
    titleStyle?: React.CSSProperties;
}

export function Card({ title, children, onRefresh, titleStyle }: CardProps) {
    return (
        <div style={cardStyle}>
            <div
                style={{
                    ...flexBetween,
                    marginBottom: spacing[2],
                }}
            >
                <div style={titleStyle || sectionTitleStyle}>{title}</div>
                {onRefresh && (
                    <Button variant="icon" onClick={onRefresh} title="Actualizar">
                        <RefreshCw size={14} strokeWidth={2.5} />
                    </Button>
                )}
            </div>
            {children}
        </div>
    );
}
