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
    width: "28px",
    height: "28px",
    padding: "0",
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    color: colors.accent.red,
    cursor: "pointer",
    borderRadius: radius.md,
    transition: "all 0.15s ease",
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

/* ─── Filter chip trigger style ───
 * Designed to work WITH Dropdown's internal hover mechanics:
 * - Inactive: subtle border → hover reveals to colors.fill
 * - Active: colors.fill border → hover stays at colors.fill (seamless)
 */
export const chipTriggerStyle = (isActive: boolean): React.CSSProperties => ({
    height: "28px",
    padding: "0 12px",
    fontSize: fonts.size.sm,
    fontWeight: 400,
    color: isActive ? colors.fg.base : colors.fg.dim,
    backgroundColor: "transparent",
    border: `1px solid ${colors.overlay.white08}`,
    borderRadius: radius.md,
    cursor: "pointer",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
});
