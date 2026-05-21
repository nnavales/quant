import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import type { HistoricalFilters } from "@/api_client/endpoints";
import { colors } from "@/styles/colors";
import { spacing } from "@/styles/theme";
import { filterContainerStyle, filterWrapperStyle, dropdownItemStyle, clearButtonStyle, chipTriggerStyle } from "@/styles/filters";
import { useClickOutside, useUserConfig } from "@/hooks";
import { DatePicker } from "@/components/ui/DatePicker";
import { DateDropdown } from "@/components/ui/DateDropdown";
import { Dropdown } from "@/components/ui/Dropdown";
import { getHistoricalDatePresets, formatShortDate } from "@/utils/date";

interface HistoricalFiltersProps {
    filters: HistoricalFilters;
    onChange: (filters: HistoricalFilters) => void;
}

export function HistoricalFiltersComponent({ filters, onChange }: HistoricalFiltersProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: userConfig } = useUserConfig();

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

    const clearAllFilters = () => {
        setDateFrom("");
        setDateTo("");
        onChange({});
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
                        {getHistoricalDatePresets(userConfig?.timezone).map((preset) => (
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
            </div>
        </div>
    );
}