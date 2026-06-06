export interface VariantState {
    bg: string;
    border: string;
    hoverBg: string;
    hoverBorder: string;
}

export interface ColorScheme {
    accent: {
        red: string;
        cyan: string;
        yellow: string;
        blue: string;
        purple: string;
        teal: string;
        orange: string;
        green: string;
    };
    fg: {
        base: string;
        dim: string;
    };
    bg: {
        base: string;
        surface: string;
        elevated: string;
        hover: string;
        selected: string;
    };
    border: string;
    fill: string;
    variant: {
        green: VariantState;
        red: VariantState;
        cyan: VariantState;
        blue: VariantState;
        orange: VariantState;
    };
    shadows: {
        md: string;
    };
    heatmap: {
        green: { low: string; mid: string; high: string };
        red: { low: string; mid: string; high: string };
    };
    overlay: {
        black30: string;
        black55: string;
    };
}

import { presets as allPresets } from "./presets";

const themeKey = localStorage.getItem("theme") || "dark";
const initial = allPresets[themeKey] ?? allPresets.dark;

export const colors: ColorScheme = { ...initial };
export const shadows: ColorScheme["shadows"] = initial.shadows;

export function applyCssVars() {
    const root = document.documentElement;
    const s = colors;

    const set = (k: string, v: string) => root.style.setProperty(k, v);

    set("--bg-base", s.bg.base);
    set("--bg-surface", s.bg.surface);
    set("--bg-elevated", s.bg.elevated);
    set("--bg-hover", s.bg.hover);
    set("--bg-selected", s.bg.selected);
    set("--fg-base", s.fg.base);
    set("--fg-dim", s.fg.dim);
    set("--border", s.border);
    set("--fill", s.fill);

    set("--accent-red", s.accent.red);
    set("--accent-cyan", s.accent.cyan);
    set("--accent-yellow", s.accent.yellow);
    set("--accent-blue", s.accent.blue);
    set("--accent-purple", s.accent.purple);
    set("--accent-teal", s.accent.teal);
    set("--accent-orange", s.accent.orange);
    set("--accent-green", s.accent.green);

    set("--color-scheme", themeKey === "light" ? "light" : "dark");
}

export type Colors = ColorScheme;

// Lift a fill/surface color toward its hover state so hover always "stands out":
// lighten dark colors, darken light ones (direction from the color's own
// luminance, so it works in both light and dark themes without a mode flag).
export function hoverFill(hex: string, amount = 14): string {
    const h = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const dir = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 > 140 ? -1 : 1;
    const to2 = (c: number) => Math.max(0, Math.min(255, c + dir * amount)).toString(16).padStart(2, "0");
    return `#${to2(r)}${to2(g)}${to2(b)}`;
}
