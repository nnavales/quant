import { radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

export function getActionBtnStyle(
    isDelete: boolean = false,
    isHover: boolean = false
): React.CSSProperties {
    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "30px",
        height: "30px",
        borderRadius: radius.sm,
        cursor: "pointer",
        fontSize: fonts.size.xs,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        backgroundColor: isHover
            ? isDelete
                ? `${colors.accent.red}18`
                : `${colors.accent.cyan}12`
            : "transparent",
        border: "none",
        color: isHover
            ? isDelete
                ? colors.accent.red
                : colors.accent.cyan
            : colors.fg.dim,
        transition: "all 0.12s ease",
        opacity: isHover ? 1 : 0.7,
    };
}
