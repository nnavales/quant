import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import { spacing } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { formatNumber } from "@/utils/format";
import { formatDateStr, getDateFormat } from "@/utils/date";
import { economic } from "@/api_client";
import { toast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import {
    useInflation,
    useDollarHistoric,
    useCountryRisk,
    useCrypto,
    useUserConfig,
} from "@/hooks";

/* ──────────── Shared styles ──────────── */

const valueStyle: React.CSSProperties = {
    fontSize: fonts.size["2xl"],
    fontWeight: 600,
    fontFamily: fonts.family.display,
    color: colors.fg.base,
};

const deltaStyle = (positive?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: fonts.size.sm,
    color:
        positive === true
            ? colors.accent.green
            : positive === false
              ? colors.accent.red
              : colors.fg.dim,
    marginTop: spacing[2],
});

const lastUpdatedStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    opacity: 0.7,
    marginTop: "auto",
    paddingTop: spacing[4],
    alignSelf: "flex-start",
};

/* ──────────── InflationSection ──────────── */

export function InflationSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useInflation();

    const handleRefresh = async () => {
        onRefresh?.();
        try {
            const newData = await economic.getInflation(true);
            queryClient.setQueryData(["economic", "inflation"], newData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    if (isLoading)
        return (
            <Card title="Inflación Mensual" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Inflación Mensual" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>{isError && error ? getApiErrorMessage(error) : "Error"}</div>
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
            <div style={valueStyle}>{formatNumber(value)}%</div>
            {delta && delta.pct !== 0 && (
                <div style={deltaStyle(delta.pct > 0)}>
                    {delta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {delta.pct > 0 ? "+" : ""}
                        {formatNumber(delta.pct)}%
                    </span>
                </div>
            )}
            {data.series?.points && <Sparkline points={data.series.points} />}
            {monthLabel && <div style={lastUpdatedStyle}>{monthLabel}</div>}
        </Card>
    );
}

/* ──────────── DollarSection ──────────── */

export function DollarSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data: sellRes, isLoading: sellLoading, isError: sellError, error: sellErr } = useDollarHistoric("sell");
    const { data: buyRes, isLoading: buyLoading } = useDollarHistoric("buy");
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);

    const [activeView, setActiveView] = useState<"buy" | "sell">("sell");

    const handleRefresh = async () => {
        onRefresh?.();
        try {
            const [sellData, buyData] = await Promise.all([
                economic.getDollarHistoric("sell", true),
                economic.getDollarHistoric("buy", true),
            ]);
            queryClient.setQueryData(["economic", "dollar-historic", "sell"], sellData);
            queryClient.setQueryData(["economic", "dollar-historic", "buy"], buyData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    const isLoading = sellLoading || buyLoading;
    const isError = sellError || !sellRes;

    if (isLoading)
        return (
            <Card title="Dólar" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>Cargando...</div>
            </Card>
        );
    if (isError || !sellRes)
        return (
            <Card title="Dólar" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>{sellError && sellErr ? getApiErrorMessage(sellErr) : "Error"}</div>
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
                    <div style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>COMPRA</div>
                    <div
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.lg,
                            color: colors.fg.base,
                        }}
                    >
                        ${formatNumber(buyValue)}
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
                    <div style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>VENTA</div>
                    <div
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.lg,
                            color: colors.fg.base,
                        }}
                    >
                        ${formatNumber(sellValue)}
                    </div>
                </div>
            </div>
            {activeDelta && activeDelta.pct !== 0 && (
                <div style={deltaStyle(activeDelta.pct > 0)}>
                    {activeDelta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {activeDelta.pct > 0 ? "+" : ""}
                        {formatNumber(activeDelta.pct)}%
                    </span>
                </div>
            )}
            {activeData?.series?.points && <Sparkline points={activeData.series.points} />}
            {activeData?.last?.date && (
                <div style={lastUpdatedStyle}>Fecha: {formatDateStr(activeData.last.date, userDateFormat)}</div>
            )}
        </Card>
    );
}

/* ──────────── CountryRiskSection ──────────── */

export function CountryRiskSection({ onRefresh }: { onRefresh?: () => void }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useCountryRisk();
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);

    const handleRefresh = async () => {
        onRefresh?.();
        try {
            const newData = await economic.getCountryRisk(true);
            queryClient.setQueryData(["economic", "country-risk"], newData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    if (isLoading)
        return (
            <Card title="Riesgo País" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title="Riesgo País" onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>{isError && error ? getApiErrorMessage(error) : "Error"}</div>
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
            {data.date && <div style={lastUpdatedStyle}>Fecha: {formatDateStr(data.date, userDateFormat)}</div>}
        </Card>
    );
}

/* ──────────── Crypto sections ──────────── */

function CryptoSection({
    coin,
    title,
    onRefresh,
}: {
    coin: "usdt" | "btc" | "eth";
    title: string;
    onRefresh?: () => void;
}) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useCrypto(coin);
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);

    const handleRefresh = async () => {
        onRefresh?.();
        try {
            const newData = await economic.getCrypto(coin, true);
            queryClient.setQueryData(["economic", "crypto", coin], newData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    if (isLoading)
        return (
            <Card title={title} onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>Cargando...</div>
            </Card>
        );
    if (isError || !data)
        return (
            <Card title={title} onRefresh={handleRefresh}>
                <div style={{ color: colors.fg.dim }}>{isError && error ? getApiErrorMessage(error) : "Error"}</div>
            </Card>
        );

    const value = data.last?.value ?? 0;
    const delta = data.delta;

    return (
        <Card title={title} onRefresh={handleRefresh}>
            <div style={valueStyle}>${formatNumber(value)}</div>
            {delta && delta.pct !== 0 && (
                <div style={deltaStyle(delta.pct > 0)}>
                    {delta.pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                        {delta.pct > 0 ? "+" : ""}
                        {formatNumber(delta.pct)}%
                    </span>
                </div>
            )}
            {data.series?.points && <Sparkline points={data.series.points} />}
            {data.last?.date && (
                <div style={lastUpdatedStyle}>Fecha: {formatDateStr(data.last.date, userDateFormat)}</div>
            )}
        </Card>
    );
}

export function UsdtSection(props: { onRefresh?: () => void }) {
    return <CryptoSection coin="usdt" title="Dólar Crypto (USDT)" onRefresh={props.onRefresh} />;
}

export function BtcSection(props: { onRefresh?: () => void }) {
    return <CryptoSection coin="btc" title="Bitcoin (BTC/USDT)" onRefresh={props.onRefresh} />;
}

export function EthSection(props: { onRefresh?: () => void }) {
    return <CryptoSection coin="eth" title="Ethereum (ETH/USDT)" onRefresh={props.onRefresh} />;
}
