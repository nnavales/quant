import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X, ArrowUp, ArrowDown, ArrowUpDown, Landmark, Clock, TrendingUp, Home } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatNumber } from "@/utils/format";
import { formatDateStr, getDateFormat } from "@/utils/date";
import { economic } from "@/api_client";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import {
    useDollarBanks,
    useFixedDeposits,
    useYieldAccounts,
    useLoans,
    useUserConfig,
} from "@/hooks";

type CompareTab = "dollar" | "tna" | "tea" | "uva";

/* ─── Table layout constants ─── */
const ROW_HEIGHT = 48;

interface ColumnDef {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    flex: string;
    tooltip?: string;
}

/* ─── Column definitions must stay in sync with cell renderers below ─── */

const DollarColumns: ColumnDef[] = [
    { key: "entity", label: "Entidad", flex: "2 1 0" },
    { key: "sell", label: "Venta", align: "center", flex: "1 1 0" },
    { key: "buy", label: "Compra", align: "center", flex: "1 1 0" },
    { key: "pct_variation", label: "Var", align: "right", flex: "1 1 0", tooltip: "Variación porcentual" },
];

const TnaColumns: ColumnDef[] = [
    { key: "entity", label: "Entidad", flex: "2 1 0" },
    { key: "tem", label: "TEM", align: "center", flex: "1 1 0", tooltip: "Tasa Efectiva Mensual" },
    { key: "tea", label: "TEA", align: "center", flex: "1 1 0", tooltip: "Tasa Efectiva Anual" },
    { key: "tna", label: "TNA", align: "center", flex: "1 1 0", tooltip: "Tasa Nominal Anual" },
    { key: "term", label: "Días", align: "right", flex: "1 1 0" },
];

const TeaColumns: ColumnDef[] = [
    { key: "entity", label: "Entidad", flex: "2 1 0" },
    { key: "tea", label: "TEA", align: "center", flex: "1 1 0", tooltip: "Tasa Efectiva Anual" },
    { key: "tna", label: "TNA", align: "center", flex: "1 1 0", tooltip: "Tasa Nominal Anual" },
    { key: "tem", label: "TEM", align: "center", flex: "1 1 0", tooltip: "Tasa Efectiva Mensual" },
    { key: "daily", label: "Diario", align: "center", flex: "1 1 0" },
    { key: "limit", label: "Límite", align: "right", flex: "1 1 0" },
];

const UvaColumns: ColumnDef[] = [
    { key: "entity", label: "Entidad", flex: "2 1 0" },
    { key: "tna", label: "TNA", align: "right", flex: "1 1 0", tooltip: "Tasa Nominal Anual" },
];

const tabs: { key: CompareTab; label: string; icon: React.ReactNode }[] = [
    { key: "dollar", label: "Dólar Banco", icon: <Landmark size={14} strokeWidth={1.5} /> },
    { key: "tna", label: "Plazo Fijo", icon: <Clock size={14} strokeWidth={1.5} /> },
    { key: "tea", label: "Cuentas Remuneradas", icon: <TrendingUp size={14} strokeWidth={1.5} /> },
    { key: "uva", label: "Crédito UVA", icon: <Home size={14} strokeWidth={1.5} /> },
];

const getColumns = (tab: CompareTab): ColumnDef[] => {
    switch (tab) {
        case "dollar": return DollarColumns;
        case "tna": return TnaColumns;
        case "tea": return TeaColumns;
        case "uva": return UvaColumns;
    }
};

/* ─── Row cell renderers ─── */

function renderCell(item: any, col: ColumnDef, _tab: CompareTab) {
    switch (col.key) {
        case "entity": {
            const name = item.entity || item.name || "";
            return (
                <span className="selectable" style={{
                    fontSize: fonts.size.sm,
                    color: colors.fg.base,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}>
                    {name}
                </span>
            );
        }
        case "sell":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 500 }}>${formatNumber(item.sell)}</span>;
        case "buy":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 500 }}>${formatNumber(item.buy)}</span>;
        case "pct_variation": {
            const v = item.pct_variation;
            const isPos = v > 0;
            const isNeg = v < 0;
            return (
                <span className="selectable" style={{
                    fontFamily: fonts.family.display,
                    fontSize: fonts.size.sm,
                    color: isPos ? colors.accent.green : isNeg ? colors.accent.red : colors.fg.dim,
                    fontWeight: isPos || isNeg ? 500 : 400,
                }}>
                    {isPos ? "+" : ""}{formatNumber(v)}%
                </span>
            );
        }
        case "tem":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 500 }}>{formatNumber(item.tem)}%</span>;
        case "tea":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 500 }}>{formatNumber(item.tea)}%</span>;
        case "tna":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 500 }}>{formatNumber(item.tna)}%</span>;
        case "term":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.dim }}>{item.min_term}–{item.max_term}</span>;
        case "daily":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 500 }}>{item.daily_rate?.toFixed(3)}%</span>;
        case "limit":
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.dim }}>{item.limit ? `$${formatNumber(item.limit)}` : "–"}</span>;
        default:
            return <span className="selectable" style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.dim }}>–</span>;
    }
}

/* ─── Sort keys per tab ─── */

const getSortableKeys = (tab: CompareTab): string[] => {
    switch (tab) {
        case "dollar": return ["entity", "sell", "buy", "pct_variation"];
        case "tna": return ["entity", "tem", "tea", "tna"];
        case "tea": return ["entity", "tea", "tna", "tem", "daily_rate", "limit"];
        case "uva": return ["name", "tna"];
    }
};

/* ─── Component ─── */

interface EconomicComparativesProps {
    onRefresh?: () => void;
}

export function EconomicComparatives({ onRefresh }: EconomicComparativesProps) {
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<CompareTab>("dollar");
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
    const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [tabPill, setTabPill] = useState({ left: 0, width: 0 });

    const measureTabs = useCallback(() => {
        const idx = tabs.findIndex(t => t.key === activeTab);
        const el = tabRefs.current[idx];
        if (el?.parentElement) {
            setTabPill({ left: el.offsetLeft, width: el.offsetWidth });
        }
    }, [activeTab]);

    useEffect(() => { measureTabs(); }, [measureTabs]);

    const { data: dollarData, isLoading: dollarLoading, isError: dollarError } = useDollarBanks("sell");
    const { data: tnaData, isLoading: tnaLoading, isError: tnaError } = useFixedDeposits();
    const { data: teaData, isLoading: teaLoading, isError: teaError } = useYieldAccounts();
    const { data: uvaData, isLoading: uvaLoading, isError: uvaError } = useLoans();

    const isLoading = dollarLoading || tnaLoading || teaLoading || uvaLoading;
    const isError = dollarError || tnaError || teaError || uvaError;

    const handleRefresh = async () => {
        onRefresh?.();
        try {
            const [d, t, te, u] = await Promise.all([
                economic.getDollarBanks("sell", true),
                economic.getFixedDeposits(true),
                economic.getYieldAccounts(true),
                economic.getLoans(true),
            ]);
            queryClient.setQueryData(["economic", "dollar-banks", "sell"], d);
            queryClient.setQueryData(["economic", "fixed-deposits"], t);
            queryClient.setQueryData(["economic", "yield-accounts"], te);
            queryClient.setQueryData(["economic", "loans"], u);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    const getRawData = (tab: CompareTab) => {
        switch (tab) {
            case "dollar": return Object.values(dollarData || {});
            case "tna": return Object.values(tnaData || {});
            case "tea": return Object.values(teaData || {}).filter((ya: any) => ya.tea > 0);
            case "uva": return Object.values(uvaData || {});
        }
    };

    const handleSort = (key: string) => {
        if (sortColumn === key) {
            if (sortDir === "desc") { setSortDir("asc"); }
            else if (sortDir === "asc") { setSortColumn(null); setSortDir(null); }
            else { setSortDir("desc"); }
        } else { setSortColumn(key); setSortDir("desc"); }
    };

    const raw = getRawData(activeTab);
    const s = search.toLowerCase();
    const filtered = s ? raw.filter((item: any) => item.entity?.toLowerCase().includes(s) || item.name?.toLowerCase().includes(s)) : raw;
    const sorted = !sortColumn || !sortDir ? filtered : [...filtered].sort((a: any, b: any) => {
        const aVal = a[sortColumn] ?? "";
        const bVal = b[sortColumn] ?? "";
        const cmp = typeof aVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
    });

    const sortableKeys = getSortableKeys(activeTab);
    const columns = getColumns(activeTab);
    const latestUpdate = sorted[0]?.updated_at;

    return (
        <div
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            {/* ── Title row ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${spacing[3]} ${spacing[4]} 0` }}>
                <span style={{
                    fontSize: fonts.size.sm,
                    color: colors.fg.base,
                    textTransform: "uppercase",
                    fontWeight: 500,
                    letterSpacing: "0.5px",
                }}>
                    Comparativas
                </span>
                <button
                    onClick={handleRefresh}
                    title="Actualizar"
                    style={{
                        background: "none",
                        border: "none",
                        color: colors.fg.dim,
                        cursor: "pointer",
                        padding: spacing[1],
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = colors.fg.base; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = colors.fg.dim; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                </button>
            </div>

            {/* ── Tabs + search row ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${spacing[2]} ${spacing[4]}`, overflow: "hidden" }}>
                <div style={{
                    position: "relative",
                    display: "flex",
                    borderRadius: "8px",
                    background: colors.fill,
                    overflow: "hidden",
                    cursor: "pointer",
                    userSelect: "none",
                }}>
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: tabPill.left,
                        width: tabPill.width,
                        height: "100%",
                        borderRadius: "7px",
                        background: colors.bg.surface,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
                        transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        pointerEvents: "none",
                    }} />
                    {tabs.map((tab, i) => (
                        <div
                            key={tab.key}
                            ref={(el) => { tabRefs.current[i] = el; }}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setSortColumn(null);
                                setSortDir(null);
                                setSearch("");
                            }}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: `${spacing[1]} ${spacing[3]}`,
                                whiteSpace: "nowrap",
                                fontSize: fonts.size.sm,
                                fontWeight: 500,
                                color: activeTab === tab.key ? colors.fg.base : colors.fg.dim,
                                cursor: "pointer",
                                transition: "color 0.2s",
                                lineHeight: "18px",
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </div>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[1],
                        backgroundColor: colors.fill,
                        borderRadius: "8px",
                        padding: `0 ${spacing[2]}`,
                        height: "26px",
                        width: "140px",
                        boxSizing: "border-box",
                    }}>
                        <Search size={14} strokeWidth={1.5} color={colors.fg.dim} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            style={{
                                background: "none",
                                border: "none",
                                outline: "none",
                                color: colors.fg.base,
                                fontFamily: fonts.family.text,
                                fontSize: fonts.size.sm,
                                width: "100px",
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: colors.fg.dim,
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    lineHeight: 1,
                                }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: "1px", backgroundColor: colors.border, flexShrink: 0 }} />

            {/* ── Table ── */}
            {isLoading ? (
                <div style={{ padding: spacing[8], textAlign: "center", color: colors.fg.dim }}>
                    Cargando...
                </div>
            ) : isError ? (
                <div style={{ padding: spacing[8], textAlign: "center", color: colors.accent.red }}>
                    Error al cargar datos
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        padding: `${spacing[2]} ${spacing[3]}`,
                        borderBottom: `1px solid ${colors.border}`,
                        backgroundColor: colors.fill,
                    }}>
                        {columns.map((col, idx) => {
                            const sortableKey = sortableKeys[idx];
                            const isSorted = sortColumn === sortableKey;
                            return (
                                <div
                                    key={col.key}
                                    onClick={() => sortableKey && handleSort(sortableKey)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        flex: col.flex,
                                        justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                                        cursor: sortableKey ? "pointer" : "default",
                                        userSelect: "none",
                                        minWidth: 0,
                                    }}
                                >
                                    {col.tooltip ? (
                                        <Tooltip content={col.tooltip} alwaysShow>
                                            <span style={{
                                                fontSize: fonts.table.header,
                                                fontWeight: 500,
                                                color: isSorted ? colors.fg.base : colors.fg.dim,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "3px",
                                            }}>
                                                {col.label}
                                                {sortableKey && (
                                                    <span style={{ display: "inline-flex", opacity: isSorted ? 1 : 0.4 }}>
                                                        {isSorted ? (
                                                            sortDir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                                                        ) : (
                                                            <ArrowUpDown size={12} />
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <span style={{
                                            fontSize: fonts.table.header,
                                            fontWeight: 500,
                                            color: isSorted ? colors.fg.base : colors.fg.dim,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "3px",
                                        }}>
                                            {col.label}
                                            {sortableKey && (
                                                <span style={{ display: "inline-flex", opacity: isSorted ? 1 : 0.4 }}>
                                                    {isSorted ? (
                                                        sortDir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                                                    ) : (
                                                        <ArrowUpDown size={12} />
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Rows */}
                    <div style={{ maxHeight: 432, overflowY: "auto" }}>
                        {sorted.length === 0 && (
                            <div style={{ padding: spacing[8], textAlign: "center", color: colors.fg.dim, fontSize: fonts.size.sm }}>
                                <div style={{ fontSize: fonts.size.lg, marginBottom: spacing[1], opacity: 0.5 }}>—</div>
                                Sin resultados
                            </div>
                        )}
                        {sorted.map((item, i) => {
                            return (
                            <div
                                key={(item as any).slug || (item as any).name || i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: `0 ${spacing[3]}`,
                                        borderBottom: `1px solid ${colors.fill}`,
                                        borderLeft: "2px solid transparent",
                                        transition: "background-color 0.12s, border-color 0.12s",
                                        cursor: "default",
                                        height: ROW_HEIGHT,
                                        boxSizing: "border-box",
                                    }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                                    e.currentTarget.style.borderLeftColor = colors.accent.cyan;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "";
                                    e.currentTarget.style.borderLeftColor = "transparent";
                                }}
                            >
                                {columns.map((col) => (
                                    <div
                                        key={col.key}
                                        style={{
                                            flex: col.flex,
                                            textAlign: col.align || "left",
                                            minWidth: 0,
                                        }}
                                    >
                                        {renderCell(item, col, activeTab)}
                                    </div>
                                ))}
                            </div>
                        )})}
                    </div>

                </div>
            )}

            {/* ── Footer row: update time + result count ── */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${spacing[2]} ${spacing[4]} ${spacing[3]}`,
            }}>
                {latestUpdate && (
                    <div style={{
                        fontSize: fonts.size.xs,
                        color: colors.fg.dim,
                        opacity: 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                    }}>
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: colors.accent.green, display: "inline-block" }} />
                        Actualizado: {formatDateStr(latestUpdate, userDateFormat)}
                    </div>
                )}
                {sorted.length > 0 && (
                    <div style={{
                        fontSize: fonts.size.xs,
                        color: colors.fg.dim,
                        opacity: 0.5,
                        marginLeft: "auto",
                    }}>
                        {sorted.length} resultado{sorted.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>
        </div>
    );
}
