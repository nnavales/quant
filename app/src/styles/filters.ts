import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const filterContainerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing[3],
    marginBottom: spacing[3],
    alignItems: "center",
};

export const filterWrapperStyle: React.CSSProperties = {
    position: "relative",
};

export const dropdownItemStyle: React.CSSProperties = {
    padding: `${spacing[1]} ${spacing[2]}`,
    cursor: "pointer",
    borderRadius: "8px",
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
    borderRadius: "8px",
    transition: "all 0.15s ease",
    border: "none",
};

export const paginationButtonStyle = (disabled: boolean): React.CSSProperties => ({
    height: "28px",
    padding: "0 10px",
    backgroundColor: "transparent",
    border: `1px solid ${disabled ? colors.overlay.white06 : colors.border}`,
    borderRadius: radius.md,
    color: colors.fg.dim,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
});

/* ─── Filter chip trigger style ─── */
export const chipTriggerStyle = (isActive: boolean): React.CSSProperties => ({
    height: "26px",
    padding: "0 12px",
    fontSize: fonts.size.sm,
    fontWeight: 500,
    fontFamily: fonts.family.text,
    color: isActive ? colors.fg.base : colors.fg.dim,
    backgroundColor: colors.fill,
    borderRadius: "8px",
    cursor: "pointer",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
    border: "none",
    outline: "none",
});
