import { spacing, radius } from "@/styles/theme";
import { colors, hoverFill } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

type ButtonVariant =
    | "primary"
    | "secondary"
    | "icon"
    | "chip"
    | "tab"
    | "badge"
    | "plain"
    | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonColor = "default" | "green" | "red" | "cyan" | "teal" | "blue" | "orange";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    active?: boolean;
    loading?: boolean;
    noHover?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    fullWidth?: boolean;
    children?: React.ReactNode;
}

const colorMap: Record<
    ButtonColor,
    { bg: string; border: string; text: string; hoverBg: string; hoverBorder: string }
> = {
    default: {
        bg: colors.fill,
        border: hoverFill(colors.fill),
        text: colors.fg.base,
        hoverBg: hoverFill(colors.fill),
        hoverBorder: hoverFill(colors.fill),
    },
    green: {
        bg: colors.variant.green.bg,
        border: colors.variant.green.border,
        text: colors.accent.green,
        hoverBg: colors.variant.green.hoverBg,
        hoverBorder: colors.variant.green.hoverBorder,
    },
    red: {
        bg: colors.variant.red.bg,
        border: colors.variant.red.border,
        text: colors.accent.red,
        hoverBg: colors.variant.red.hoverBg,
        hoverBorder: colors.variant.red.hoverBorder,
    },
    cyan: {
        bg: colors.variant.cyan.bg,
        border: colors.variant.cyan.border,
        text: colors.accent.cyan,
        hoverBg: colors.variant.cyan.hoverBg,
        hoverBorder: colors.variant.cyan.hoverBorder,
    },
    teal: {
        bg: `${colors.accent.teal}26`,
        border: `${colors.accent.teal}40`,
        text: colors.accent.teal,
        hoverBg: `${colors.accent.teal}36`,
        hoverBorder: `${colors.accent.teal}50`,
    },
    blue: {
        bg: colors.variant.blue.bg,
        border: colors.variant.blue.border,
        text: colors.accent.blue,
        hoverBg: colors.variant.blue.hoverBg,
        hoverBorder: colors.variant.blue.hoverBorder,
    },
    orange: {
        bg: colors.variant.orange.bg,
        border: colors.variant.orange.border,
        text: colors.accent.orange,
        hoverBg: colors.variant.orange.hoverBg,
        hoverBorder: colors.variant.orange.hoverBorder,
    },
};

const sizeMap: Record<ButtonSize, { padding: string; fontSize: string }> = {
    sm: { padding: `${spacing[1]} ${spacing[2]}`, fontSize: fonts.size.xs },
    md: { padding: `${spacing[2]} ${spacing[4]}`, fontSize: fonts.size.sm },
    lg: { padding: `${spacing[3]} ${spacing[5]}`, fontSize: fonts.size.base },
};

export function Button({
    variant = "primary",
    size = "md",
    color = "default",
    active = false,
    loading = false,
    disabled = false,
    noHover = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    children,
    style,
    onMouseEnter,
    onMouseLeave,
    ...rest
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const c = colorMap[color];
    const s = sizeMap[size];

    const getBaseStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[1],
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.5 : 1,
            transition: "all 0.15s",
            fontWeight: fonts.weight.medium,
            fontFamily: fonts.family,
            whiteSpace: "nowrap",
            width: fullWidth ? "100%" : undefined,
        };

        switch (variant) {
            case "primary": {
                return {
                    ...base,
                    padding: s.padding,
                    fontSize: s.fontSize,
                    backgroundColor: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: radius.md,
                    color: c.text,
                };
            }
            case "secondary":
                return {
                    ...base,
                    padding: s.padding,
                    fontSize: s.fontSize,
                    backgroundColor: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    color: colors.fg.dim,
                };
            case "ghost":
                return {
                    ...base,
                    padding: s.padding,
                    fontSize: s.fontSize,
                    backgroundColor: active ? colors.fill : "transparent",
                    border: "none",
                    borderRadius: radius.md,
                    color: active ? colors.fg.base : colors.fg.dim,
                    textAlign: "left" as const,
                };
            case "icon":
                return {
                    ...base,
                    width: 24,
                    height: 24,
                    padding: 0,
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: radius.sm,
                    color: colors.fg.dim,
                };
            case "chip":
                return {
                    ...base,
                    padding: s.padding,
                    fontSize: s.fontSize,
                    backgroundColor: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: radius.md,
                    color: c.text,
                };
            case "tab":
                if (active && color !== "default") {
                    return {
                        ...base,
                        padding: s.padding,
                        fontSize: s.fontSize,
                        backgroundColor: c.bg,
                        border: "none",
                        borderRadius: radius.sm,
                        color: c.text,
                        fontWeight: fonts.weight.semibold,
                    };
                }
                return {
                    ...base,
                    padding: s.padding,
                    fontSize: s.fontSize,
                    backgroundColor: active ? colors.fill : "transparent",
                    border: "none",
                    borderRadius: radius.sm,
                    color: active ? colors.fg.base : colors.fg.dim,
                    fontWeight: active ? fonts.weight.semibold : fonts.weight.regular,
                };
            case "badge":
                return {
                    ...base,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    fontSize: fonts.size.xs3,
                    backgroundColor: active ? `${colors.accent.teal}26` : `${colors.fg.dim}26`,
                    border: "none",
                    borderRadius: radius.md,
                    color: active ? colors.accent.teal : colors.fg.dim,
                    textTransform: "uppercase",
                };
            case "plain":
                return {
                    ...base,
                    padding: spacing[1],
                    fontSize: fonts.size.xl,
                    background: "none",
                    border: "none",
                    color: colors.fg.dim,
                    lineHeight: 1,
                };
            default:
                return base;
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return;
        if (!noHover) {
            const el = e.currentTarget;
            switch (variant) {
                case "primary":
                    el.style.backgroundColor = c.hoverBg;
                    el.style.borderColor = c.hoverBorder;
                    break;
                case "secondary":
                    el.style.backgroundColor = colors.fill;
                    break;
                case "icon":
                    el.style.color = colors.fg.base;
                    break;
                case "chip":
                    el.style.backgroundColor = c.hoverBg;
                    el.style.borderColor = c.hoverBorder;
                    break;
                case "ghost":
                    if (!active) el.style.backgroundColor = colors.fill;
                    break;
                case "tab":
                    if (active && color !== "default") {
                        el.style.backgroundColor = c.hoverBg;
                    } else if (!active) {
                        el.style.backgroundColor = colors.fill;
                    }
                    break;
                case "plain":
                    el.style.color = colors.fg.base;
                    break;
            }
        }
        onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return;
        if (!noHover) {
            const el = e.currentTarget;
            switch (variant) {
                case "primary":
                    el.style.backgroundColor = c.bg;
                    el.style.borderColor = c.border;
                    break;
                case "secondary":
                    el.style.backgroundColor = "transparent";
                    break;
                case "icon":
                    el.style.color = colors.fg.dim;
                    break;
                case "chip":
                    el.style.backgroundColor = c.bg;
                    el.style.borderColor = c.border;
                    break;
                case "ghost":
                    if (!active) el.style.backgroundColor = "transparent";
                    break;
                case "tab":
                    if (active && color !== "default") {
                        el.style.backgroundColor = c.bg;
                    } else if (!active) {
                        el.style.backgroundColor = "transparent";
                    }
                    break;
                case "plain":
                    el.style.color = colors.fg.dim;
                    break;
            }
        }
        onMouseLeave?.(e);
    };

    return (
        <button
            disabled={isDisabled}
            style={{ ...getBaseStyle(), ...style }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...rest}
        >
            {loading ? (
                <span
                    style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        border: `2px solid ${c.text}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                    }}
                />
            ) : (
                <>
                    {iconLeft}
                    {children}
                    {iconRight}
                </>
            )}
        </button>
    );
}
