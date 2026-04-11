import { useState, useEffect, useRef } from "react";
import { Filter, ChevronDown, RotateCcw, X } from "lucide-react";
import type { TransactionFilters } from "@/api_client";
import { colors } from "@/styles/colors";
import { spacing, radius, shadows } from "@/styles/theme";
import { useCategories, useSubcategories, useChannels, useAccounts } from "@/hooks";
import { DatePicker } from "@/components/ui/DatePicker";

interface TransactionFiltersProps {
    filters: TransactionFilters;
    onChange: (filters: TransactionFilters) => void;
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
    maxHeight: "400px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    zIndex: 50,
    boxShadow: shadows.lg,
};

const dropdownItemStyle: React.CSSProperties = {
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: radius.sm,
    fontSize: "var(--font-size-sm)",
    color: colors.fg.default,
    whiteSpace: "normal",
    wordBreak: "break-word",
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

const inputStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: colors.bg.dim,
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    color: colors.fg.default,
    fontSize: "var(--font-size-sm)",
    outline: "none",
    width: "120px",
};

const inputWrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
};

const clearInputStyle: React.CSSProperties = {
    position: "absolute",
    right: "6px",
    background: "none",
    border: "none",
    color: colors.fg.muted,
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
};

const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
};

const getDatePresets = (): { label: string; from: string; to: string }[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    return [
        { label: "Hoy", from: formatDate(today), to: formatDate(today) },
        { label: "Ayer", from: formatDate(new Date(today.getTime() - 86400000)), to: formatDate(new Date(today.getTime() - 86400000)) },
        { label: "Esta semana", from: formatDate(startOfWeek), to: formatDate(endOfWeek) },
        { label: "Semana pasada", from: formatDate(new Date(startOfWeek.getTime() - 7 * 86400000)), to: formatDate(new Date(endOfWeek.getTime() - 7 * 86400000)) },
        { label: "Este mes", from: formatDate(startOfMonth), to: formatDate(endOfMonth) },
        { label: "Mes pasado", from: formatDate(lastMonthStart), to: formatDate(lastMonthEnd) },
        { label: "Últimos 30 días", from: formatDate(last30Days), to: formatDate(today) },
        { label: "Este año", from: formatDate(new Date(today.getFullYear(), 0, 1)), to: formatDate(today) },
    ];
};

export function TransactionFilters({ filters, onChange, total, page, limit, onPageChange }: TransactionFiltersProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const [searchText, setSearchText] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [goToPage, setGoToPage] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const toggleDropdown = (name: string) => {
        setOpenDropdown((prev) => (prev === name ? null : name));
    };

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
        setSearchText("");
        setDateFrom("");
        setDateTo("");
        onChange({ page: 1, limit: 20 });
    };

    const handleSearch = () => {
        onChange({ ...filters, search: searchText || undefined, page: 1 });
    };

    const hasActiveFilters = Object.keys(filters).some(
        (k) => k !== "page" && k !== "limit" && filters[k as keyof TransactionFilters]
    );

    const hasValue = (key: keyof TransactionFilters) => !!filters[key];

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[1], marginBottom: spacing[1] }}>
                <Filter size={12} style={{ color: colors.fg.muted }} />
                <span style={{ fontSize: "11px", fontWeight: 500, color: colors.fg.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Filtros</span>
            </div>
            <div style={filterContainerStyle} ref={dropdownRef}>
            {/* Search */}
            <div style={inputWrapperStyle}>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={inputStyle}
                />
                {searchText && (
                    <button
                        style={clearInputStyle}
                        onClick={() => { setSearchText(""); onChange({ ...filters, search: undefined, page: 1 }); }}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Date range dropdown */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(!!filters.date_from || !!filters.date_to)} onClick={() => toggleDropdown("date")}>
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
                    <div style={{ ...dropdownStyle, minWidth: "200px", padding: spacing[2] }}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.date_from && !filters.date_to ? colors.highlight.low : "transparent" }} onClick={() => { setDateFrom(""); setDateTo(""); onChange({ ...filters, date_from: undefined, date_to: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas las fechas
                        </div>
                        <div style={{ marginTop: spacing[1], borderTop: `1px solid ${colors.highlight.medium}`, paddingTop: spacing[1] }}>
                            {getDatePresets().map((preset) => (
                                <div
                                    key={preset.label}
                                    style={{ ...dropdownItemStyle, backgroundColor: "transparent" }}
                                    onClick={() => { setDateFrom(preset.from); setDateTo(preset.to); onChange({ ...filters, date_from: preset.from, date_to: preset.to, page: 1 }); setOpenDropdown(null); }}
                                >
                                    {preset.label}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: spacing[1], borderTop: `1px solid ${colors.highlight.medium}`, paddingTop: spacing[1] }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                                <DatePicker
                                    value={dateFrom}
                                    onChange={(value) => { setDateFrom(value); onChange({ ...filters, date_from: value || undefined, page: 1 }); }}
                                    placeholder="Desde"
                                />
                                <DatePicker
                                    value={dateTo}
                                    onChange={(value) => { setDateTo(value); onChange({ ...filters, date_to: value || undefined, page: 1 }); }}
                                    placeholder="Hasta"
                                />
                            </div>
                        </div>
                        <div
                            style={{ ...dropdownItemStyle, marginTop: spacing[2], textAlign: "center", color: colors.fg.muted }}
                            onClick={(e) => { e.stopPropagation(); setDateFrom(""); setDateTo(""); onChange({ ...filters, date_from: undefined, date_to: undefined, page: 1 }); }}
                        >
                            Limpiar fechas
                        </div>
                    </div>
                )}
            </div>

            {/* Type */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("type"))} onClick={() => toggleDropdown("type")}>
                    Tipo
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "type" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.type ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, type: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todos
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.type === "expense" ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, type: "expense", page: 1 }); setOpenDropdown(null); }}>
                            Egreso
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.type === "income" ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, type: "income", page: 1 }); setOpenDropdown(null); }}>
                            Ingreso
                        </div>
                    </div>
                )}
            </div>

            {/* Currency */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("currency"))} onClick={() => toggleDropdown("currency")}>
                    Moneda
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "currency" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.currency ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, currency: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.currency === "ARS" ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, currency: "ARS", page: 1 }); setOpenDropdown(null); }}>
                            ARS
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.currency === "USD" ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, currency: "USD", page: 1 }); setOpenDropdown(null); }}>
                            USD
                        </div>
                    </div>
                )}
            </div>

            {/* Frequency */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("frequency"))} onClick={() => toggleDropdown("frequency")}>
                    Frecuencia
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "frequency" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.frequency ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, frequency: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.frequency === "fixed" ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, frequency: "fixed", page: 1 }); setOpenDropdown(null); }}>
                            Fija
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.frequency === "variable" ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, frequency: "variable", page: 1 }); setOpenDropdown(null); }}>
                            Variable
                        </div>
                    </div>
                )}
            </div>

            {/* Installments */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("installments"))} onClick={() => toggleDropdown("installments")}>
                    Cuotas
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "installments" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.installments === undefined ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, installments: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.installments === true ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, installments: true, page: 1 }); setOpenDropdown(null); }}>
                            Con cuotas
                        </div>
                        <div style={{ ...dropdownItemStyle, backgroundColor: filters.installments === false ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, installments: false, page: 1 }); setOpenDropdown(null); }}>
                            Sin cuotas
                        </div>
                    </div>
                )}
            </div>

            {/* Category */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("category"))} onClick={() => toggleDropdown("category")}>
                    Categoría
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "category" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.category ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, category: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas
                        </div>
                        {categoriesList.map((cat) => (
                            <div key={cat.id} style={{ ...dropdownItemStyle, backgroundColor: filters.category === cat.id ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, category: cat.id, page: 1 }); setOpenDropdown(null); }}>
                                {cat.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Subcategory */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("subcategory"))} onClick={() => toggleDropdown("subcategory")}>
                    Subcategoría
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "subcategory" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.subcategory ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, subcategory: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas
                        </div>
                        {subcategoriesList.map((sub) => (
                            <div key={sub.id} style={{ ...dropdownItemStyle, backgroundColor: filters.subcategory === sub.id ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, subcategory: sub.id, page: 1 }); setOpenDropdown(null); }}>
                                {sub.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Channel */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("channel"))} onClick={() => toggleDropdown("channel")}>
                    Canal
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "channel" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.channel ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, channel: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todos
                        </div>
                        {channelsList.map((ch) => (
                            <div key={ch.id} style={{ ...dropdownItemStyle, backgroundColor: filters.channel === ch.id ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, channel: ch.id, page: 1 }); setOpenDropdown(null); }}>
                                {ch.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Account */}
            <div style={filterWrapperStyle}>
                <button style={filterButtonStyle(hasValue("account"))} onClick={() => toggleDropdown("account")}>
                    Cuenta
                    <ChevronDown size={14} />
                </button>
                {openDropdown === "account" && (
                    <div style={dropdownStyle}>
                        <div style={{ ...dropdownItemStyle, backgroundColor: !filters.account ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, account: undefined, page: 1 }); setOpenDropdown(null); }}>
                            Todas
                        </div>
                        {accountsList.map((acc) => (
                            <div key={acc.id} style={{ ...dropdownItemStyle, backgroundColor: filters.account === acc.id ? colors.highlight.low : "transparent" }} onClick={() => { onChange({ ...filters, account: acc.id, page: 1 }); setOpenDropdown(null); }}>
                                {acc.name}
                            </div>
                        ))}
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
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    style={{
                        padding: `${spacing[1]} ${spacing[2]}`,
                        backgroundColor: "transparent",
                        border: `1px solid ${colors.highlight.medium}`,
                        borderRadius: radius.sm,
                        color: page <= 1 ? colors.fg.muted : colors.fg.default,
                        cursor: page <= 1 ? "not-allowed" : "pointer",
                        opacity: page <= 1 ? 0.5 : 1,
                    }}
                >
                    Anterior
                </button>
                <span>
                    {page} / {totalPages}
                </span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    style={{
                        padding: `${spacing[1]} ${spacing[2]}`,
                        backgroundColor: "transparent",
                        border: `1px solid ${colors.highlight.medium}`,
                        borderRadius: radius.sm,
                        color: page >= totalPages ? colors.fg.muted : colors.fg.default,
                        cursor: page >= totalPages ? "not-allowed" : "pointer",
                        opacity: page >= totalPages ? 0.5 : 1,
                    }}
                >
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
