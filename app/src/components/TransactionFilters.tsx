import { useState, useEffect, useRef } from "react";
import { RotateCcw, X } from "lucide-react";
import type { TransactionFilters } from "@/api_client";
import { colors } from "@/styles/colors";
import { spacing } from "@/styles/theme";
import { filterContainerStyle, dropdownItemStyle, clearButtonStyle, chipTriggerStyle } from "@/styles/filters";
import { useCategories, useSubcategories, useChannels, useAccounts, useClickOutside, useUserConfig, useCategoryGroups, useAccountGroups } from "@/hooks";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown } from "@/components/ui/Dropdown";
import { DateDropdown } from "@/components/ui/DateDropdown";

interface TransactionFiltersProps {
    filters: TransactionFilters;
    onChange: (filters: TransactionFilters) => void;
}

const filterWrapperStyle: React.CSSProperties = {
    position: "relative",
    maxWidth: "160px",
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
    color: colors.fg.dim,
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
};

import { getTransactionDatePresets, formatShortDate } from "@/utils/date";

export function TransactionFilters({
    filters,
    onChange,
}: TransactionFiltersProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const [searchText, setSearchText] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();
    const { data: userConfig } = useUserConfig();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    const { groups: categoryGroups } = useCategoryGroups(categoriesList, subcategoriesList);
    const { groups: accountGroups } = useAccountGroups(channelsList, accountsList);

    const toggleDropdown = (name: string) => {
        setOpenDropdown((prev) => (prev === name ? null : name));
    };

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
        setSearchText("");
        setDateFrom("");
        setDateTo("");
        onChange({ limit: filters.limit, sort: filters.sort, order: filters.order });
    };

    const handleSearch = () => {
        onChange({ ...filters, search: searchText || undefined });
    };

    const hasActiveFilters = Object.keys(filters).some(
        (k) => k !== "limit" && k !== "sort" && k !== "order" && filters[k as keyof TransactionFilters] !== undefined
    );

    return (
        <div>
            <div style={filterContainerStyle} ref={dropdownRef}>
                {/* Search */}
                <div style={inputWrapperStyle}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        style={{
                            ...chipTriggerStyle(!!filters.search),
                            width: "120px",
                            outline: "none",
                        }}
                    />
                    {searchText && (
                        <button
                            style={clearInputStyle}
                            onClick={() => {
                                setSearchText("");
                                onChange({ ...filters, search: undefined });
                            }}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

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
                        onToggle={() => toggleDropdown("date")}
                        triggerStyle={chipTriggerStyle(!!filters.date_from || !!filters.date_to)}
                    >
                        <div
                            style={{
                                ...dropdownItemStyle,
                                backgroundColor:
                                    !filters.date_from && !filters.date_to
                                        ? colors.fill
                                        : "transparent",
                                fontWeight: !filters.date_from && !filters.date_to ? 500 : 400,
                                color: colors.fg.dim,
                            }}
                            onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                                onChange({
                                    ...filters,
                                    date_from: undefined,
                                    date_to: undefined,

                                });
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
                        {getTransactionDatePresets(userConfig?.timezone).map((preset) => (
                            <div
                                key={preset.label}
                                style={{
                                    ...dropdownItemStyle,
                                    backgroundColor: "transparent",
                                }}
                                onClick={() => {
                                    setDateFrom(preset.from);
                                    setDateTo(preset.to);
                                    onChange({
                                        ...filters,
                                        date_from: preset.from,
                                        date_to: preset.to,
    
                                    });
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
                                    onChange({
                                        ...filters,
                                        date_from: value || undefined,
    
                                    });
                                }}
                                placeholder="Desde"
                                triggerStyle={{ height: "28px" }}
                            />
                            <DatePicker
                                value={dateTo}
                                onChange={(value) => {
                                    setDateTo(value);
                                    onChange({
                                        ...filters,
                                        date_to: value || undefined,
    
                                    });
                                }}
                                placeholder="Hasta"
                                triggerStyle={{ height: "28px" }}
                            />
                        </div>
                    </DateDropdown>
                </div>

                {/* Type */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={[
                            { id: "expense", label: "Egreso" },
                            { id: "income", label: "Ingreso" },
                        ]}
                        value={filters.type ?? ""}
                        onChange={(id) =>
                            onChange({
                                ...filters,
                                type: (id as "expense" | "income") || undefined,
                                page: 1,
                            })
                        }
                        placeholder="Tipo"
                        clearable
                        clearLabel="Todas"
                        triggerStyle={chipTriggerStyle(!!filters.type)}
                    />
                </div>

                {/* Currency */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={[
                            { id: "ARS", label: "ARS" },
                            { id: "USD", label: "USD" },
                        ]}
                        value={filters.currency ?? ""}
                        onChange={(id) =>
                            onChange({
                                ...filters,
                                currency: (id as "ARS" | "USD") || undefined,
                                page: 1,
                            })
                        }
                        placeholder="Moneda"
                        clearable
                        triggerStyle={chipTriggerStyle(!!filters.currency)}
                    />
                </div>

                {/* Frequency */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={[
                            { id: "fixed", label: "Fija" },
                            { id: "variable", label: "Variable" },
                        ]}
                        value={filters.frequency ?? ""}
                        onChange={(id) =>
                            onChange({
                                ...filters,
                                frequency: (id as "fixed" | "variable") || undefined,
                                page: 1,
                            })
                        }
                        placeholder="Frecuencia"
                        clearable
                        triggerStyle={chipTriggerStyle(!!filters.frequency)}
                    />
                </div>

                {/* Installments */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={[
                            { id: "true", label: "Con cuotas" },
                            { id: "false", label: "Sin cuotas" },
                        ]}
                        value={
                            filters.installments === undefined ? "" : String(filters.installments)
                        }
                        onChange={(id) =>
                            onChange({
                                ...filters,
                                installments: id === "" ? undefined : id === "true",
                                page: 1,
                            })
                        }
                        placeholder="Cuotas"
                        clearable
                        triggerStyle={chipTriggerStyle(filters.installments !== undefined)}
                    />
                </div>

                {/* Is Paid */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={[
                            { id: "true", label: "Cumplidos" },
                            { id: "false", label: "Pendientes" },
                        ]}
                        value={
                            filters.is_paid === undefined ? "" : String(filters.is_paid)
                        }
                        onChange={(id) =>
                            onChange({
                                ...filters,
                                is_paid: id === "" ? undefined : id === "true",
                                page: 1,
                            })
                        }
                        placeholder="Estado"
                        clearable
                        triggerStyle={chipTriggerStyle(filters.is_paid !== undefined)}
                    />
                </div>

                {/* Category */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={categoriesList.map((c) => ({ id: c.id, label: c.name }))}
                        value={filters.category ?? ""}
                        onChange={(id) =>
                            onChange({ ...filters, category: id || undefined })
                        }
                        placeholder="Categoría"
                        searchable
                        clearable
                        triggerStyle={chipTriggerStyle(!!filters.category)}
                    />
                </div>

                {/* Subcategory */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        groups={categoryGroups}
                        value={filters.subcategory ?? ""}
                        onChange={(id) =>
                            onChange({ ...filters, subcategory: id || undefined })
                        }
                        placeholder="Subcategoría"
                        searchable
                        clearable
                        clearLabel="Todas"
                        triggerStyle={chipTriggerStyle(!!filters.subcategory)}
                    />
                </div>

                {/* Channel */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        options={channelsList.map((c) => ({ id: c.id, label: c.name }))}
                        value={filters.channel ?? ""}
                        onChange={(id) =>
                            onChange({ ...filters, channel: id || undefined })
                        }
                        placeholder="Canal"
                        searchable
                        clearable
                        clearLabel="Todas"
                        triggerStyle={chipTriggerStyle(!!filters.channel)}
                    />
                </div>

                {/* Account */}
                <div style={filterWrapperStyle}>
                    <Dropdown
                        groups={accountGroups}
                        value={filters.account ?? ""}
                        onChange={(id) =>
                            onChange({ ...filters, account: id || undefined })
                        }
                        placeholder="Cuenta"
                        searchable
                        clearable
                        clearLabel="Todas"
                        triggerStyle={chipTriggerStyle(!!filters.account)}
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${colors.accent.red}15`;
                            e.currentTarget.style.borderColor = `${colors.accent.red}40`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.borderColor = colors.border;
                        }}
                        style={clearButtonStyle}
                        title="Limpiar filtros"
                    >
                        <RotateCcw size={14} />
                    </button>
                )}

                <div style={{ flex: 1 }} />
            </div>
        </div>
    );
}
