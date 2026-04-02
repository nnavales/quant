import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

export type ToastType = "error" | "success";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function toast(message: string, type: ToastType = "error") {
    const toast: Toast = { id: ++toastId, message, type };
    listeners.forEach((listener) => listener(toast));
}

const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "var(--spacing-4)",
    right: "var(--spacing-4)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-2)",
    zIndex: 1000,
    maxWidth: "320px",
};

const toastStyle = (type: ToastType): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-2)",
    padding: "var(--spacing-3) var(--spacing-4)",
    backgroundColor: "var(--bg-surface)",
    border: `1px solid ${type === "error" ? "var(--semantic-error)" : "var(--semantic-success)"}`,
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    animation: "slideIn 0.2s ease-out",
});

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 4000);
        };
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div style={containerStyle}>
            {toasts.map((t) => (
                <div key={t.id} style={toastStyle(t.type)}>
                    {t.type === "error" ? (
                        <AlertCircle size={18} style={{ color: "var(--semantic-error)", flexShrink: 0 }} />
                    ) : (
                        <CheckCircle size={18} style={{ color: "var(--semantic-success)", flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1, fontSize: "var(--font-size-sm)", color: "var(--fg-default)" }}>
                        {t.message}
                    </span>
                    <button
                        onClick={() => removeToast(t.id)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--fg-muted)",
                            cursor: "pointer",
                            padding: "2px",
                            display: "flex",
                            flexShrink: 0,
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
