export { colors } from "./colors";
export { fonts } from "./fonts";
export { theme, spacing, radius, shadows, breakpoints } from "./theme";

import type { Theme, Spacing, Radius, Shadows, Breakpoints } from "./theme";

export type { Theme, Spacing, Radius, Shadows, Breakpoints };

export function createCssVariables(theme: Theme): Record<string, string> {
    const vars: Record<string, string> = {};

    (Object.entries(theme.colors) as [string, Record<string, string>][]).forEach(
        ([key, colorObj]) => {
            Object.entries(colorObj).forEach(([subKey, subValue]) => {
                vars[`--color-${key}-${subKey}`] = subValue;
            });
        }
    );

    (Object.entries(theme.spacing) as [string, string][]).forEach(([key, value]) => {
        vars[`--spacing-${key}`] = value;
    });

    (Object.entries(theme.radius) as [string, string][]).forEach(([key, value]) => {
        vars[`--radius-${key}`] = value;
    });

    (Object.entries(theme.shadows) as [string, string][]).forEach(([key, value]) => {
        vars[`--shadow-${key}`] = value;
    });

    const families = theme.fonts.family as Record<string, string>;
    Object.entries(families).forEach(([key, value]) => {
        vars[`--font-${key}`] = value;
    });

    const sizes = theme.fonts.size as Record<string, string>;
    Object.entries(sizes).forEach(([key, value]) => {
        vars[`--font-size-${key}`] = value;
    });

    const weights = theme.fonts.weight as Record<string, number>;
    Object.entries(weights).forEach(([key, value]) => {
        vars[`--font-weight-${key}`] = String(value);
    });

    return vars;
}
