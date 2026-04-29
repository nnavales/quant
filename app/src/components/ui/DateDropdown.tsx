import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius, shadows } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { useClickOutside } from "@/hooks";

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
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    padding: spacing[2],
    zIndex: 1001,
    boxShadow: shadows.lg,
    display: "flex",
    flexDirection: "column",
    gap: "1px",
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

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current) return null;
        const rect = triggerRef.current.getBoundingClientRect();
        const panelH = 320;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow >= panelH + 8 ? rect.bottom + 4 : rect.top - panelH - 4;
        return { top, left: rect.left };
    }, []);

    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (open) {
            const pos = calculatePosition();
            if (pos) setPosition(pos);
        }
    }, [open, calculatePosition]);

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
                    height: "40px",
                    backgroundColor: colors.bg.base,
                    border: `1px solid ${colors.fill}`,
                    borderRadius: radius.md,
                    color: label ? colors.fg.base : colors.fg.dim,
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: fonts.size.sm,
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border-color 0.15s",
                    ...triggerStyle,
                }}
                onMouseEnter={(e) => {
                    if (!disabled) e.currentTarget.style.borderColor = colors.fill;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.fill;
                }}
            >
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: label ? 500 : 400,
                    }}
                >
                    {label || placeholder}
                </span>
                <ChevronDown
                    size={14}
                    style={{
                        flexShrink: 0,
                        opacity: 0.6,
                        transition: "transform 0.2s",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                />
            </button>

            {open && position && (
                <div
                    ref={panelRef}
                    data-dropdown-panel
                    style={{
                        ...PANEL_BASE,
                        top: position.top,
                        left: position.left,
                        width: typeof triggerStyle?.width === "number"
                            ? `${triggerStyle.width}px`
                            : triggerStyle?.width || "260px",
                    }}
                >
                    {children}
                </div>
            )}
        </>
    );
}
