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
        white: string;
    };
    bg: {
        base: string;
        surface: string;
        header: string;
        hover: string;
        selected: string;
    };
    border: string;
    fill: string;
    interactive: {
        hoverBg: string;
        hoverBorder: string;
    };
    variant: {
        green: VariantState;
        red: VariantState;
        cyan: VariantState;
        blue: VariantState;
        orange: VariantState;
        teal: VariantState;
    };
    shadows: {
        sm: string;
        base: string;
        md: string;
        lg: string;
        xl: string;
        modal: string;
        tooltip: string;
        toast: string;
        card: string;
        dialog: string;
        dropdown: string;
        calendar: string;
        button: string;
        tab: string;
    };
    heatmap: {
        green: { low: string; mid: string; high: string };
        red: { low: string; mid: string; high: string };
    };
    overlay: {
        white06: string;
        white08: string;
        black30: string;
        black55: string;
    };
    widget: {
        cyanBg: string;
        cyanBorder: string;
        purpleBg: string;
        purpleBorder: string;
    };
    badge: {
        income: string;
        expense: string;
        destructive: string;
    };
}

export { presets } from "./presets";

import { presets as allPresets } from "./presets";

const themeKey = localStorage.getItem("theme") || "dark";
const initial = allPresets[themeKey] ?? allPresets.dark;

export const colors: ColorScheme = { ...initial };
export const shadows = initial.shadows;

export function applyCssVars() {
    const root = document.documentElement;
    const s = colors;

    const set = (k: string, v: string) => root.style.setProperty(k, v);

    set("--bg-base", s.bg.base);
    set("--bg-surface", s.bg.surface);
    set("--bg-header", s.bg.header);
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
    set("--shadow-base", s.shadows.base);
    set("--shadow-md", s.shadows.md);
    set("--shadow-lg", s.shadows.lg);
    set("--shadow-xl", s.shadows.xl);

    set("--color-scheme", themeKey === "light" ? "light" : "dark");
}

export type Colors = ColorScheme;
