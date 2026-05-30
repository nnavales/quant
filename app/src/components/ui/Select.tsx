import { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { useClickOutside, useDropdownPosition } from "@/hooks";

interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    style?: React.CSSProperties;
}

export function CustomSelect({ value, options, onChange, style }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    useClickOutside(wrapperRef, () => setOpen(false));
    useDropdownPosition(triggerRef, panelRef, open, { matchTriggerWidth: true });

    const handleSelect = (v: string) => {
        onChange(v);
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: "relative", ...style }}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[1],
                    padding: `${spacing[1]} ${spacing[2]}`,
                    backgroundColor: colors.bg.surface,
                    border: `1px solid ${colors.fill}`,
                    borderRadius: radius.md,
                    color: colors.fg.base,
                    fontSize: fonts.size.xs4,
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "space-between",
                }}
            >
                <span>{selected?.label || "..."}</span>
                <ChevronDown size={12} color={colors.fg.dim} />
            </button>
            {open && (
                <div
                    ref={panelRef}
                    style={{
                        position: "fixed",
                        visibility: "hidden",
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        padding: spacing[1],
                        zIndex: 9999,
                    }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: radius.sm,
                                cursor: "pointer",
                                fontSize: fonts.size.xs4,
                                color: colors.fg.base,
                                backgroundColor: opt.value === value ? colors.fill : "transparent",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.fill)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = opt.value === value ? colors.fill : "transparent")}
                        >
                            <span>{opt.label}</span>
                            {opt.value === value && <Check size={12} color={colors.accent.cyan} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
