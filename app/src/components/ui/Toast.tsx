import { useEffect, useState, useCallback } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { addToastListener, type Toast, type ToastType } from "@/utils/toast";

const DISMISS_MS = 4000;
const EXIT_MS = 220;

const accentColor = (type: ToastType) =>
    type === "error" ? colors.accent.red : type === "warning" ? colors.accent.yellow : colors.accent.green;

const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: spacing[5],
    right: spacing[5],
    zIndex: 1000,
    pointerEvents: "none",
};

const toastStyle = (type: ToastType, exiting: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: "1px solid transparent",
    borderLeft: `3px solid ${accentColor(type)}`,
    borderRadius: radius.lg,
    boxShadow: `0 8px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.16)`,
    pointerEvents: "auto",
    whiteSpace: "nowrap",
    animation: exiting
        ? `toastSlideOut ${EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards`
        : "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
});

function ToastItem({ toast, onRemove, exiting }: { toast: Toast; onRemove: (id: number) => void; exiting: boolean }) {
    useEffect(() => {
        const t = setTimeout(() => onRemove(toast.id), DISMISS_MS);
        return () => clearTimeout(t);
    }, [toast.id, onRemove]);

    const color = accentColor(toast.type);

    return (
        <div style={toastStyle(toast.type, exiting)}>
            {toast.type === "error" || toast.type === "warning" ? (
                <AlertCircle size={14} strokeWidth={2.5} style={{ color, flexShrink: 0 }} />
            ) : (
                <CheckCircle size={14} strokeWidth={2.5} style={{ color, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: fonts.weight.regular }}>
                {toast.message}
            </span>
            <button
                onClick={() => onRemove(toast.id)}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.fg.base; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.fg.dim; }}
                style={{ background: "transparent", border: "none", color: colors.fg.dim, cursor: "pointer", padding: 0, display: "flex", flexShrink: 0, marginLeft: spacing[1], transition: "color 0.12s ease" }}
                aria-label="Cerrar notificación"
            >
                <X size={12} strokeWidth={2.5} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [exiting, setExiting] = useState<Set<number>>(new Set());

    useEffect(() => {
        const unsub = addToastListener((t: Toast) => {
            setToasts((prev) => [...prev, t].slice(-1));
        });
        return () => { unsub(); };
    }, []);

    const removeToast = useCallback((id: number) => {
        setExiting((prev) => new Set([...prev, id]));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            setExiting((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }, EXIT_MS);
    }, []);

    return (
        <>
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(8px) scale(0.97); }
                    to   { opacity: 1; transform: translateX(0)   scale(1);    }
                }
                @keyframes toastSlideOut {
                    from { opacity: 1; transform: translateX(0)   scale(1);    }
                    to   { opacity: 0; transform: translateX(8px)  scale(0.97); }
                }
            `}</style>
            {toasts.length > 0 && (
                <div style={containerStyle}>
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onRemove={removeToast} exiting={exiting.has(t.id)} />
                    ))}
                </div>
            )}
        </>
    );
}
