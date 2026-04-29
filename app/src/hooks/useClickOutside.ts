import { useEffect, RefObject } from "react";

interface UseClickOutsideOptions {
    escapeKey?: boolean;
    excludeSelector?: string;
}

export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    handler: () => void,
    options: UseClickOutsideOptions = {}
) {
    const { escapeKey = false, excludeSelector } = options;

    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (ref.current && ref.current.contains(target)) return;
            if (excludeSelector && target.closest(excludeSelector)) return;

            handler();
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") handler();
        };

        document.addEventListener("mousedown", handleMouseDown);
        if (escapeKey) document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            if (escapeKey) document.removeEventListener("keydown", handleEscape);
        };
    }, [ref, handler, escapeKey, excludeSelector]);
}
