import { useLayoutEffect, RefObject } from "react";

interface UseDropdownPositionOptions {
    margin?: number;
    maxHeight?: number;
    minWidth?: number;
    matchTriggerWidth?: boolean | "fixed";
}

export function useDropdownPosition(
    triggerRef: RefObject<HTMLElement | null>,
    panelRef: RefObject<HTMLElement | null>,
    isOpen: boolean,
    options: UseDropdownPositionOptions = {}
) {
    const { margin = 8, maxHeight, minWidth = 0, matchTriggerWidth } = options;

    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current || !panelRef.current) return;

        const trigger = triggerRef.current;
        const panel = panelRef.current;

        const update = () => {
            const rect = trigger.getBoundingClientRect();

            // Temporarily position for measurement
            panel.style.visibility = "hidden";
            panel.style.position = "fixed";
            panel.style.top = "0px";
            panel.style.left = "0px";
            if (maxHeight) {
                panel.style.maxHeight = `${maxHeight}px`;
            }
            if (matchTriggerWidth === "fixed") {
                const w = Math.max(Math.round(rect.width), minWidth);
                panel.style.width = `${w}px`;
                panel.style.minWidth = "";
            } else if (matchTriggerWidth) {
                const maxW = panel.style.maxWidth;
                const maxNum = maxW && /^\d/.test(maxW) ? parseFloat(maxW) : Infinity;
                const w = Math.max(minWidth, Math.min(Math.round(rect.width), maxNum));
                panel.style.minWidth = `${w}px`;
                panel.style.width = "";
            }

            const ddHeight = panel.offsetHeight;
            const ddWidth = panel.offsetWidth;

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const placeBottom = spaceBelow >= ddHeight || spaceBelow > spaceAbove;

            let top = placeBottom ? rect.bottom + margin : rect.top - ddHeight - margin;
            top = Math.max(margin, Math.min(top, window.innerHeight - ddHeight - margin));

            let left = rect.left;
            left = Math.max(margin, Math.min(left, window.innerWidth - ddWidth - margin));

            panel.style.top = `${Math.round(top)}px`;
            panel.style.left = `${Math.round(left)}px`;
            panel.style.visibility = "visible";
        };

        // Allow browser to finish layout before measuring
        const raf = requestAnimationFrame(update);

        const handleScroll = (e: Event) => {
            if (panel.contains(e.target as Node)) return;
            update();
        };
        const handleResize = () => update();

        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => update());
            ro.observe(panel);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
            if (ro) ro.disconnect();
        };
    }, [isOpen, triggerRef, panelRef, margin, maxHeight]);
}
