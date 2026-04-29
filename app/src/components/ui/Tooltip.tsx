import React, { useState, useRef, useEffect } from "react";
import { spacing, radius, shadows } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    alwaysShow?: boolean;
}

export function Tooltip({ content, children, alwaysShow = false }: TooltipProps) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const checkedRef = useRef(false);
    const textRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const adjustPosition = (x: number, y: number) => {
        const tooltipEl = tooltipRef.current;
        if (!tooltipEl) {
            setPos({ x, y });
            return;
        }
        const rect = tooltipEl.getBoundingClientRect();
        const pad = 8;
        let nx = x;
        let ny = y;
        if (nx + rect.width > window.innerWidth - pad) {
            nx = window.innerWidth - rect.width - pad;
        }
        if (nx < pad) nx = pad;
        if (ny + rect.height > window.innerHeight - pad) {
            ny = y - rect.height - 12;
        }
        if (ny < pad) ny = pad;
        setPos({ x: nx, y: ny });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        adjustPosition(e.clientX + 10, e.clientY + 10);
    };

    const handleMouseEnter = () => {
        if (alwaysShow) {
            setShow(true);
            return;
        }
        if (!checkedRef.current && textRef.current) {
            const el = textRef.current;
            checkedRef.current = el.scrollWidth > el.clientWidth;
        }
        if (checkedRef.current) {
            setShow(true);
        }
    };

    useEffect(() => {
        if (show && tooltipRef.current) {
            adjustPosition(pos.x, pos.y);
        }
    }, [show]);

    return (
        <span
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShow(false)}
            onMouseMove={handleMouseMove}
            style={{ color: colors.fg.base }}
        >
            {React.isValidElement(children)
                ? React.cloneElement(
                      children as React.ReactElement<{ ref?: React.Ref<HTMLSpanElement> }>,
                      { ref: textRef }
                  )
                : children}
            {show && content && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: "fixed",
                        left: pos.x,
                        top: pos.y,
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.fill}`,
                        borderRadius: radius.md,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        fontSize: fonts.size.xs,
                        color: colors.fg.base,
                        boxShadow: shadows.base,
                        zIndex: 1000,
                        maxWidth: 300,
                        wordBreak: "break-word",
                        pointerEvents: "none",
                    }}
                >
                    {content}
                </div>
            )}
        </span>
    );
}
