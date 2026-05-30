import type { ColorScheme } from "./colors";

/*
 * THEME GUIDE
 *
 * bg dark:  base → surface (darker) → elevated (darker) → hover/selected (lighter, stand out)
 * bg light: base (gray page) → surface (near-white cards, lighter) → elevated (slightly gray headers)
 * fg:  base = primary text,  dim = muted/secondary text
 * border = visible edges,  fill = subtle dividers/chips (softer than border)
 * accent: red=expense/error  green=income/success  cyan=highlight  blue=info
 *         purple=forecast  orange=warning  yellow=caution  teal=tertiary
 * heatmap: optional, only override if defaults look wrong for this theme
 */

interface PresetInput {
    mode?: "dark" | "light";
    bg: {
        base: string;
        surface: string;
        elevated: string;
        hover: string;
        selected: string;
    };
    fg: {
        base: string;
        dim: string;
    };
    border: string;
    fill: string;
    hoverFill: string;
    accent: {
        red: string;
        green: string;
        yellow: string;
        blue: string;
        purple: string;
        teal: string;
        orange: string;
        cyan: string;
    };
    heatmap?: ColorScheme["heatmap"];
}

function buildScheme(input: PresetInput): ColorScheme {
    const { accent, fg } = input;
    const isLight = input.mode === "light";

    const variant = (color: string) => ({
        bg: `${color}1A`,
        border: `${color}40`,
        hoverBg: `${color}2E`,
        hoverBorder: `${color}59`,
    });

    const heatmap =
        input.heatmap ??
        (isLight
            ? {
                  green: { low: "#e6f5e6", mid: "#c8e6c8", high: "#a5d6a5" },
                  red: { low: "#fce4e4", mid: "#f5c6c6", high: "#e8a0a0" },
              }
            : {
                  green: { low: "#0d1a0d", mid: "#1a3a1a", high: "#2a5a2a" },
                  red: { low: "#1a0d0d", mid: "#3a1a1a", high: "#6a2a2a" },
              });

    const shadows = isLight ? lightShadows() : darkShadows();

    return {
        accent: { ...accent },
        fg: { ...fg },
        bg: { ...input.bg },
        border: input.border,
        fill: input.fill,
        hoverFill: input.hoverFill,
        variant: {
            green: variant(accent.green),
            red: variant(accent.red),
            cyan: variant(accent.cyan),
            blue: variant(accent.blue),
            orange: variant(accent.orange),
        },
        shadows,
        heatmap,
        overlay: {
            black30: "rgba(0, 0, 0, 0.30)",
            black55: "rgba(0, 0, 0, 0.55)",
        },
    };
}

function darkShadows(): ColorScheme["shadows"] {
    return {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 4px 24px rgb(0 0 0 / 0.2)",
        xl: "0 25px 50px -12px rgb(0 0 0 / 0.5)",
    };
}

function lightShadows(): ColorScheme["shadows"] {
    return {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        lg: "0 4px 24px rgb(0 0 0 / 0.08)",
        xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    };
}

export const presets: Record<string, ColorScheme> = {
    dark: buildScheme({
        bg: {
            base: "#1F2225",
            surface: "#181A1C",
            elevated: "#131618",
            hover: "#202427",
            selected: "#232629",
        },
        fg: { base: "#E9F2F2", dim: "#6E797E" },
        border: "#1B1E20",
        fill: "#25292C",
        hoverFill: "#2C3135",
        accent: {
            red: "#E0617A",
            green: "#8FCF7A",
            yellow: "#D9CC58",
            blue: "#5B9CF5",
            purple: "#D78CF0",
            teal: "#46C2A8",
            orange: "#E9A96E",
            cyan: "#A5E9F5",
        },
    }),

    darker: buildScheme({
        bg: {
            base: "#181A1C",
            surface: "#16181a",
            elevated: "#141618",
            hover: "#191b1d",
            selected: "#202224",
        },
        fg: { base: "#F0F2F5", dim: "#8A9299" },
        border: "#242628",
        fill: "#1e2022",
        hoverFill: "#282A2C",
        accent: {
            red: "#F25D7A",
            green: "#5CE68A",
            yellow: "#F2C94C",
            blue: "#5B9CF5",
            purple: "#C084FC",
            teal: "#3DD9A0",
            orange: "#F2994A",
            cyan: "#5EE7F0",
        },
    }),
};
