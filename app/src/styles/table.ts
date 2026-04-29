import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: fonts.table.body,
    backgroundColor: colors.bg.surface,
};

export const theadStyle: React.CSSProperties = {
    backgroundColor: "#111418",
};

export const thStyle = (
    sortable: boolean,
    active: boolean,
    align: "left" | "center" | "right" = "center"
): React.CSSProperties => ({
    padding: `${spacing[2]} ${spacing[3]}`,
    textAlign: align,
    fontWeight: 500,
    color: active ? colors.fg.base : colors.fg.dim,
    textTransform: "uppercase",
    fontSize: fonts.table.header,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    cursor: sortable ? "pointer" : "default",
    userSelect: sortable ? "none" : "auto",
    transition: "color 0.15s",
    border: `1px solid ${colors.fill}`,
});

export const sortableThStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing[1],
};

export const iconStyle: React.CSSProperties = {
    fontSize: "11px",
    marginLeft: spacing[1],
    lineHeight: 1,
};

export const fixedWidthStyle = (width: string): React.CSSProperties => ({
    width,
    minWidth: width,
    maxWidth: width,
});
