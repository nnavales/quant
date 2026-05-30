import React, { useState, useRef, useCallback, useEffect } from "react";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    alwaysShow?: boolean;
    style?: React.CSSProperties;
    as?: "span" | "div";
}

const tooltipBaseStyle: React.CSSProperties = {
    position: "fixed",
    backgroundColor: colors.bg.elevated,
    border: `2px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
    color: colors.fg.base,
    lineHeight: 1.6,
    zIndex: 9999,
    wordBreak: "break-word",
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.12s",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
};

export function Tooltip({ content, children, alwaysShow = false, style, as: Tag = "span" }: TooltipProps) {
    // `mounted` controls whether the popup is in the DOM; `show` drives the opacity
    // transition. The popup is only mounted while hovered (or briefly fading out), so it
    // doesn't add idle DOM nodes for every row — important on Tauri's WebKitGTK WebView.
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const positionTooltip = useCallback(() => {
        const tooltip = tooltipRef.current;
        const trigger = triggerRef.current;
        if (!tooltip || !trigger) return;

        const pad = 16;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const gap = 8;

        let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        let top = triggerRect.bottom + gap;

        if (left < pad) left = pad;
        if (left + tooltipRect.width > vw - pad) left = vw - tooltipRect.width - pad;
        if (top + tooltipRect.height > vh - pad) top = triggerRect.top - tooltipRect.height - gap;
        if (top < pad) top = pad;

        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
    }, []);

    useEffect(() => () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }, []);

    const reveal = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        setMounted(true);
        // Mount at opacity 0, position it, then flip opacity on a later frame so the
        // CSS opacity transition actually fires (it can't transition from the first paint).
        requestAnimationFrame(() => {
            positionTooltip();
            requestAnimationFrame(() => setShow(true));
        });
    }, [positionTooltip]);

    const handleMouseEnter = () => {
        if (alwaysShow) {
            reveal();
            return;
        }
        const el = textRef.current;
        if (el && el.scrollWidth > el.clientWidth) {
            reveal();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (alwaysShow) return;
        const tooltip = tooltipRef.current;
        if (!tooltip) return;

        const pad = 16;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = tooltip.getBoundingClientRect();

        let left = e.clientX + 12;
        let top = e.clientY + 12;

        if (left + rect.width > vw - pad) left = e.clientX - rect.width - 8;
        if (left < pad) left = pad;
        if (top + rect.height > vh - pad) top = e.clientY - rect.height - 8;
        if (top < pad) top = pad;

        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
    };

    const handleMouseLeave = () => {
        setShow(false);
        // Keep the popup mounted through the fade-out, then unmount it.
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setMounted(false);
            hideTimerRef.current = null;
        }, 150);
    };

    return (
        <Tag
            ref={triggerRef as React.RefObject<HTMLDivElement & HTMLSpanElement>}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ color: colors.fg.base, ...style }}
        >
            {React.isValidElement(children)
                ? React.cloneElement<{ ref?: React.Ref<HTMLElement> }>(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, { ref: textRef })
                : <span ref={textRef}>{children}</span>}
            {content && mounted && (
                <div
                    ref={tooltipRef}
                    style={{
                        ...tooltipBaseStyle,
                        maxWidth: Math.min(260, window.innerWidth - 32),
                        opacity: show ? 1 : 0,
                    }}
                >
                    {content}
                </div>
            )}
        </Tag>
    );
}
