import { useEffect, useState, useCallback } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";

export type ToastType = "error" | "success" | "warning";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function toast(message: string, type: ToastType = "error") {
    const t: Toast = { id: ++toastId, message, type };
    listeners.forEach((listener) => listener(t));
}

/* ─── Subtle depth without colored borders ─── */
const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: spacing[5],
    right: spacing[5],
    display: "flex",
    flexDirection: "column",
    gap: spacing[2],
    zIndex: 1000,
    maxWidth: "340px",
    width: "100%",
    pointerEvents: "none",
};

const toastBaseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: spacing[3],
    padding: `${spacing[3]} ${spacing[4]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.lg,
    boxShadow: `0 8px 24px rgba(0,0,0,0.35)`,
    pointerEvents: "auto",
    animation: "toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
};

const iconWrapStyle = (type: ToastType): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: radius.full,
    backgroundColor:
        type === "error"
            ? "rgba(217, 84, 107, 0.12)"
            : type === "warning"
              ? "rgba(234, 179, 8, 0.12)"
              : "rgba(125, 196, 104, 0.12)",
    flexShrink: 0,
    marginTop: "1px",
});

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div style={toastBaseStyle}>
            <div style={iconWrapStyle(toast.type)}>
                {toast.type === "error" ? (
                    <AlertCircle size={14} style={{ color: colors.accent.red }} />
                ) : toast.type === "warning" ? (
                    <AlertCircle size={14} style={{ color: "#eab308" }} />
                ) : (
                    <CheckCircle size={14} style={{ color: colors.accent.green }} />
                )}
            </div>
            <span
                style={{
                    flex: 1,
                    fontSize: fonts.size.sm,
                    color: colors.fg.base,
                    lineHeight: 1.45,
                    fontWeight: 400,
                    paddingTop: "1px",
                }}
            >
                {toast.message}
            </span>
            <button
                onClick={() => onRemove(toast.id)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.fg.base;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.fg.dim;
                }}
                style={{
                    background: "transparent",
                    border: "none",
                    color: colors.fg.dim,
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    flexShrink: 0,
                    marginTop: "2px",
                    transition: "color 0.12s ease",
                }}
                aria-label="Cerrar notificación"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (t: Toast) => {
            setToasts((prev) => [...prev, t].slice(-4)); // keep last 4
        };
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(12px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
            `}</style>
            <div style={containerStyle}>
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>
        </>
    );
}
