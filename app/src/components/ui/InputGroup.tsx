import { useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";

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
    marginBottom: spacing[4],
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    height: "32px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
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
                style={{ ...inputStyle, ...inputStyleOverride }}
                onFocus={(e) => (e.currentTarget.style.borderColor = colors.border)}
                onBlur={(e) => (e.currentTarget.style.borderColor = colors.fill)}
            />
            <Button
                onClick={onSubmit}
                disabled={!value.trim()}
                variant="primary"
                iconLeft={<Plus size={16} />}
            >
                {buttonLabel}
            </Button>
        </div>
    );
}
