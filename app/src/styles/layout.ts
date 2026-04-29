import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";

export const cardStyle: React.CSSProperties = {
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.lg,
    padding: spacing[4],
};

export const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: radius.md,
    backgroundColor: colors.bg.base,
    transition: "background-color 0.15s",
};

export const inputStyle: React.CSSProperties = {
    height: "28px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    outline: "none",
    boxSizing: "border-box",
};
