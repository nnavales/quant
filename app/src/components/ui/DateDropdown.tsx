import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius, shadows } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { useClickOutside, useDropdownPosition } from "@/hooks";
import { truncate } from "@/styles/layout";

export interface DateDropdownProps {
    label: string | null;
    placeholder?: string;
    triggerStyle?: React.CSSProperties;
    disabled?: boolean;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const PANEL_BASE: React.CSSProperties = {
    position: "fixed",
    backgroundColor: colors.bg.surface,
    border: "none",
    borderRadius: radius.md,
    padding: spacing[2],
    zIndex: 1001,
    display: "flex",
    flexDirection: "column",
    gap: spacing[1],
    minWidth: "160px",
    maxWidth: "280px",
    boxShadow: shadows.md,
};

export function DateDropdown({
    label,
    placeholder = "Fecha",
    triggerStyle,
    disabled = false,
    open,
    onToggle,
    children,
}: DateDropdownProps) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useDropdownPosition(triggerRef, panelRef, open, { maxHeight: 320, matchTriggerWidth: true, minWidth: 160 });

    useClickOutside(triggerRef, () => {
        if (open) onToggle();
    }, {
        escapeKey: true,
        excludeSelector: "[data-dropdown-panel]",
    });

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                disabled={disabled}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing[2],
                    padding: `0 ${spacing[2]}`,
                    height: "34px",
                    backgroundColor: colors.fill,
                    border: "none",
                    borderRadius: radius.md,
                    color: label ? colors.fg.base : colors.fg.dim,
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: fonts.size.sm,
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none",
                    ...triggerStyle,
                }}

            >
                <span
                    style={{...truncate, fontWeight: label ? fonts.weight.medium : fonts.weight.regular}}
                >
                    {label || placeholder}
                </span>
                <ChevronDown
                    size={14}
                    strokeWidth={2.5}
                    style={{
                        flexShrink: 0,
                        opacity: 0.6,
                        transition: "transform 0.2s",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                />
            </button>

            {open && (
                <div
                    ref={panelRef}
                    data-dropdown-panel
                    style={{
                        ...PANEL_BASE,
                        visibility: "hidden",
                        maxHeight: "320px",
                        overflowY: "auto",
                    }}
                >
                    {children}
                </div>
            )}
        </>
    );
}
