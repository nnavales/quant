import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const inputStyle: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.bg.elevated,
    border: "none",
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    width: "100%",
    height: "34px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: fonts.family,
};

export const labelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    fontWeight: fonts.weight.medium,
    marginBottom: spacing[2],
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};
