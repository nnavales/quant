export const fonts = {
    family: '"Inter", system-ui, sans-serif',
    monoFamily: '"monospace"',
    size: {
        xs: "11px",
        xs2: "11.5px",
        xs3: "12px",
        xs4: "12.5px",
        sm: "13px",
        sm2: "13.3px",
        sm3: "13.5px",
        base: "15px",
        lg: "17px",
        xl: "20px",
        xl2: "24px",
        xl3: "28px",
    },
    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;

export type Fonts = typeof fonts;
