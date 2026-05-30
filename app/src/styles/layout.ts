import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export const flexRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
};

export const flexColumn: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
};

export const flexBetween: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
};

export const truncate: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

export const ghostButton: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
};

export const cardStyle: React.CSSProperties = {
    backgroundColor: colors.fill,
    borderRadius: radius.xl,
    padding: spacing[4],
};

export const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "32px",
    padding: `0 ${spacing[3]}`,
    borderRadius: radius.md,
    backgroundColor: colors.bg.base,
    transition: "background-color 0.15s",
};

export const inputStyle: React.CSSProperties = {
    height: "34px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: "none",
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    fontFamily: fonts.family,
    fontWeight: fonts.weight.medium,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
};
