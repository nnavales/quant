import type { ReactNode } from "react";
import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { flexColumn, flexRow } from "@/styles/layout";

interface PageHeaderProps {
    title: ReactNode;
    /** Optional one-line description under the title. */
    subtitle?: ReactNode;
    /** Right-aligned controls in the title row (e.g. HelpButton, action buttons). */
    actions?: ReactNode;
    /** Extra content rendered below the title row, still inside the fixed header band. */
    children?: ReactNode;
}

/**
 * Shared page header. Reserves a fixed-height band (minHeight 64px) so the page
 * body always starts at the same vertical position when switching between pages.
 */
export function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
    return (
        <div style={{ ...flexColumn, gap: spacing[2], flexShrink: 0, minHeight: "64px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: subtitle ? "flex-start" : "center",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: fonts.family,
                            fontSize: fonts.size.xl,
                            fontWeight: fonts.weight.semibold,
                            color: colors.fg.base,
                            margin: 0,
                            marginBottom: subtitle ? spacing[1] : 0,
                        }}
                    >
                        {title}
                    </h1>
                    {subtitle != null && (
                        <p
                            style={{
                                fontFamily: fonts.family,
                                fontSize: fonts.size.base,
                                color: colors.fg.dim,
                                margin: 0,
                                minHeight: "1.4em",
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions != null && (
                    <div style={{ ...flexRow, gap: spacing[2], flexShrink: 0 }}>{actions}</div>
                )}
            </div>
            {children}
        </div>
    );
}

/** The round "?" button that opens a page's HelpModal. */
export function HelpButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "none",
                backgroundColor: "transparent",
                color: colors.fg.dim,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: fonts.size.xs2,
                fontWeight: fonts.weight.bold,
                transition: "all 0.12s",
                flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
        >
            ?
        </button>
    );
}
