import { useRef } from "react";
import { Plus } from "lucide-react";

interface InputGroupProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    buttonLabel?: string;
    autoFocus?: boolean;
}

const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--spacing-2)",
    marginBottom: "var(--spacing-4)",
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "8px 12px",
    backgroundColor: "var(--bg-dim)",
    border: "1px solid var(--highlight-medium)",
    borderRadius: "var(--radius-md)",
    color: "var(--fg-default)",
    fontSize: "var(--font-size-sm)",
    outline: "none",
    transition: "border-color 0.15s",
};

const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "var(--accent-teal)",
    color: "var(--bg-default)",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "var(--font-size-sm)",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
};

export function InputGroup({ placeholder, value, onChange, onSubmit, buttonLabel = "Agregar", autoFocus }: InputGroupProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div style={containerStyle}>
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit();
                }}
                autoFocus={autoFocus}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-teal)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--highlight-medium)")}
            />
            <button
                onClick={onSubmit}
                disabled={!value.trim()}
                style={{
                    ...buttonStyle,
                    opacity: value.trim() ? 1 : 0.5,
                }}
            >
                <Plus size={16} />
                {buttonLabel}
            </button>
        </div>
    );
}
