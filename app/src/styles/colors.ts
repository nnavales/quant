export const colors = {
    accent: {
        orange: "#E09B5C",
        purple: "#C97EE8",
        green: "#7DC468",
        yellow: "#D4C44A",
        teal: "#3DB89E",
        cyan: "#7DD3E8",
        red: "#D9546B",
        grey: "#A8B8BA",
        blue: "#6B9BF2",
    },
    fg: {
        base: "#E8ECED",
        dim: "#9AA3A8",
    },
    bg: {
        base: "#181A1C",
        surface: "#16181A",
    },
    border: "#2E3135",
    fill: "#23262A",
} as const;

export type Colors = typeof colors;
