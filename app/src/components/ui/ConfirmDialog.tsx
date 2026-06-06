import React, { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors, hoverFill } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Button } from "./Button";
import { SubmitButton } from "./SubmitButton";
import { flexRow } from "@/styles/layout";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    destructive?: boolean;
    requireHold?: boolean;
}

const HOLD_DURATION = 2000;

function HoldButton({
    onConfirm,
    disabled,
}: {
    onConfirm: () => void;
    disabled?: boolean;
}) {
    const [progress, setProgress] = useState(0);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const onConfirmRef = useRef(onConfirm);
    onConfirmRef.current = onConfirm;

    const cancel = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        startRef.current = null;
        setProgress(0);
    }, []);

    const start = useCallback(() => {
        if (disabled) return;
        startRef.current = performance.now();

        const tick = (now: number) => {
            const s = startRef.current;
            if (s === null) return;
            const elapsed = now - s;
            const p = Math.min(elapsed / HOLD_DURATION, 1);
            setProgress(p);
            if (p >= 1) {
                onConfirmRef.current();
                startRef.current = null;
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [disabled]);

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <button
            type="button"
            disabled={disabled}
            onMouseDown={start}
            onMouseUp={cancel}
            onMouseLeave={cancel}
            onTouchStart={(e) => { e.preventDefault(); start(); }}
            onTouchEnd={cancel}
            style={{
                position: "relative",
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: radius.md,
                border: "none",
                backgroundColor: colors.accent.red,
                color: "#fff",
                fontSize: fonts.size.sm,
                fontWeight: fonts.weight.medium,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                overflow: "hidden",
                userSelect: "none",
                flexShrink: 0,
                whiteSpace: "nowrap",
            }}
        >
            <span style={{ position: "relative", zIndex: 1 }}>
                Mantener para confirmar
            </span>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    backgroundColor: colors.overlay.black30,
                    width: `${progress * 100}%`,
                    zIndex: 0,
                }}
            />
        </button>
    );
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    isLoading = false,
    destructive = true,
    requireHold = false,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && !isLoading && !requireHold) onConfirm();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose, onConfirm, isLoading, requireHold]);

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                @keyframes dialogBackdropIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes dialogContentIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: colors.overlay.black55,
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    ...flexRow,
                    justifyContent: "center",
                    zIndex: 1000,
                    animation: "dialogBackdropIn 0.18s ease-out",
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[6],
                        maxWidth: "380px",
                        width: "90%",
                        border: `1px solid transparent`,
                        animation: "dialogContentIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Icon + Title row */}
                    <div
                        style={{
                            ...flexRow,
                            gap: spacing[3],
                            marginBottom: spacing[3],
                        }}
                    >
                        {destructive && (
                            <div
                                style={{
                                    ...flexRow,
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: radius.full,
                                    backgroundColor: `${colors.accent.red}1A`,
                                    flexShrink: 0,
                                }}
                            >
                                <AlertTriangle size={16} strokeWidth={2.5} style={{ color: colors.accent.red }} />
                            </div>
                        )}
                        <h3
                            style={{
                                margin: 0,
                                fontSize: fonts.size.lg,
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                lineHeight: 1.3,
                            }}
                        >
                            {title}
                        </h3>
                    </div>

                    {/* Description */}
                    <div
                        style={{
                            color: colors.fg.dim,
                            fontSize: fonts.size.sm,
                            lineHeight: 1.5,
                            marginLeft: destructive ? `calc(32px + ${spacing[3]})` : 0,
                        }}
                    >
                        {description}
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            display: "flex",
                            gap: spacing[2],
                            justifyContent: "flex-end",
                            marginTop: spacing[6],
                        }}
                    >
                        <Button
                            variant="primary"
                            onClick={onClose}
                            disabled={isLoading}
                            noHover
                            style={{ backgroundColor: colors.bg.selected, border: "none", color: colors.fg.dim }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverFill(colors.bg.selected); e.currentTarget.style.color = colors.fg.base; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bg.selected; e.currentTarget.style.color = colors.fg.dim; }}
                        >
                            {cancelLabel}
                        </Button>
                        {requireHold ? (
                            <HoldButton onConfirm={onConfirm} disabled={isLoading} />
                        ) : (
                            <SubmitButton onClick={onConfirm} loading={isLoading} style={{ border: "none" }}>
                                {confirmLabel}
                            </SubmitButton>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
