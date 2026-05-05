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

    "rose-pine": buildScheme({
        name: "Rose Pine",
        bg: "#232136",
        fg: { base: "#e0def4", dim: "#908caa" },
        border: "#393552",
        fill: "#2a283e",
        accent: {
            red: "#eb6f92", green: "#9ccfd8", yellow: "#f6c177", blue: "#3e8fb0",
            purple: "#c4a7e7", teal: "#9ccfd8", orange: "#ea9a97", cyan: "#9ccfd8",
        },
    }),

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

    monokai: buildScheme({
        name: "Monokai",
        bg: "#272822",
        fg: { base: "#f8f8f2", dim: "#75715e" },
        border: "#3e3d32",
        fill: "#2e2f2a",
        accent: {
            red: "#f92672", green: "#a6e22e", yellow: "#e6db74", blue: "#66d9e8",
            purple: "#ae81ff", teal: "#66d9e8", orange: "#fd971f", cyan: "#66d9e8",
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

    light: buildScheme({
        name: "Light",
        mode: "light",
        bg: "#E5E7EB",
        fg: { base: "#1A1D23", dim: "#868E96" },
        border: "#C4C9D0",
        fill: "#D5D9DE",
        accent: {
            red: "#E0315B", green: "#2F9E44", yellow: "#E6A817", blue: "#3B7FE0",
            purple: "#9C5CE0", teal: "#20A884", orange: "#E07B2C", cyan: "#15AABF",
        },
    }),
};
