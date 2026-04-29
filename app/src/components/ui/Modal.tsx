import React from "react";
import { spacing } from "@/styles/theme";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    opacity?: number;
    zIndex?: number;
    padding?: string | number;
    closeOnBackdrop?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    opacity = 0.7,
    zIndex = 1000,
    padding = spacing[4],
    closeOnBackdrop = true,
}: ModalProps) {
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
            }}
            onClick={closeOnBackdrop ? onClose : undefined}
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
                ...style,
            }}
        >
            {children}
        </div>
    );
}
