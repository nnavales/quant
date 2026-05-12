import { useEffect, useState, useCallback } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { addToastListener, type Toast, type ToastType } from "@/utils/toast";

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
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
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
            ? `${colors.accent.red}1A`
            : type === "warning"
              ? `${colors.accent.yellow}1A`
              : `${colors.accent.green}1A`,
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
                    <AlertCircle size={14} style={{ color: colors.accent.yellow }} />
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
        const unsub = addToastListener((t: Toast) => {
            setToasts((prev) => [...prev, t].slice(-3)); // keep last 3
        });
        return () => { unsub(); };
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

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
            {toasts.length > 0 && (
                <div style={containerStyle}>
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                    ))}
                </div>
            )}
        </>
    );
}
