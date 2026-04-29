import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { RefreshCw } from "lucide-react";
import { Button } from "./Button";

const cardStyle: React.CSSProperties = {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    border: `1px solid ${colors.fill}`,
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    minHeight: 150,
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    textTransform: "uppercase",
    fontWeight: 500,
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing[2],
                }}
            >
                <div style={titleStyle || sectionTitleStyle}>{title}</div>
                {onRefresh && (
                    <Button variant="icon" onClick={onRefresh} title="Actualizar">
                        <RefreshCw size={14} />
                    </Button>
                )}
            </div>
            {children}
        </div>
    );
}
