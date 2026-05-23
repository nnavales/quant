import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { useClickOutside, useDropdownPosition } from "@/hooks";

let instanceCounter = 0;

export interface DropdownOption {
    id: string;
    label: string;
    disabled?: boolean;
    dotColor?: string;
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
    panelMaxHeight?: number;
    panelStyle?: React.CSSProperties;
    fixPanelWidth?: boolean;
}

const PANEL_BASE: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    backgroundColor: colors.bg.surface,
    border: "none",
    borderRadius: radius.md,
    padding: spacing[2],
    zIndex: 1001,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: "160px",
    maxWidth: "280px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
};

const ITEM_BASE: React.CSSProperties = {
    padding: `${spacing[1]} ${spacing[2]}`,
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: fonts.size.sm,
    color: colors.fg.base,
    transition: "background-color 0.1s",
    userSelect: "none",
    marginRight: spacing[1],
};

export function Dropdown({
    value,
    onChange,
    options,
    groups,
    placeholder = "Seleccionar...",
    searchable = false,
    clearable = false,
    triggerStyle,
    disabled = false,
    panelMaxHeight = 320,
    panelStyle,
    fixPanelWidth,
}: DropdownProps) {
    const instanceId = useRef(++instanceCounter);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const matchMode = fixPanelWidth ? "fixed" : true;
    useDropdownPosition(triggerRef, panelRef, isOpen, { maxHeight: panelMaxHeight, matchTriggerWidth: matchMode, minWidth: 160 });

    const resolvedGroups = useMemo<DropdownGroup[]>(() => {
        if (groups) return groups;
        if (options) return [{ label: "", items: options }];
        return [];
    }, [groups, options]);

    const selectedOption = useMemo(() => {
        if (clearable && value === "") return null;
        for (const group of resolvedGroups) {
            const item = group.items.find((i) => i.id === value);
            if (item) return item;
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

    const closePanel = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) {
            setSearch("");
            window.dispatchEvent(
                new CustomEvent("dropdown-opened", {
                    detail: { instanceId: instanceId.current },
                })
            );
        }
        setIsOpen((prev) => !prev);
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
                    color: selectedOption ? colors.fg.base : colors.fg.dim,
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: fonts.size.sm,
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none",
                    ...triggerStyle,
                }}

            >
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: selectedOption ? 500 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                    }}
                >
                    {selectedOption?.dotColor && (
                        <span
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: selectedOption.dotColor,
                                flexShrink: 0,
                            }}
                        />
                    )}
                    {selectedOption?.label || placeholder}
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

            {isOpen && (
                <div
                    ref={panelRef}
                    data-dropdown-panel
                    style={{
                        ...PANEL_BASE,
                        ...panelStyle,
                        visibility: "hidden",
                        maxHeight: `${panelMaxHeight}px`,
                    }}
                >
                    {searchable && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing[1],
                                padding: `0 ${spacing[2]}`,
                                backgroundColor: colors.fill,
                                borderRadius: "8px",
                                height: "26px",
                                flexShrink: 0,
                                boxSizing: "border-box",
                                marginBottom: spacing[1],
                            }}
                        >
                            <Search size={14} strokeWidth={1.5} color={colors.fg.dim} style={{ flexShrink: 0 }} />
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
                                    fontFamily: fonts.family.text,
                                    fontSize: fonts.size.sm,
                                    padding: 0,
                                    minWidth: 0,
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
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        lineHeight: 1,
                                        flexShrink: 0,
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
                            gap: spacing[1],
                            overflowY: "auto",
                            overflowX: "hidden",
                            flex: 1,
                            minHeight: 0,
                            scrollbarGutter: "stable",
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

                        {filteredGroups.map((group, groupIdx) => (
                            <div key={group.label || `__g${groupIdx}`} style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
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
                                            display: "flex",
                                            alignItems: "center",
    gap: spacing[1],
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
                                        {item.dotColor && (
                                            <span
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    backgroundColor: item.dotColor,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    {clearable && value !== "" && (
                        <div
                            onClick={() => handleSelect("")}
                            style={{
                                marginTop: spacing[1],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: spacing[1],
                                padding: 0,
                                lineHeight: 1,
                                cursor: "pointer",
                                fontSize: fonts.size.xs,
                                fontWeight: 400,
                                color: colors.fg.dim,
                                transition: "color 0.15s",
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = colors.fg.base;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = colors.fg.dim;
                            }}
                        >
                            <X size={11} />
                            Limpiar
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
