import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { colors } from "@/styles/colors";
import { radius, spacing, shadows } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import {
    useInflation,
    useDollarHistoric,
    useDollarBanks,
    useCountryRisk,
    useFixedDeposits,
    useYieldAccounts,
    useLoans,
    useCrypto,
} from "@/hooks";
import { economic } from "@/api_client";
import type { TimeSeriesPoint } from "@/api_client/types";

const CHART_COLOR = colors.accent.cyan;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const formatPercent = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    return dateStr;
};

const formatDateTimeFull = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const lastUpdatedStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.muted,
    opacity: 0.7,
    marginTop: "auto",
    paddingTop: spacing[4],
    alignSelf: "flex-start",
};

const cardStyle: React.CSSProperties = {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    border: `1px solid ${colors.highlight.medium}`,
    boxShadow: shadows.base,
    display: "flex",
    flexDirection: "column",
    minHeight: 150,
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.muted,
    textTransform: "uppercase",
    fontWeight: 500,
    marginBottom: spacing[3],
    letterSpacing: "0.5px",
};

const valueStyle: React.CSSProperties = {
    fontSize: fonts.size["2xl"],
    fontWeight: 600,
    fontFamily: fonts.family.mono,
    color: colors.fg.default,
};

const deltaStyle = (positive?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: fonts.size.sm,
    color:
        positive === true
            ? colors.semantic.success
            : positive === false
              ? colors.semantic.error
              : colors.fg.muted,
    marginTop: spacing[2],
});

function Card({
    title,
    children,
    onRefresh,
}: {
    title: string;
    children: React.ReactNode;
    onRefresh?: () => void;
}) {
    return (
        <div style={cardStyle}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing[2],
                }}
            >
                <div style={sectionTitleStyle}>{title}</div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: spacing[1],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: radius.sm,
                            color: colors.fg.muted,
                        }}
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

function MiniChart({ points }: { points: TimeSeriesPoint[] }) {
    if (!points || points.length < 2) return null;

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 200;
    const height = 40;
    const padding = 4;

    const getX = (index: number) => padding + (index / (points.length - 1)) * (width - padding * 2);
    const getY = (value: number) =>
        height - padding - ((value - min) / range) * (height - padding * 2);

    let pathD = `M ${getX(0)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${getX(i)} ${getY(points[i].value)}`;
    }

    return (
        <svg width={width} height={height} style={{ marginTop: spacing[2] }}>
            <path
                d={pathD}
                fill="none"
                stroke={CHART_COLOR}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function InflationSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useInflation();

    const handleRefresh = async () => {
        onRefresh?.();
        const newData = await economic.getInflation(true);
        queryClient.setQueryData(["economic", "inflation"], newData);
    };

    if (isLoading)
        return (
            <Card title="Inflación Mensual" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Inflación Mensual" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Error</div>
            </Card>
        );

    const value = data.last?.value ?? 0;
    const delta = data.delta;
    const lastDate = data.last?.date;
    const monthLabel = lastDate
        ? (() => {
              const [year, month] = lastDate.split("-");
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              const formatted = date.toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
              });
              return formatted.charAt(0).toUpperCase() + formatted.slice(1);
          })()
        : null;

    return (
        <Card title="Inflación Mensual" onRefresh={handleRefresh}>
            <div style={valueStyle}>{formatPercent(value)}%</div>
            {delta && delta.pct !== 0 && (
                <div style={deltaStyle(delta.pct > 0)}>
                    {delta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {delta.pct > 0 ? "+" : ""}
                        {formatPercent(delta.pct)}%
                    </span>
                </div>
            )}
            {data.series?.points && <MiniChart points={data.series.points} />}
            {monthLabel && <div style={lastUpdatedStyle}>{monthLabel}</div>}
        </Card>
    );
}

function DollarSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data: sellRes, isLoading: sellLoading, isError: sellError } = useDollarHistoric("sell");
    const { data: buyRes, isLoading: buyLoading } = useDollarHistoric("buy");

    const [activeView, setActiveView] = useState<"buy" | "sell">("sell");

    const handleRefresh = async () => {
        onRefresh?.();
        const [sellData, buyData] = await Promise.all([
            economic.getDollarHistoric("sell", true),
            economic.getDollarHistoric("buy", true),
        ]);
        queryClient.setQueryData(["economic", "dollar-historic", "sell"], sellData);
        queryClient.setQueryData(["economic", "dollar-historic", "buy"], buyData);
    };

    const isLoading = sellLoading || buyLoading;
    const isError = sellError || !sellRes;

    if (isLoading)
        return (
            <Card title="Dólar" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Cargando...</div>
            </Card>
        );
    if (isError || !sellRes)
        return (
            <Card title="Dólar" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Error</div>
            </Card>
        );

    const sellValue = sellRes.last?.value ?? 0;
    const sellDelta = sellRes.delta;
    const buyValue = buyRes?.last?.value ?? 0;
    const buyDelta = buyRes?.delta;

    const activeData = activeView === "sell" ? sellRes : buyRes || null;
    const activeDelta = activeView === "sell" ? sellDelta : buyDelta;

    return (
        <Card title="Dólar Oficial (BNA)" onRefresh={handleRefresh}>
            <div style={{ display: "flex", gap: spacing[4] }}>
                <div
                    onClick={() => setActiveView("buy")}
                    style={{
                        cursor: "pointer",
                        opacity: activeView === "buy" ? 1 : 0.4,
                        transition: "opacity 0.15s",
                        flex: 1,
                    }}
                >
                    <div style={{ fontSize: fonts.size.xs, color: colors.fg.muted }}>COMPRA</div>
                    <div
                        style={{
                            fontFamily: fonts.family.mono,
                            fontSize: fonts.size.lg,
                            color: colors.fg.default,
                        }}
                    >
                        ${formatCurrency(buyValue)}
                    </div>
                </div>
                <div
                    onClick={() => setActiveView("sell")}
                    style={{
                        cursor: "pointer",
                        opacity: activeView === "sell" ? 1 : 0.4,
                        transition: "opacity 0.15s",
                        flex: 1,
                    }}
                >
                    <div style={{ fontSize: fonts.size.xs, color: colors.fg.muted }}>VENTA</div>
                    <div
                        style={{
                            fontFamily: fonts.family.mono,
                            fontSize: fonts.size.lg,
                            color: colors.fg.default,
                        }}
                    >
                        ${formatCurrency(sellValue)}
                    </div>
                </div>
            </div>
            {activeDelta && activeDelta.pct !== 0 && (
                <div style={deltaStyle(activeDelta.pct > 0)}>
                    {activeDelta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {activeDelta.pct > 0 ? "+" : ""}
                        {formatPercent(activeDelta.pct)}%
                    </span>
                </div>
            )}
            {activeData?.series?.points && <MiniChart points={activeData.series.points} />}
            {activeData?.last?.date && (
                <div style={lastUpdatedStyle}>Fecha: {formatDateTime(activeData.last.date)}</div>
            )}
        </Card>
    );
}

function CountryRiskSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useCountryRisk();

    const handleRefresh = async () => {
        onRefresh?.();
        const newData = await economic.getCountryRisk(true);
        queryClient.setQueryData(["economic", "country-risk"], newData);
    };

    if (isLoading)
        return (
            <Card title="Riesgo País" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Riesgo País" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Error</div>
            </Card>
        );

    const valueFontSize = { ...valueStyle, fontSize: fonts.size["4xl"] };

    return (
        <Card title="Riesgo País" onRefresh={handleRefresh}>
            <div style={valueFontSize}>{data.value}</div>
            {data.variation !== 0 && (
                <div style={deltaStyle(data.variation > 0)}>
                    {data.variation > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {data.variation > 0 ? "+" : ""}
                        {data.variation.toFixed(2)}%
                    </span>
                </div>
            )}
            {data.date && <div style={lastUpdatedStyle}>Fecha: {formatDateTime(data.date)}</div>}
        </Card>
    );
}

function UsdtSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useCrypto("usdt");

    const handleRefresh = async () => {
        onRefresh?.();
        const newData = await economic.getCrypto("usdt", true);
        queryClient.setQueryData(["economic", "crypto", "usdt"], newData);
    };

    if (isLoading)
        return (
            <Card title="Dólar Crypto (USDT)" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Dólar Crypto (USDT)" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Error</div>
            </Card>
        );

    const value = data.last?.value ?? 0;
    const delta = data.delta;

    return (
        <Card title="Dólar Crypto (USDT)" onRefresh={handleRefresh}>
            <div style={valueStyle}>${formatCurrency(value)}</div>
            {delta && delta.pct !== 0 && (
                <div style={deltaStyle(delta.pct > 0)}>
                    {delta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {delta.pct > 0 ? "+" : ""}
                        {formatPercent(delta.pct)}%
                    </span>
                </div>
            )}
            {data.series?.points && <MiniChart points={data.series.points} />}
            {data.last?.date && (
                <div style={lastUpdatedStyle}>Fecha: {formatDateTime(data.last.date)}</div>
            )}
        </Card>
    );
}

function BtcSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useCrypto("btc");

    const handleRefresh = async () => {
        onRefresh?.();
        const newData = await economic.getCrypto("btc", true);
        queryClient.setQueryData(["economic", "crypto", "btc"], newData);
    };

    if (isLoading)
        return (
            <Card title="Bitcoin (BTC/USDT)" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Bitcoin (BTC/USDT)" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Error</div>
            </Card>
        );

    const value = data.last?.value ?? 0;
    const delta = data.delta;

    return (
        <Card title="Bitcoin (BTC/USDT)" onRefresh={handleRefresh}>
            <div style={valueStyle}>${formatCurrency(value)}</div>
            {delta && delta.pct !== 0 && (
                <div style={deltaStyle(delta.pct > 0)}>
                    {delta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {delta.pct > 0 ? "+" : ""}
                        {formatPercent(delta.pct)}%
                    </span>
                </div>
            )}
            {data.series?.points && <MiniChart points={data.series.points} />}
            {data.last?.date && (
                <div style={lastUpdatedStyle}>Fecha: {formatDateTime(data.last.date)}</div>
            )}
        </Card>
    );
}

function EthSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useCrypto("eth");

    const handleRefresh = async () => {
        onRefresh?.();
        const newData = await economic.getCrypto("eth", true);
        queryClient.setQueryData(["economic", "crypto", "eth"], newData);
    };

    if (isLoading)
        return (
            <Card title="Ethereum (ETH/USDT)" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Ethereum (ETH/USDT)" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.muted }}>Error</div>
            </Card>
        );

    const value = data.last?.value ?? 0;
    const delta = data.delta;

    return (
        <Card title="Ethereum (ETH/USDT)" onRefresh={handleRefresh}>
            <div style={valueStyle}>${formatCurrency(value)}</div>
            {delta && delta.pct !== 0 && (
                <div style={deltaStyle(delta.pct > 0)}>
                    {delta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {delta.pct > 0 ? "+" : ""}
                        {formatPercent(delta.pct)}%
                    </span>
                </div>
            )}
            {data.series?.points && <MiniChart points={data.series.points} />}
            {data.last?.date && (
                <div style={lastUpdatedStyle}>Fecha: {formatDateTime(data.last.date)}</div>
            )}
        </Card>
    );
}

type CompareTab = "dollar" | "tna" | "tea" | "uva";

function ComparativesSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<CompareTab>("dollar");

    const {
        data: dollarData,
        isLoading: dollarLoading,
        isError: dollarError,
    } = useDollarBanks("sell");
    const { data: tnaData, isLoading: tnaLoading, isError: tnaError } = useFixedDeposits();
    const { data: teaData, isLoading: teaLoading, isError: teaError } = useYieldAccounts();
    const { data: uvaData, isLoading: uvaLoading, isError: uvaError } = useLoans();

    const handleRefresh = async () => {
        onRefresh?.();
        const [dollarData, tnaData, teaData, uvaData] = await Promise.all([
            economic.getDollarBanks("sell", true),
            economic.getFixedDeposits(true),
            economic.getYieldAccounts(true),
            economic.getLoans(true),
        ]);
        queryClient.setQueryData(["economic", "dollar-banks", "sell"], dollarData);
        queryClient.setQueryData(["economic", "fixed-deposits"], tnaData);
        queryClient.setQueryData(["economic", "yield-accounts"], teaData);
        queryClient.setQueryData(["economic", "loans"], uvaData);
    };

    const tabs: { key: CompareTab; label: string }[] = [
        { key: "dollar", label: "Dólar Banco" },
        { key: "tna", label: "Plazo Fijo" },
        { key: "tea", label: "Cuenta Remunerada" },
        { key: "uva", label: "Credito UVA" },
    ];

    const renderTabButton = (tab: (typeof tabs)[number]) => (
        <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
                cursor: "pointer",
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: radius.md,
                backgroundColor: activeTab === tab.key ? colors.highlight.medium : "transparent",
                fontSize: fonts.size.sm,
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? colors.fg.default : colors.fg.muted,
                transition: "all 0.15s",
            }}
        >
            {tab.label}
        </div>
    );

    const renderContent = () => {
        if (activeTab === "dollar") {
            if (dollarLoading) return <div style={{ color: colors.fg.muted }}>Cargando...</div>;
            if (dollarError || !dollarData)
                return <div style={{ color: colors.fg.muted }}>Error</div>;

            const entries = Object.values(dollarData);
            const latestUpdate = entries[0]?.updated_at;

            return (
                <>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                                fontSize: fonts.size.xs,
                                color: colors.fg.muted,
                                fontWeight: 500,
                                padding: `${spacing[2]} ${spacing[2]}`,
                                borderBottom: `1px solid ${colors.highlight.medium}`,
                                position: "sticky",
                                top: 0,
                                backgroundColor: colors.bg.surface,
                                zIndex: 1,
                            }}
                        >
                            <span>Banco</span>
                            <span>Compra</span>
                            <span>Venta</span>
                            <span>Variación</span>
                        </div>
                        {entries.map((bank) => (
                            <div
                                key={bank.slug || bank.entity}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                                    alignItems: "center",
                                    fontSize: fonts.size.sm,
                                    padding: `${spacing[2]} ${spacing[2]}`,
                                    borderBottom: `1px solid ${colors.highlight.low}`,
                                }}
                            >
                                <span style={{ color: colors.fg.default }}>{bank.entity}</span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.default }}>
                                    ${formatCurrency(bank.buy)}
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.default }}>
                                    ${formatCurrency(bank.sell)}
                                </span>
                                <span
                                    style={{
                                        fontFamily: fonts.family.mono,
                                        color:
                                            bank.pct_variation > 0
                                                ? colors.semantic.success
                                                : bank.pct_variation < 0
                                                  ? colors.semantic.error
                                                  : colors.fg.muted,
                                    }}
                                >
                                    {bank.pct_variation > 0 ? "+" : ""}
                                    {formatPercent(bank.pct_variation)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    {latestUpdate && (
                        <div style={lastUpdatedStyle}>
                            Actualizado: {formatDateTimeFull(latestUpdate)}
                        </div>
                    )}
                </>
            );
        }

        if (activeTab === "tna") {
            if (tnaLoading) return <div style={{ color: colors.fg.muted }}>Cargando...</div>;
            if (tnaError || !tnaData) return <div style={{ color: colors.fg.muted }}>Error</div>;

            const entries = Object.values(tnaData);
            const latestUpdate = entries[0]?.updated_at;

            return (
                <>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                                fontSize: fonts.size.xs,
                                color: colors.fg.muted,
                                fontWeight: 500,
                                padding: `${spacing[2]} ${spacing[2]}`,
                                borderBottom: `1px solid ${colors.highlight.medium}`,
                                position: "sticky",
                                top: 0,
                                backgroundColor: colors.bg.surface,
                                zIndex: 1,
                            }}
                        >
                            <span>Banco</span>
                            <span>TNA</span>
                            <span>TEA</span>
                            <span>TEM</span>
                            <span>Min días</span>
                            <span>Max días</span>
                        </div>
                        {entries.map((fd) => (
                            <div
                                key={fd.slug || fd.entity}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                                    alignItems: "center",
                                    fontSize: fonts.size.sm,
                                    padding: `${spacing[2]} ${spacing[2]}`,
                                    borderBottom: `1px solid ${colors.highlight.low}`,
                                }}
                            >
                                <span style={{ color: colors.fg.default }}>{fd.entity}</span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.accent.teal }}>
                                    {formatPercent(fd.tna)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.default }}>
                                    {formatPercent(fd.tea)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.muted }}>
                                    {formatPercent(fd.tem)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.muted }}>
                                    {fd.min_term}
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.muted }}>
                                    {fd.max_term}
                                </span>
                            </div>
                        ))}
                    </div>
                    {latestUpdate && (
                        <div style={lastUpdatedStyle}>
                            Actualizado: {formatDateTimeFull(latestUpdate)}
                        </div>
                    )}
                </>
            );
        }

        if (activeTab === "tea") {
            if (teaLoading) return <div style={{ color: colors.fg.muted }}>Cargando...</div>;
            if (teaError || !teaData) return <div style={{ color: colors.fg.muted }}>Error</div>;

            const entries = Object.values(teaData)
                .filter((ya) => ya.tea > 0)
                .sort((a, b) => b.tea - a.tea);
            const latestUpdate = entries[0]?.updated_at;

            return (
                <>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                                fontSize: fonts.size.xs,
                                color: colors.fg.muted,
                                fontWeight: 500,
                                padding: `${spacing[2]} ${spacing[2]}`,
                                borderBottom: `1px solid ${colors.highlight.medium}`,
                                position: "sticky",
                                top: 0,
                                backgroundColor: colors.bg.surface,
                                zIndex: 1,
                            }}
                        >
                            <span>Banco</span>
                            <span>TEA</span>
                            <span>TNA</span>
                            <span>TEM</span>
                            <span>Diario</span>
                            <span>Límite</span>
                        </div>
                        {entries.map((ya) => (
                            <div
                                key={ya.slug || ya.entity}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                                    alignItems: "center",
                                    fontSize: fonts.size.sm,
                                    padding: `${spacing[2]} ${spacing[2]}`,
                                    borderBottom: `1px solid ${colors.highlight.low}`,
                                }}
                            >
                                <div>
                                    <span style={{ color: colors.fg.default }}>{ya.entity}</span>
                                    {ya.conditions && (
                                        <div style={{ fontSize: fonts.size.xs, color: colors.fg.muted }}>
                                            {ya.conditions}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.accent.teal }}>
                                    {formatPercent(ya.tea)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.default }}>
                                    {formatPercent(ya.tna)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.muted }}>
                                    {formatPercent(ya.tem)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.muted }}>
                                    {ya.daily_rate?.toFixed(3)}%
                                </span>
                                <span style={{ fontFamily: fonts.family.mono, color: colors.fg.muted }}>
                                    {formatCurrency(ya.limit)}
                                </span>
                            </div>
                        ))}
                    </div>
                    {latestUpdate && (
                        <div style={lastUpdatedStyle}>
                            Actualizado: {formatDateTimeFull(latestUpdate)}
                        </div>
                    )}
                </>
            );
        }

        if (activeTab === "uva") {
            if (uvaLoading) return <div style={{ color: colors.fg.muted }}>Cargando...</div>;
            if (uvaError || !uvaData) return <div style={{ color: colors.fg.muted }}>Error</div>;

            const entries = Object.values(uvaData);
            const latestUpdate = entries[0]?.updated_at;

            return (
                <>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr",
                                fontSize: fonts.size.xs,
                                color: colors.fg.muted,
                                fontWeight: 500,
                                padding: `${spacing[2]} ${spacing[2]}`,
                                borderBottom: `1px solid ${colors.highlight.medium}`,
                                position: "sticky",
                                top: 0,
                                backgroundColor: colors.bg.surface,
                                zIndex: 1,
                            }}
                        >
                            <span>Banco</span>
                            <span>TNA</span>
                        </div>
                        {entries.map((loan) => (
                            <div
                                key={loan.slug || loan.entity}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr",
                                    alignItems: "center",
                                    fontSize: fonts.size.sm,
                                    padding: `${spacing[2]} ${spacing[2]}`,
                                    borderBottom: `1px solid ${colors.highlight.low}`,
                                }}
                            >
                                <span style={{ color: colors.fg.default }}>{loan.name}</span>
                                <span
                                    style={{
                                        fontFamily: fonts.family.mono,
                                        color: colors.fg.default,
                                    }}
                                >
                                    {formatPercent(loan.tna)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    {latestUpdate && (
                        <div style={lastUpdatedStyle}>
                            Actualizado: {formatDateTimeFull(latestUpdate)}
                        </div>
                    )}
                </>
            );
        }

        return null;
    };

    return (
        <Card title="Comparativas" onRefresh={handleRefresh}>
            <div style={{ display: "flex", gap: spacing[2], marginBottom: spacing[4] }}>
                {tabs.map(renderTabButton)}
            </div>
            {renderContent()}
        </Card>
    );
}

export function EconomicPage() {
    return (
        <div>
            <h2
                style={{
                    fontFamily: fonts.family.display,
                    fontSize: fonts.size.xl,
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: spacing[6],
                    color: colors.fg.default,
                }}
            >
                Datos Económicos
            </h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: spacing[4],
                }}
            >
                <DollarSection />
                <UsdtSection />
                <BtcSection />
                <EthSection />
                <CountryRiskSection />
                <InflationSection />
            </div>

            <h3
                style={{
                    fontFamily: fonts.family.display,
                    fontSize: fonts.size.lg,
                    fontWeight: 600,
                    margin: 0,
                    marginTop: spacing[8],
                    marginBottom: spacing[4],
                    color: colors.fg.default,
                }}
            >
                Comparativas
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: spacing[4] }}>
                <ComparativesSection />
            </div>
        </div>
    );
}

