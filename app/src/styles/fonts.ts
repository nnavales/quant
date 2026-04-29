export const fonts = {
    family: {
        text: '"Inter", system-ui, sans-serif',
        display: '"Inter", system-ui, sans-serif',
    },
    size: {
        "2xs": "9px",
        xs: "11px",
        sm: "13px",
        base: "15px",
        lg: "17px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
        "4xl": "34px",
        "5xl": "48px",
    },
    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
    },
    lineHeight: {
        tighter: 1.1,
        tight: 1.25,
        normal: 1.4,
        relaxed: 1.6,
    },
    table: {
        // Column headers
        header: "12px",
        // Main text in rows (names, descriptions)
        body: "13.5px",
        // Money amounts in transaction rows
        amount: "13.5px",
        // Badges (EGRESO/INGRESO, ARS/USD)
        badge: "12px",
        // Secondary metadata (dates, categories, subcategories)
        meta: "11.5px",
        // Prominent amounts (Net Worth list)
        lg: "14px",
        // Large KPI values
        xl: "20px",
    },
} as const;

export type Fonts = typeof fonts;

