import { useRef } from "react";
import { Plus } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { inputStyle as layoutInputStyle } from "@/styles/layout";

interface InputGroupProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    buttonLabel?: string;
    autoFocus?: boolean;
    containerStyle?: React.CSSProperties;
    inputStyle?: React.CSSProperties;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: spacing[2],
};

export function InputGroup({ placeholder, value, onChange, onSubmit, buttonLabel = "Agregar", autoFocus, containerStyle: containerStyleOverride, inputStyle: inputStyleOverride, onKeyDown }: InputGroupProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div style={{ ...containerStyle, ...containerStyleOverride }}>
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit();
                    onKeyDown?.(e);
                }}
                autoFocus={autoFocus}
                style={{ ...layoutInputStyle, flex: 1, border: "none", ...inputStyleOverride }}
            />
            <button
                type="button"
                onClick={onSubmit}
                disabled={!value.trim()}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.fg.base; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.fg.dim; }}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing[1],
                    height: "32px",
                    padding: `0 ${spacing[3]}`,
                    backgroundColor: colors.bg.surface,
                    border: "none",
                    borderRadius: radius.md,
                    color: colors.fg.dim,
                    cursor: value.trim() ? "pointer" : "not-allowed",
                    fontSize: fonts.size.sm,
                    fontFamily: fonts.family,
                    fontWeight: fonts.weight.medium,
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                    opacity: value.trim() ? 1 : 0.5,
                }}
            >
                <Plus size={16} />
                {buttonLabel}
            </button>
        </div>
    );
}
