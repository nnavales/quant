import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import type { HistoricalFilters } from "@/api_client/endpoints";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { filterContainerStyle, filterWrapperStyle, dropdownItemStyle, clearButtonStyle, paginationButtonStyle, chipTriggerStyle } from "@/styles/filters";
import { useClickOutside } from "@/hooks";
import { DatePicker } from "@/components/ui/DatePicker";
import { DateDropdown } from "@/components/ui/DateDropdown";
import { Dropdown } from "@/components/ui/Dropdown";
import { getHistoricalDatePresets, formatShortDate } from "@/utils/date";

interface HistoricalFiltersProps {
    filters: HistoricalFilters;
    onChange: (filters: HistoricalFilters) => void;
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
}

export function HistoricalFiltersComponent({ filters, onChange, total, page, limit, onPageChange }: HistoricalFiltersProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [goToPage, setGoToPage] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hasActiveFilters = !!filters.date_from || !!filters.date_to || !!filters.source;

    useClickOutside(dropdownRef, () => setOpenDropdown(null));

    useEffect(() => {
        if (openDropdown) {
            window.dispatchEvent(
                new CustomEvent("dropdown-opened", { detail: { instanceId: -1 } })
            );
        }
    }, [openDropdown]);

    useEffect(() => {
        const handleDropdownOpened = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            if (detail?.instanceId === -1) return;
            setOpenDropdown(null);
        };
        window.addEventListener("dropdown-opened", handleDropdownOpened);
        return () => window.removeEventListener("dropdown-opened", handleDropdownOpened);
    }, []);

    useEffect(() => {
        setDateFrom(filters.date_from || "");
        setDateTo(filters.date_to || "");
    }, [filters.date_from, filters.date_to]);

    const totalPages = Math.ceil(total / limit) || 1;

    const clearAllFilters = () => {
        setDateFrom("");
        setDateTo("");
        onChange({ page: 1, limit });
    };

    const sourceOptions: { id: "historical" | "transactions"; label: string }[] = [
        { id: "historical", label: "Histórico" },
        { id: "transactions", label: "Transacciones" },
    ];

    return (
        <div>
            <div style={filterContainerStyle} ref={dropdownRef}>
                {/* Date range dropdown */}
                <div style={filterWrapperStyle}>
                    <DateDropdown
                        label={
                            filters.date_from && filters.date_to
                                ? `${formatShortDate(filters.date_from)} - ${formatShortDate(filters.date_to)}`
                                : filters.date_from
                                ? `Desde ${formatShortDate(filters.date_from)}`
                                : filters.date_to
                                ? `Hasta ${formatShortDate(filters.date_to)}`
                                : null
                        }
                        placeholder="Fecha"
                        open={openDropdown === "date"}
                        onToggle={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
                        triggerStyle={chipTriggerStyle(!!filters.date_from || !!filters.date_to)}
                    >
                        <div
                            style={{
                                ...dropdownItemStyle,
                                backgroundColor: !filters.date_from && !filters.date_to ? colors.fill : "transparent",
                                fontWeight: !filters.date_from && !filters.date_to ? 500 : 400,
                                color: colors.fg.dim,
                            }}
                            onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                                onChange({ ...filters, date_from: undefined, date_to: undefined, page: 1 });
                                setOpenDropdown(null);
                            }}
                            onMouseEnter={(e) => {
                                if (filters.date_from || filters.date_to) {
                                    e.currentTarget.style.backgroundColor = colors.fill;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (filters.date_from || filters.date_to) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }}
                        >
                            Todas las fechas
                        </div>
                        {getHistoricalDatePresets().map((preset) => (
                            <div
                                key={preset.label}
                                style={{ ...dropdownItemStyle, backgroundColor: "transparent" }}
                                onClick={() => {
                                    setDateFrom(preset.from);
                                    setDateTo(preset.to);
                                    onChange({ ...filters, date_from: preset.from, date_to: preset.to, page: 1 });
                                    setOpenDropdown(null);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.fill;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                {preset.label}
                            </div>
                        ))}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: spacing[2],
                                paddingTop: spacing[1],
                                borderTop: `1px solid ${colors.fill}`,
                            }}
                        >
                            <DatePicker
                                value={dateFrom}
                                onChange={(value) => {
                                    setDateFrom(value);
                                    onChange({ ...filters, date_from: value || undefined, page: 1 });
                                }}
                                placeholder="Desde"
                                triggerStyle={{ height: "28px" }}
                            />
                            <DatePicker
                                value={dateTo}
                                onChange={(value) => {
                                    setDateTo(value);
                                    onChange({ ...filters, date_to: value || undefined, page: 1 });
                                }}
                                placeholder="Hasta"
                                triggerStyle={{ height: "28px" }}
                            />
                        </div>
                    </DateDropdown>
                </div>

                {/* Source dropdown */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={sourceOptions}
                        value={filters.source ?? ""}
                        onChange={(id) =>
                            onChange({ ...filters, source: (id as "historical" | "transactions") || undefined, page: 1 })
                        }
                        placeholder="Origen"
                        clearable
                        clearLabel="Todos los origenes"
                        triggerStyle={chipTriggerStyle(!!filters.source)}
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        style={clearButtonStyle}
                        onClick={clearAllFilters}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${colors.accent.red}15`;
                            e.currentTarget.style.borderColor = `${colors.accent.red}40`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.borderColor = colors.border;
                        }}
                        title="Limpiar filtros"
                    >
                        <RotateCcw size={14} />
                    </button>
                )}

                <div style={{ flex: 1 }} />

                <div style={{ display: "flex", alignItems: "center", gap: spacing[2], color: colors.fg.dim, fontSize: "12px", flexShrink: 0 }}>
                    <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ ...paginationButtonStyle(page <= 1), border: `1px solid ${page <= 1 ? colors.overlay.white06 : colors.border}` }}>
                        ‹
                    </button>
                    <span style={{ color: colors.fg.dim, fontSize: "12px" }}>
                        {page} / {totalPages}
                    </span>
                    <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={{ ...paginationButtonStyle(page >= totalPages), border: `1px solid ${page >= totalPages ? colors.overlay.white06 : colors.border}` }}>
                        ›
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={goToPage}
                        onChange={(e) => setGoToPage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const newPage = parseInt(goToPage, 10);
                                if (newPage >= 1 && newPage <= totalPages) {
                                    onPageChange(newPage);
                                    setGoToPage("");
                                }
                            }
                        }}
                        placeholder="ir a..."
                        style={{
                            width: "52px",
                            height: "28px",
                            marginLeft: spacing[1],
                            padding: "0 6px",
                            backgroundColor: "transparent",
                            border: `1px solid ${colors.overlay.white08}`,
                            borderRadius: radius.md,
                            color: colors.fg.base,
                            fontSize: "12px",
                            textAlign: "center",
                            outline: "none",
                            transition: "border-color 0.15s",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}