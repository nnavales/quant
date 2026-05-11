import React, { useState, useRef, useCallback } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    alwaysShow?: boolean;
}

const tooltipBaseStyle: React.CSSProperties = {
    position: "fixed",
    backgroundColor: colors.bg.header,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: fonts.size.xs,
    color: colors.fg.base,
    lineHeight: 1.5,
    zIndex: 9999,
    wordBreak: "break-word",
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.15s",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
};

export function Tooltip({ content, children, alwaysShow = false }: TooltipProps) {
    const [show, setShow] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLElement>(null);

    const positionTooltip = useCallback(() => {
        const tooltip = tooltipRef.current;
        const trigger = triggerRef.current;
        if (!tooltip || !trigger) return;

        const pad = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left: number;
        let top: number;

        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const gap = 8;

        // Center horizontally
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

        // Default: place below trigger
        top = triggerRect.bottom + gap;

        // Clamp to viewport edges
        if (left < pad) left = pad;
        if (left + tooltipRect.width > vw - pad) {
            left = vw - tooltipRect.width - pad;
        }

        // Flip above if not enough space below
        if (top + tooltipRect.height > vh - pad) {
            top = triggerRect.top - tooltipRect.height - gap;
        }

        // Safety: if still off-screen above, clamp to top
        if (top < pad) {
            top = pad;
        }

        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
        tooltip.style.opacity = "1";
    }, [alwaysShow]);

    const handleMouseEnter = () => {
        if (alwaysShow) {
            setShow(true);
            requestAnimationFrame(() => positionTooltip());
            return;
        }

        if (textRef.current) {
            const el = textRef.current;
            if (el.scrollWidth > el.clientWidth) {
                setShow(true);
                requestAnimationFrame(() => positionTooltip());
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (alwaysShow) return;

        const tooltip = tooltipRef.current;
        if (!tooltip) return;

        const pad = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = tooltip.getBoundingClientRect();

        let left = e.clientX + 12;
        let top = e.clientY + 12;

        if (left + rect.width > vw - pad) {
            left = e.clientX - rect.width - 8;
        }
        if (left < pad) left = pad;
        if (top + rect.height > vh - pad) {
            top = e.clientY - rect.height - 8;
        }
        if (top < pad) top = pad;

        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
    };

    const handleMouseLeave = () => {
        setShow(false);
        const tooltip = tooltipRef.current;
        if (tooltip) {
            tooltip.style.opacity = "0";
        }
    };

    return (
        <span
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ color: colors.fg.base }}
        >
            {React.isValidElement(children)
                ? React.cloneElement<{ ref?: React.Ref<HTMLElement> }>(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, { ref: textRef })
                : <span ref={textRef}>{children}</span>}
            {content && (
                <div
                    ref={tooltipRef}
                    style={{
                        ...tooltipBaseStyle,
                        maxWidth: Math.min(260, window.innerWidth - 24),
                        minWidth: alwaysShow ? 180 : undefined,
                        opacity: show ? 1 : 0,
                    }}
                >
                    {content}
                </div>
            )}
        </span>
    );
}
