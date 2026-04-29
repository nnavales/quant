import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const filterContainerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[2],
    alignItems: "center",
};

export const filterWrapperStyle: React.CSSProperties = {
    position: "relative",
};

export const dropdownItemStyle: React.CSSProperties = {
    padding: `${spacing[1]} ${spacing[2]}`,
    cursor: "pointer",
    borderRadius: radius.sm,
    fontSize: fonts.size.sm,
    color: colors.fg.base,
    transition: "background-color 0.1s",
    userSelect: "none",
};

export const clearButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    padding: "0",
    backgroundColor: `${colors.accent.red}15`,
    border: `1px solid ${colors.accent.red}40`,
    color: colors.accent.red,
    cursor: "pointer",
    borderRadius: radius.md,
};

export const paginationButtonStyle = (disabled: boolean): React.CSSProperties => ({
    height: "28px",
    padding: "0 10px",
    backgroundColor: "transparent",
    border: `1px solid ${disabled ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.08)"}`,
    borderRadius: radius.md,
    color: colors.fg.dim,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});
