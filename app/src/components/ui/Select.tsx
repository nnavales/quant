import { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { spacing, radius, shadows } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { useClickOutside } from "@/hooks";

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
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => setOpen(false));

    const selected = options.find((o) => o.value === value);

    return (
        <div ref={ref} style={{ position: "relative", ...style }}>
            <button
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
                    fontSize: fonts.table.meta,
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
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: spacing[1],
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.fill}`,
                        borderRadius: radius.md,
                        padding: spacing[1],
                        minWidth: "100%",
                        zIndex: 200,
                        boxShadow: shadows.lg,
                    }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: radius.sm,
                                cursor: "pointer",
                                fontSize: fonts.table.meta,
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