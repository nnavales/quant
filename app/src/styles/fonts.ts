export const fonts = {
    family: {
        sans: '"IBM Plex Sans", system-ui, sans-serif',
        display: '"Lexend", system-ui, sans-serif',
        mono: '"JetBrains Mono", monospace',
    },
    size: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
    },
    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tighter: 1.1,
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export type Fonts = typeof fonts;
