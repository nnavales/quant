import { useState, useEffect, useRef } from "react";
import { Filter, ChevronDown, RotateCcw } from "lucide-react";
import type { HistoricalFilters } from "@/api_client/endpoints";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { DatePicker } from "@/components/ui/DatePicker";

const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
};

const getDatePresets = (): { label: string; from: string; to: string }[] => {
    const today = new Date();
    const startOfThisYear = new Date(today.getFullYear(), 0, 1);
    const endOfThisYear = new Date(today.getFullYear(), 11, 31);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return [
        { label: "Este año", from: formatDate(startOfThisYear), to: formatDate(endOfThisYear) },
        { label: "Hasta este mes", from: "", to: formatDate(endOfMonth) },
        { label: "Año anterior", from: formatDate(new Date(today.getFullYear() - 1, 0, 1)), to: formatDate(new Date(today.getFullYear() - 1, 11, 31)) },
    ];
};

interface HistoricalFiltersProps {
    filters: HistoricalFilters;
    onChange: (filters: HistoricalFilters) => void;
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
}

const filterContainerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[4],
    alignItems: "center",
};

const filterWrapperStyle: React.CSSProperties = {
    position: "relative",
};

const filterButtonStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: active ? colors.highlight.medium : "transparent",
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    color: active ? colors.fg.default : colors.fg.muted,
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
    transition: "all 0.15s",
});

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: spacing[1],
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    padding: spacing[2],
    minWidth: "250px",
    zIndex: 50,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};

const dropdownItemStyle: React.CSSProperties = {
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: radius.sm,
    fontSize: "var(--font-size-sm)",
    color: colors.fg.default,
};

const clearButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: `1px solid ${colors.semantic.error}`,
    borderRadius: radius.md,
    color: colors.semantic.error,
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
};

const paginationButtonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: `${spacing[1]} ${spacing[2]}`,
    backgroundColor: "transparent",
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.sm,
    color: disabled ? colors.fg.muted : colors.fg.default,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
});

export function HistoricalFiltersComponent({ filters, onChange, total, page, limit, onPageChange }: HistoricalFiltersProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [goToPage, setGoToPage] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hasActiveFilters = !!filters.date_from || !!filters.date_to;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[1], marginBottom: spacing[1] }}>
                <Filter size={12} style={{ color: colors.fg.muted }} />
                <span style={{ fontSize: "11px", fontWeight: 500, color: colors.fg.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Filtros</span>
            </div>
            <div style={filterContainerStyle} ref={dropdownRef}>
                {/* Date range dropdown */}
                <div style={filterWrapperStyle}>
                    <button style={filterButtonStyle(!!filters.date_from || !!filters.date_to)} onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}>
                        {filters.date_from && filters.date_to
                            ? `${filters.date_from} - ${filters.date_to}`
                            : filters.date_from
                            ? `Desde ${filters.date_from}`
                            : filters.date_to
                            ? `Hasta ${filters.date_to}`
                            : "Fecha"}
                        <ChevronDown size={14} />
                    </button>
                    {openDropdown === "date" && (
                        <div style={dropdownStyle}>
                            <div
                                style={{ ...dropdownItemStyle, backgroundColor: !filters.date_from && !filters.date_to ? colors.highlight.low : "transparent" }}
                                onClick={() => {
                                    setDateFrom("");
                                    setDateTo("");
                                    onChange({ ...filters, date_from: undefined, date_to: undefined, page: 1 });
                                    setOpenDropdown(null);
                                }}
                            >
                                Todas las fechas
                            </div>
                            {getDatePresets().map((preset) => (
                                <div
                                    key={preset.label}
                                    style={{ ...dropdownItemStyle, backgroundColor: "transparent" }}
                                    onClick={() => {
                                        setDateFrom(preset.from);
                                        setDateTo(preset.to);
                                        onChange({ ...filters, date_from: preset.from, date_to: preset.to, page: 1 });
                                        setOpenDropdown(null);
                                    }}
                                >
                                    {preset.label}
                                </div>
                            ))}
                            <div style={{ marginTop: spacing[1], borderTop: `1px solid ${colors.highlight.medium}`, paddingTop: spacing[1] }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                                    <DatePicker
                                        value={dateFrom}
                                        onChange={(value) => {
                                            setDateFrom(value);
                                            onChange({ ...filters, date_from: value || undefined, page: 1 });
                                        }}
                                        placeholder="Desde"
                                    />
                                    <DatePicker
                                        value={dateTo}
                                        onChange={(value) => {
                                            setDateTo(value);
                                            onChange({ ...filters, date_to: value || undefined, page: 1 });
                                        }}
                                        placeholder="Hasta"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {hasActiveFilters && (
                    <button style={clearButtonStyle} onClick={clearAllFilters}>
                        <RotateCcw size={12} />
                        Limpiar
                    </button>
                )}

                <div style={{ flex: 1 }} />

                <div style={{ display: "flex", alignItems: "center", gap: spacing[2], color: colors.fg.muted, fontSize: "0.875rem" }}>
                    <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={paginationButtonStyle(page <= 1)}>
                        Anterior
                    </button>
                    <span>{page} / {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={paginationButtonStyle(page >= totalPages)}>
                        Siguiente
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
                            width: "50px",
                            marginLeft: spacing[2],
                            padding: `${spacing[1]} ${spacing[1]}`,
                            backgroundColor: "transparent",
                            border: `1px solid ${colors.highlight.medium}`,
                            borderRadius: radius.sm,
                            color: colors.fg.default,
                            fontSize: "0.75rem",
                            textAlign: "center",
                            outline: "none",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}