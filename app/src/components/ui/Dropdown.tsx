import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius, shadows } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { useClickOutside } from "@/hooks";

let instanceCounter = 0;

export interface DropdownOption {
    id: string;
    label: string;
    disabled?: boolean;
}

export interface DropdownGroup {
    label: string;
    items: DropdownOption[];
}

export interface DropdownProps {
    value: string;
    onChange: (id: string) => void;
    options?: DropdownOption[];
    groups?: DropdownGroup[];
    placeholder?: string;
    searchable?: boolean;
    clearable?: boolean;
    clearLabel?: string;
    triggerStyle?: React.CSSProperties;
    disabled?: boolean;
    panelWidth?: number | string;
    panelMaxHeight?: number;
}

const PANEL_BASE: React.CSSProperties = {
    position: "fixed",
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    padding: spacing[2],
    zIndex: 1001,
    boxShadow: shadows.lg,
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    overflow: "hidden",
};

const ITEM_BASE: React.CSSProperties = {
    padding: `${spacing[1]} ${spacing[2]}`,
    cursor: "pointer",
    borderRadius: radius.sm,
    fontSize: fonts.size.sm,
    color: colors.fg.base,
    transition: "background-color 0.1s",
    userSelect: "none",
};

export function Dropdown({
    value,
    onChange,
    options,
    groups,
    placeholder = "Seleccionar...",
    searchable = false,
    clearable = false,
    clearLabel = "Todas",
    triggerStyle,
    disabled = false,
    panelWidth = 260,
    panelMaxHeight = 320,
}: DropdownProps) {
    const instanceId = useRef(++instanceCounter);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const resolvedGroups = useMemo<DropdownGroup[]>(() => {
        if (groups) return groups;
        if (options) return [{ label: "", items: options }];
        return [];
    }, [groups, options]);

    const selectedLabel = useMemo(() => {
        if (clearable && value === "") return null;
        for (const group of resolvedGroups) {
            const item = group.items.find((i) => i.id === value);
            if (item) return item.label;
        }
        return null;
    }, [resolvedGroups, value, clearable]);

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return resolvedGroups;
        const s = search.toLowerCase();
        return resolvedGroups
            .map((group) => ({
                ...group,
                items: group.items.filter(
                    (item) =>
                        item.label.toLowerCase().includes(s) ||
                        (group.label && group.label.toLowerCase().includes(s))
                ),
            }))
            .filter((group) => group.items.length > 0);
    }, [resolvedGroups, search]);

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current) return null;
        const rect = triggerRef.current.getBoundingClientRect();
        const panelH = Math.min(panelMaxHeight, 400);
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow >= panelH + 8 ? rect.bottom + 4 : rect.top - panelH - 4;
        return { top, left: rect.left };
    }, [panelMaxHeight]);

    const openPanel = useCallback(() => {
        const pos = calculatePosition();
        if (pos) {
            setPosition(pos);
            setIsOpen(true);
            setSearch("");
            window.dispatchEvent(
                new CustomEvent("dropdown-opened", {
                    detail: { instanceId: instanceId.current },
                })
            );
        }
    }, [calculatePosition]);

    const closePanel = useCallback(() => {
        setIsOpen(false);
        setPosition(null);
    }, []);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    };

    const handleSelect = (id: string) => {
        onChange(id);
        closePanel();
    };

    useClickOutside(triggerRef, closePanel, {
        escapeKey: true,
        excludeSelector: "[data-dropdown-panel]",
    });

    useEffect(() => {
        const handleOtherOpened = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            if (detail?.instanceId !== instanceId.current) {
                closePanel();
            }
        };
        window.addEventListener("dropdown-opened", handleOtherOpened);
        return () => window.removeEventListener("dropdown-opened", handleOtherOpened);
    }, [closePanel]);

    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const pos = calculatePosition();
            if (pos) setPosition(pos);
        }
    }, [isOpen, calculatePosition]);

    const hasResults = filteredGroups.some((g) => g.items.length > 0);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onMouseDown={handleToggle}
                disabled={disabled}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing[2],
                    padding: `0 ${spacing[2]}`,
                    height: "40px",
                    backgroundColor: colors.bg.base,
                    border: `1px solid ${colors.fill}`,
                    borderRadius: radius.md,
                    color: selectedLabel ? colors.fg.base : colors.fg.dim,
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: fonts.size.sm,
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border-color 0.15s",
                    ...triggerStyle,
                }}
                onMouseEnter={(e) => {
                    if (!disabled) e.currentTarget.style.borderColor = colors.fill;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.fill;
                }}
            >
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: selectedLabel ? 500 : 400,
                    }}
                >
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown
                    size={14}
                    style={{
                        flexShrink: 0,
                        opacity: 0.6,
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                />
            </button>

            {isOpen && position && (
                <div
                    ref={panelRef}
                    data-dropdown-panel
                    style={{
                        ...PANEL_BASE,
                        top: position.top,
                        left: position.left,
                        width: typeof panelWidth === "number" ? `${panelWidth}px` : panelWidth,
                        maxHeight: `${panelMaxHeight}px`,
                    }}
                >
                    {searchable && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing[2],
                                padding: `${spacing[1]} ${spacing[2]}`,
                                backgroundColor: colors.bg.surface,
                                borderRadius: radius.sm,
                                border: `1px solid ${colors.fill}`,
                                flexShrink: 0,
                            }}
                        >
                            <Search size={14} color={colors.fg.dim} />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                style={{
                                    flex: 1,
                                    background: "none",
                                    border: "none",
                                    outline: "none",
                                    color: colors.fg.base,
                                    fontSize: fonts.size.sm,
                                    padding: 0,
                                }}
                            />
                            {search && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearch("");
                                        searchRef.current?.focus();
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: colors.fg.dim,
                                        cursor: "pointer",
                                        fontSize: fonts.size.xs,
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1px",
                            overflowY: "auto",
                            overflowX: "hidden",
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        {!hasResults && (
                            <div
                                style={{
                                    padding: spacing[4],
                                    textAlign: "center",
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.sm,
                                }}
                            >
                                Sin resultados
                            </div>
                        )}

                        {clearable && hasResults && (
                            <div
                                onClick={() => handleSelect("")}
                                style={{
                                    ...ITEM_BASE,
                                    backgroundColor: value === "" ? colors.fill : "transparent",
                                    fontWeight: value === "" ? 500 : 400,
                                    color: colors.fg.dim,
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== "") {
                                        e.currentTarget.style.backgroundColor = colors.fill;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== "") {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }
                                }}
                            >
                                {clearLabel}
                            </div>
                        )}

                        {filteredGroups.map((group, groupIdx) => (
                            <div key={group.label || `__g${groupIdx}`}>
                                {group.label && (
                                    <div
                                        style={{
                                            ...ITEM_BASE,
                                            fontWeight: 600,
                                            color: colors.fg.dim,
                                            cursor: "default",
                                            fontSize: fonts.size.xs,
                                            paddingTop: spacing[2],
                                            paddingBottom: "2px",
                                            letterSpacing: "0.05em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {group.label}
                                    </div>
                                )}
                                {group.items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => !item.disabled && handleSelect(item.id)}
                                        style={{
                                            ...ITEM_BASE,
                                            backgroundColor:
                                                item.id === value
                                                    ? colors.fill
                                                    : "transparent",
                                            fontWeight: item.id === value ? 500 : 400,
                                            opacity: item.disabled ? 0.4 : 1,
                                            cursor: item.disabled ? "not-allowed" : "pointer",
                                            paddingLeft: group.label ? "16px" : spacing[2],
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!item.disabled && item.id !== value) {
                                                e.currentTarget.style.backgroundColor = colors.fill;
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!item.disabled && item.id !== value) {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
