import type { ReactNode } from "react";
import { cardStyle } from "@/styles/layout";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { spacing } from "@/styles/theme";

const sectionHeaderStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.fg.dim,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: spacing[3],
};

interface SettingsCardProps {
    title?: string;
    children: ReactNode;
    style?: React.CSSProperties;
}

export function SettingsCard({ title, children, style }: SettingsCardProps) {
    return (
        <div style={{ ...cardStyle, backgroundColor: colors.bg.elevated, ...style }}>
            {title && <h3 style={sectionHeaderStyle}>{title}</h3>}
            {children}
        </div>
    );
}
