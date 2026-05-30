import { useState, useEffect, useRef } from "react";
import { RotateCcw, X } from "lucide-react";
import type { HistoricalFilters } from "@/api_client/endpoints";
import { colors } from "@/styles/colors";
import { spacing } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { filterContainerStyle, filterWrapperStyle, dropdownItemStyle, clearButtonStyle, chipTriggerStyle } from "@/styles/filters";
import { useClickOutside, useUserConfig } from "@/hooks";
import { DatePicker } from "@/components/ui/DatePicker";
import { DateDropdown } from "@/components/ui/DateDropdown";
import { Dropdown } from "@/components/ui/Dropdown";
import { getHistoricalDatePresets, formatShortDate } from "@/utils/date";
import { flexColumn, flexRow } from "@/styles/layout";

interface HistoricalFiltersProps {
    filters: HistoricalFilters;
    onChange: (filters: HistoricalFilters) => void;
    noMargin?: boolean;
}

export function HistoricalFiltersComponent({ filters, onChange, noMargin }: HistoricalFiltersProps) {
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
            <div style={{ ...filterContainerStyle, marginBottom: noMargin ? 0 : spacing[3] }} ref={dropdownRef}>
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
                                ...flexColumn,
                                gap: spacing[2],
                            }}
                        >
                            <DatePicker
                                value={dateFrom}
                                onChange={(value) => {
                                    setDateFrom(value);
                                    onChange({ ...filters, date_from: value || undefined, page: 1 });
                                }}
                                placeholder="Desde"
                                triggerStyle={chipTriggerStyle(!!dateFrom)}
                            />
                            <DatePicker
                                value={dateTo}
                                onChange={(value) => {
                                    setDateTo(value);
                                    onChange({ ...filters, date_to: value || undefined, page: 1 });
                                }}
                                placeholder="Hasta"
                                triggerStyle={chipTriggerStyle(!!dateTo)}
                            />
                        </div>
                        {(filters.date_from || filters.date_to) && (
                            <div
                                onClick={() => {
                                    setDateFrom("");
                                    setDateTo("");
                                    onChange({ ...filters, date_from: undefined, date_to: undefined, page: 1 });
                                    setOpenDropdown(null);
                                }}
                                style={{
                                    marginTop: spacing[1],
                                    ...flexRow,
                                    justifyContent: "center",
                                    gap: spacing[1],
                                    padding: 0,
                                    lineHeight: 1,
                                    cursor: "pointer",
                                    fontSize: fonts.size.xs,
                                    fontWeight: fonts.weight.regular,
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
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.fill;
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