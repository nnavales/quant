import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const filterContainerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing[3],
    alignItems: "center",
};



export const filterWrapperStyle: React.CSSProperties = {
    position: "relative",
};

export const dropdownItemStyle: React.CSSProperties = {
    padding: `${spacing[1]} ${spacing[2]}`,
    cursor: "pointer",
    borderRadius: radius.lg,
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
    backgroundColor: colors.fill,
    color: colors.accent.red,
    cursor: "pointer",
    borderRadius: radius.lg,
    transition: "all 0.15s ease",
    border: "none",
};

/* ─── Filter chip trigger style ─── */
export const chipTriggerStyle = (isActive: boolean): React.CSSProperties => ({
    height: "26px",
    padding: "0 12px",
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    fontFamily: fonts.family,
    color: isActive ? colors.fg.base : colors.fg.dim,
    backgroundColor: colors.fill,
    borderRadius: radius.lg,
    cursor: "pointer",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
    whiteSpace: "nowrap",
    border: "none",
    outline: "none",
});
