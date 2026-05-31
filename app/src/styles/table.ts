import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const tableStyle: React.CSSProperties = {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: fonts.size.sm3,
    backgroundColor: colors.bg.surface,
};

export const theadStyle: React.CSSProperties = {
    backgroundColor: colors.bg.elevated,
};

export const thStyle = (
    sortable: boolean,
    active: boolean,
    align: "left" | "center" | "right" = "center"
): React.CSSProperties => ({
    padding: `${spacing[2]} ${spacing[3]}`,
    textAlign: align,
    fontWeight: fonts.weight.medium,
    color: active ? colors.fg.base : colors.fg.dim,
    textTransform: "uppercase",
    fontSize: fonts.size.xs2,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    cursor: sortable ? "pointer" : "default",
    userSelect: sortable ? "none" : "auto",
    transition: "color 0.15s",
    borderBottom: `1px solid ${colors.border}`,
    borderLeft: `1px solid ${colors.border}`,
});

export const sortableThStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing[1],
};

export const iconStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    marginLeft: spacing[1],
    lineHeight: 1,
};

export const fixedWidthStyle = (width: string): React.CSSProperties => ({
    width,
    minWidth: width,
    maxWidth: width,
});
