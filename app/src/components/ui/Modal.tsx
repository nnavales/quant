import React, { useEffect } from "react";
import { X } from "lucide-react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    opacity?: number;
    zIndex?: number;
    padding?: string | number;
}

export function Modal({
    isOpen,
    onClose,
    children,
    opacity = 0.7,
    zIndex = 1000,
    padding = spacing[4],
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: `rgba(0, 0, 0, ${opacity})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex,
                padding,
                animation: "fadeIn 0.15s ease-out",
            }}
        >
            {children}
        </div>
    );
}

export function ModalContent({
    children,
    onClick,
    style,
}: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                position: "relative",
                animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export function ModalCloseButton({
    onClick,
    size = 15,
    style,
}: {
    onClick: () => void;
    size?: number;
    style?: React.CSSProperties;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: radius.md,
                border: "none",
                backgroundColor: "transparent",
                color: colors.fg.dim,
                cursor: "pointer",
                transition: "all 0.12s ease",
                flexShrink: 0,
                ...style,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; e.currentTarget.style.color = colors.fg.base; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.fg.dim; }}
        >
            <X size={size} />
        </button>
    );
}
