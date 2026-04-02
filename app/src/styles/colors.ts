export const colors = {
    accent: {
        orange: "#E9A96E",
        purple: "#D78CF0",
        green: "#8FCF7A",
        yellow: "#D9CC58",
        teal: "#46C2A8",
        cyan: "#A5E9F5",
        red: "#E0617A",
        light_gray: "#BFD6D8",
    },
    semantic: {
        success: "#8FCF7A",
        warning: "#D9CC58",
        error: "#E0617A",
        info: "#A5E9F5",
    },
    fg: {
        default: "#E9F2F2",
        dim: "#879297",
        muted: "#6E797E",
    },
    bg: {
        default: "#181A1C",
        dim: "#131618",
        surface: "#1F2225",
        overlay: "#272C2F",
    },
    highlight: {
        low: "#1B1E20",
        medium: "#202325",
        high: "#33383C",
        border: "#3a3d40",
    },
} as const;

export type Colors = typeof colors;
