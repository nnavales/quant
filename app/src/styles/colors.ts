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
    hoverFill: string;
    variant: {
        green: VariantState;
        red: VariantState;
        cyan: VariantState;
        blue: VariantState;
        orange: VariantState;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
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

    set("--shadow-sm", s.shadows.sm);
    set("--shadow-md", s.shadows.md);

    set("--color-scheme", themeKey === "light" ? "light" : "dark");
}

export type Colors = ColorScheme;
