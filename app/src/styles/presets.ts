import type { ColorScheme } from "./colors";

interface PresetInput {
    name: string;
    mode?: "dark" | "light";
    bg: string;
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
}

function shift(hex: string, amount: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    const r = clamp(parseInt(hex.slice(1, 3), 16) + amount);
    const g = clamp(parseInt(hex.slice(3, 5), 16) + amount);
    const b = clamp(parseInt(hex.slice(5, 7), 16) + amount);
    const h = (n: number) => n.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
}

function buildScheme(input: PresetInput): ColorScheme {
    const { accent, fg } = input;
    const isLight = input.mode === "light";

    const base = input.bg;
    const surface = isLight ? shift(base, 32) : shift(base, -2);
    const header = isLight ? shift(surface, -25) : shift(surface, -2);
    const hover = isLight ? shift(surface, -35) : shift(surface, 3);
    const border = isLight ? shift(base, -22) : shift(base, 12);
    const fill = isLight ? shift(base, -12) : shift(base, 6);

    const variant = (color: string) => ({
        bg: `${color}1A`,
        border: `${color}40`,
        hoverBg: `${color}2E`,
        hoverBorder: `${color}59`,
    });

    const borderOverlay = isLight
        ? { white06: "rgba(0, 0, 0, 0.06)", white08: "rgba(0, 0, 0, 0.08)" }
        : { white06: "rgba(255, 255, 255, 0.06)", white08: "rgba(255, 255, 255, 0.08)" };

    const heatmap = isLight
        ? {
              green: { low: "#e6f5e6", mid: "#c8e6c8", high: "#a5d6a5" },
              red: { low: "#fce4e4", mid: "#f5c6c6", high: "#e8a0a0" },
          }
        : {
              green: { low: "#0d1a0d", mid: "#1a3a1a", high: "#2a5a2a" },
              red: { low: "#1a0d0d", mid: "#3a1a1a", high: "#6a2a2a" },
          };

    const shadows = isLight ? lightShadows() : darkShadows();

    return {
        accent: { ...accent },
        fg: { ...fg, white: "#FFFFFF" },
        bg: {
            base,
            surface,
            header,
            hover,
        },
        border,
        fill,
        interactive: {
            hoverBg: hover,
            hoverBorder: input.border,
        },
        variant: {
            green: variant(accent.green),
            red: variant(accent.red),
            cyan: variant(accent.cyan),
            blue: variant(accent.blue),
            orange: variant(accent.orange),
            teal: variant(accent.teal),
        },
        shadows,
        heatmap,
        overlay: {
            ...borderOverlay,
            black30: "rgba(0, 0, 0, 0.30)",
            black55: "rgba(0, 0, 0, 0.55)",
        },
        widget: {
            cyanBg: `${accent.cyan}0F`,
            cyanBorder: `${accent.cyan}1F`,
            purpleBg: `${accent.purple}0F`,
            purpleBorder: `${accent.purple}1F`,
        },
        badge: {
            income: `${accent.green}1F`,
            expense: `${accent.red}1F`,
            destructive: `${accent.red}1A`,
        },
    };
}

function darkShadows(): ColorScheme["shadows"] {
    return {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        modal: "0 25px 50px -12px rgb(0 0 0 / 0.5)",
        tooltip: "0 8px 24px rgb(0 0 0 / 0.45)",
        toast: "0 8px 24px rgb(0 0 0 / 0.35)",
        card: "0 4px 24px rgb(0 0 0 / 0.2)",
        dialog: "0 16px 48px rgb(0 0 0 / 0.4)",
        dropdown: "0 4px 12px rgb(0 0 0 / 0.2)",
        calendar: "0 10px 25px -3px rgb(0 0 0 / 0.3)",
        button: "0 1px 3px rgb(0 0 0 / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.06)",
        tab: "0 1px 2px rgb(0 0 0 / 0.15)",
    };
}

function lightShadows(): ColorScheme["shadows"] {
    return {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        base: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)",
        modal: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        tooltip: "0 8px 24px rgb(0 0 0 / 0.15)",
        toast: "0 8px 24px rgb(0 0 0 / 0.12)",
        card: "0 4px 24px rgb(0 0 0 / 0.08)",
        dialog: "0 16px 48px rgb(0 0 0 / 0.15)",
        dropdown: "0 4px 12px rgb(0 0 0 / 0.08)",
        calendar: "0 10px 25px -3px rgb(0 0 0 / 0.12)",
        button: "0 1px 2px rgb(0 0 0 / 0.06), inset 0 1px 0 rgb(0 0 0 / 0.04)",
        tab: "0 1px 2px rgb(0 0 0 / 0.06)",
    };
}

export const presets: Record<string, ColorScheme> = {
    /* ─── Light ─── */
    light: buildScheme({
        name: "Light",
        mode: "light",
        bg: "#EBEDF0",
        fg: { base: "#161A1F", dim: "#7D8594" },
        border: "#C8CDD4",
        fill: "#DEE1E6",
        accent: {
            red: "#D92B4A", green: "#2B9E44", yellow: "#D9A817", blue: "#2B7FE0",
            purple: "#8C5CE0", teal: "#1A9E7A", orange: "#D96B2B", cyan: "#159ABF",
        },
    }),

    monochrome: {
        ...buildScheme({
            name: "Monochrome",
            mode: "light",
            bg: "#F2F2F2",
            fg: { base: "#1A1A1A", dim: "#7A7A7A" },
            border: "#D6D6D6",
            fill: "#E6E6E6",
            accent: {
                red: "#4A4A4A", green: "#4A4A4A", yellow: "#4A4A4A", blue: "#4A4A4A",
                purple: "#4A4A4A", teal: "#4A4A4A", orange: "#4A4A4A", cyan: "#4A4A4A",
            },
        }),
        heatmap: {
            green: { low: "#E8E8E8", mid: "#CCCCCC", high: "#999999" },
            red: { low: "#E8E8E8", mid: "#CCCCCC", high: "#999999" },
        },
    },

    "monochrome-dark": {
        ...buildScheme({
            name: "Monochrome Dark",
            bg: "#0E0E0E",
            fg: { base: "#EAEAEA", dim: "#6A6A6A" },
            border: "#1E1E1E",
            fill: "#141414",
            accent: {
                red: "#555555", green: "#555555", yellow: "#555555", blue: "#555555",
                purple: "#555555", teal: "#555555", orange: "#555555", cyan: "#555555",
            },
        }),
        heatmap: {
            green: { low: "#141414", mid: "#282828", high: "#4A4A4A" },
            red: { low: "#141414", mid: "#282828", high: "#4A4A4A" },
        },
    },

    /* ─── Pure Dark / Minimal ─── */
    dark: buildScheme({
        name: "Dark",
        bg: "#181A1C",
        fg: { base: "#F0F2F5", dim: "#8A9299" },
        border: "#24272B",
        fill: "#1E2124",
        accent: {
            red: "#F25D7A", green: "#5CE68A", yellow: "#F2C94C", blue: "#5B9CF5",
            purple: "#C084FC", teal: "#3DD9A0", orange: "#F2994A", cyan: "#5EE7F0",
        },
    }),

    "perfect-black": buildScheme({
        name: "Perfect Black",
        bg: "#111111",
        fg: { base: "#F5F5F5", dim: "#888888" },
        border: "#2A2A2A",
        fill: "#1A1A1A",
        accent: {
            red: "#E85D5D", green: "#5DC86D", yellow: "#E0C050", blue: "#5D9DE5",
            purple: "#B080E0", teal: "#50C8A8", orange: "#E09050", cyan: "#50C0D8",
        },
    }),

    /* ─── Cool Blue Dark ─── */
    "one-dark": buildScheme({
        name: "One Dark",
        bg: "#282c34",
        fg: { base: "#abb2bf", dim: "#5c6370" },
        border: "#3e4451",
        fill: "#2c313c",
        accent: {
            red: "#e06c75", green: "#98c379", yellow: "#e5c07b", blue: "#61afef",
            purple: "#c678dd", teal: "#56b6c2", orange: "#e5c07b", cyan: "#56b6c2",
        },
    }),

    "tokyo-night": buildScheme({
        name: "Tokyo Night",
        bg: "#1A1B26",
        fg: { base: "#A9B1D6", dim: "#565F89" },
        border: "#24283B",
        fill: "#1F2133",
        accent: {
            red: "#F7768E", green: "#9ECE6A", yellow: "#E0AF68", blue: "#7AA2F7",
            purple: "#BB9AF7", teal: "#73DACA", orange: "#FF9E64", cyan: "#7DCFFF",
        },
    }),

    "ayu-mirage": buildScheme({
        name: "Ayu Mirage",
        bg: "#1F2430",
        fg: { base: "#CBD9E8", dim: "#8A919F" },
        border: "#2D3340",
        fill: "#242936",
        accent: {
            red: "#F28779", green: "#A6CC70", yellow: "#FFD173", blue: "#5CCFE6",
            purple: "#D4BFFF", teal: "#95E6CB", orange: "#F29E74", cyan: "#5CCFE6",
        },
    }),

    /* ─── Warm Dark ─── */
    gruvbox: buildScheme({
        name: "Gruvbox",
        bg: "#282828",
        fg: { base: "#EBDBB2", dim: "#928374" },
        border: "#3C3836",
        fill: "#2E2C2A",
        accent: {
            red: "#CC241D", green: "#98971A", yellow: "#D79921", blue: "#458588",
            purple: "#B16286", teal: "#689D6A", orange: "#D65D0E", cyan: "#689D6A",
        },
    }),

    charcoal: buildScheme({
        name: "Charcoal",
        bg: "#181715",
        fg: { base: "#F4F3EE", dim: "#8A867E" },
        border: "#2A2825",
        fill: "#201E1B",
        accent: {
            red: "#C15F3C", green: "#6BBF8A", yellow: "#D4A84B", blue: "#6A9FBF",
            purple: "#A080C0", teal: "#5AAB8A", orange: "#D07A40", cyan: "#5AA8A0",
        },
    }),

    /* ─── Colorful / Vibrant Dark ─── */
    dracula: buildScheme({
        name: "Dracula",
        bg: "#282a36",
        fg: { base: "#f8f8f2", dim: "#6272a4" },
        border: "#44475a",
        fill: "#313340",
        accent: {
            red: "#ff5555", green: "#50fa7b", yellow: "#f1fa8c", blue: "#bd93f9",
            purple: "#bd93f9", teal: "#8be9fd", orange: "#ffb86c", cyan: "#8be9fd",
        },
    }),

    catppuccin: buildScheme({
        name: "Catppuccin",
        bg: "#1e1e2e",
        fg: { base: "#cdd6f4", dim: "#6c7086" },
        border: "#45475a",
        fill: "#26263a",
        accent: {
            red: "#f38ba8", green: "#a6e3a1", yellow: "#f9e2af", blue: "#89b4fa",
            purple: "#cba6f7", teal: "#94e2d5", orange: "#fab387", cyan: "#89dceb",
        },
    }),

    kanagawa: buildScheme({
        name: "Kanagawa",
        bg: "#1f1f28",
        fg: { base: "#dcd7ba", dim: "#727169" },
        border: "#363646",
        fill: "#25252f",
        accent: {
            red: "#c34043", green: "#98bb6c", yellow: "#e6c384", blue: "#7e9cd8",
            purple: "#957fb8", teal: "#7aa89f", orange: "#ffa066", cyan: "#6a9589",
        },
    }),

    /* ─── Green / Nature Dark ─── */
    everforest: buildScheme({
        name: "Everforest",
        bg: "#2d353b",
        fg: { base: "#d3c6aa", dim: "#859289" },
        border: "#3d484d",
        fill: "#303940",
        accent: {
            red: "#e67e80", green: "#a7c080", yellow: "#dbbc7f", blue: "#7fbbb3",
            purple: "#d699b6", teal: "#83c092", orange: "#e69875", cyan: "#83c092",
        },
    }),

    jade: buildScheme({
        name: "Jade",
        bg: "#0F1A18",
        fg: { base: "#D4E8E4", dim: "#6B8A85" },
        border: "#1A2D29",
        fill: "#14221F",
        accent: {
            red: "#D46575", green: "#5DB893", yellow: "#C9B870", blue: "#5A8FAA",
            purple: "#9A7AB5", teal: "#4AA88A", orange: "#C98550", cyan: "#5AA8A0",
        },
    }),

    /* ─── Pink / Sakura ─── */
    sakura: buildScheme({
        name: "Sakura",
        bg: "#120E14",
        fg: { base: "#E0D8E0", dim: "#8A7A8A" },
        border: "#221E28",
        fill: "#18151C",
        accent: {
            red: "#FF6B8A", green: "#8ABF6B", yellow: "#E0C04A", blue: "#7A8FBF",
            purple: "#D080C0", teal: "#6AAB8A", orange: "#E08A5A", cyan: "#6AA8A0",
        },
    }),
};
