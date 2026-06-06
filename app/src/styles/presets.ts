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
 *
 * NOTE: presets are ordered by background lightness (darkest → lightest).
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
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    };
}

function lightShadows(): ColorScheme["shadows"] {
    return {
        md: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
    };
}

export const presets: Record<string, ColorScheme> = {
    darker: buildScheme({
        bg: {
            base: "#181B1E",
            surface: "#14171A",
            elevated: "#101316",
            hover: "#25282D",
            selected: "#2D3136",
        },
        fg: { base: "#F0F2F5", dim: "#8A9299" },
        border: "#1D2024",
        fill: "#1F2226",
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

    material: buildScheme({
        bg: {
            base: "#212121",
            surface: "#1c1c1c",
            elevated: "#171717",
            hover: "#2a2a2a",
            selected: "#353535",
        },
        fg: { base: "#e6e6e6", dim: "#707070" },
        border: "#1d1d1d",
        fill: "#272727",
        accent: {
            red: "#f07178",
            green: "#c3e88d",
            yellow: "#ffcb6b",
            blue: "#82aaff",
            purple: "#c792ea",
            teal: "#80cbc4",
            orange: "#f78c6c",
            cyan: "#89ddff",
        },
    }),

    dark: buildScheme({
        bg: {
            base: "#1F2225",
            surface: "#181A1C",
            elevated: "#131618",
            hover: "#1D2023",
            selected: "#23272B",
        },
        fg: { base: "#E9F2F2", dim: "#6E797E" },
        fill: "#222629",
        border: "#1C1F22",
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

    kanagawa: buildScheme({
        bg: {
            base: "#1f1f28",
            surface: "#1a1a22",
            elevated: "#16161d",
            hover: "#2a2a37",
            selected: "#363646",
        },
        fg: { base: "#dcd7ba", dim: "#727169" },
        border: "#1b1b23",
        fill: "#25252f",
        accent: {
            red: "#e46876",
            green: "#98bb6c",
            yellow: "#e6c384",
            blue: "#7e9cd8",
            purple: "#957fb8",
            teal: "#7aa89f",
            orange: "#ffa066",
            cyan: "#7fb4ca",
        },
        heatmap: {
            green: { low: "#18230f", mid: "#2c3d1d", high: "#41562c" },
            red: { low: "#2a1414", mid: "#4a1f1f", high: "#6a2a2a" },
        },
    }),

    neutral: buildScheme({
        bg: {
            base: "#292a2b",
            surface: "#242526",
            elevated: "#1f2021",
            hover: "#313234",
            selected: "#3a3b3d",
        },
        fg: { base: "#e8e8ea", dim: "#8b8d92" },
        border: "#252626",
        fill: "#2f3032",
        accent: {
            red: "#e0617a",
            green: "#8fcf7a",
            yellow: "#d9cc58",
            blue: "#5b9cf5",
            purple: "#d78cf0",
            teal: "#46c2a8",
            orange: "#e9a96e",
            cyan: "#a5e9f5",
        },
    }),

    "one-dark": buildScheme({
        bg: {
            base: "#282c34",
            surface: "#21252b",
            elevated: "#1c1f24",
            hover: "#2c313c",
            selected: "#3a3f4b",
        },
        fg: { base: "#c2c8d3", dim: "#5c6370" },
        border: "#24282f",
        fill: "#2d323c",
        accent: {
            red: "#e06c75",
            green: "#98c379",
            yellow: "#e5c07b",
            blue: "#61afef",
            purple: "#c678dd",
            teal: "#5cb89a",
            orange: "#d19a66",
            cyan: "#56b6c2",
        },
    }),

    everforest: buildScheme({
        bg: {
            base: "#2d353b",
            surface: "#272e33",
            elevated: "#232a2e",
            hover: "#343f44",
            selected: "#3d484d",
        },
        fg: { base: "#d3c6aa", dim: "#859289" },
        border: "#293136",
        fill: "#2f393e",
        accent: {
            red: "#e67e80",
            green: "#a7c080",
            yellow: "#dbbc7f",
            blue: "#7fbbb3",
            purple: "#d699b6",
            teal: "#83c092",
            orange: "#e69875",
            cyan: "#6fb0c9",
        },
        heatmap: {
            green: { low: "#1f2b1c", mid: "#324628", high: "#486338" },
            red: { low: "#321f1f", mid: "#50302f", high: "#6c3e3c" },
        },
    }),

    light: buildScheme({
        mode: "light",
        bg: {
            base: "#dce1e5",
            surface: "#f0f3f5",
            elevated: "#f8fafb",
            hover: "#d0d6da",
            selected: "#c4ccd1",
        },
        fg: { base: "#20272a", dim: "#5e686e" },
        border: "#cdd3d8",
        fill: "#d6dce0",
        accent: {
            red: "#d14e68",
            green: "#4fa85f",
            yellow: "#b89a1e",
            blue: "#2f7bd6",
            purple: "#a859c8",
            teal: "#1f9e8a",
            orange: "#d17f36",
            cyan: "#2c9cb5",
        },
    }),
};
