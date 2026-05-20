import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MetricCard, shared } from "@/components/ui/MetricCard";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { formatNumber } from "@/utils/format";
import { formatDateStr, getDateFormat } from "@/utils/date";
import { economic } from "@/api_client";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import {
    useInflation,
    useDollarHistoric,
    useCountryRisk,
    useCrypto,
    useUserConfig,
} from "@/hooks";

/* ──────────── Inflation ──────────── */

export function InflationSection({ onRefresh: _ }: { onRefresh?: () => void }) {
    const { data, isLoading, isError, error } = useInflation();
    const qc = useQueryClient();
    const handleRefresh = async () => {
        try {
            const newData = await economic.getInflation(true);
            qc.setQueryData(["economic", "inflation"], newData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    if (isLoading || isError || !data) {
        return <MetricCard title="Inflación Mensual" loading={isLoading} error={isError ? getApiErrorMessage(error) : null} onRefresh={handleRefresh} />;
    }

    const monthLabel = data.last?.date
        ? (() => {
              const [year, month] = data.last.date.split("-");
              const d = new Date(parseInt(year), parseInt(month) - 1, 1);
              return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(/^[a-z]/, (c) => c.toUpperCase());
          })()
        : null;

    return (
        <MetricCard title="Inflación Mensual" loading={false} onRefresh={handleRefresh} delta={data.delta?.pct} points={data.series?.points} footer={monthLabel} inverseTrend>
            <div style={shared.valueStyle}>{formatNumber(data.last?.value ?? 0)}%</div>
        </MetricCard>
    );
}

/* ──────────── Dólar ──────────── */

export function DollarSection({ onRefresh: _ }: { onRefresh?: () => void }) {
    const qc = useQueryClient();
    const { data: sellRes, isLoading: sellLoading, isError: sellError, error: sellErr } = useDollarHistoric("sell");
    const { data: buyRes, isLoading: buyLoading } = useDollarHistoric("buy");
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);
    const [activeView, setActiveView] = useState<"buy" | "sell">("sell");

    const handleRefresh = async () => {
        try {
            const [sellData, buyData] = await Promise.all([
                economic.getDollarHistoric("sell", true),
                economic.getDollarHistoric("buy", true),
            ]);
            qc.setQueryData(["economic", "dollar-historic", "sell"], sellData);
            qc.setQueryData(["economic", "dollar-historic", "buy"], buyData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    const isLoading = sellLoading || buyLoading;
    const isError = sellError || !sellRes;

    if (isLoading || isError) {
        return <MetricCard title="Dólar Oficial (BNA)" loading={isLoading} error={isError ? getApiErrorMessage(sellErr) : null} onRefresh={handleRefresh} />;
    }

    const activeData = activeView === "sell" ? sellRes! : buyRes || null;
    const activeDelta = activeView === "sell" ? sellRes!.delta : buyRes?.delta;
    const activeValue = activeView === "sell" ? (sellRes!.last?.value ?? 0) : (buyRes?.last?.value ?? 0);

    return (
        <MetricCard title="Dólar Oficial (BNA)" loading={false} onRefresh={handleRefresh} delta={activeDelta?.pct} points={activeData?.series?.points} footer={activeData?.last?.date ? `Fecha: ${formatDateStr(activeData.last.date, userDateFormat)}` : null}>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2], flexWrap: "wrap" }}>
                <div style={shared.valueStyle}>${formatNumber(activeValue)}</div>
                <div style={{ display: "flex", gap: spacing[1] }}>
                    {(["buy", "sell"] as const).map((v) => {
                        const isActive = activeView === v;
                        const label = v === "buy" ? "COMPRA" : "VENTA";
                        return (
                            <div key={v} onClick={() => setActiveView(v)} style={{ cursor: "pointer", padding: "0 6px", height: 16, display: "inline-flex", alignItems: "center", borderRadius: radius.full, fontSize: "9px", fontWeight: 600, letterSpacing: "0.2px", transition: "all 0.15s", backgroundColor: isActive ? colors.accent.cyan + "20" : "transparent", color: isActive ? colors.accent.cyan : colors.fg.dim, border: `1px solid ${isActive ? colors.accent.cyan : colors.border}` }}>
                                {label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </MetricCard>
    );
}

/* ──────────── Riesgo País ──────────── */

export function CountryRiskSection({ onRefresh: _ }: { onRefresh?: () => void }) {
    const { data, isLoading, isError, error } = useCountryRisk();
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);
    const qc = useQueryClient();
    const handleRefresh = async () => {
        try {
            const newData = await economic.getCountryRisk(true);
            qc.setQueryData(["economic", "country-risk"], newData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };

    if (isLoading || isError || !data) {
        return <MetricCard title="Riesgo País" loading={isLoading} error={isError ? getApiErrorMessage(error) : null} onRefresh={handleRefresh} />;
    }

    return (
        <MetricCard title="Riesgo País" loading={false} onRefresh={handleRefresh} delta={data.variation} footer={data.date ? `Fecha: ${formatDateStr(data.date, userDateFormat)}` : null} inverseTrend>
            <div style={shared.valueStyle}>{data.value}</div>
        </MetricCard>
    );
}

/* ──────────── Crypto (shared) ──────────── */

function useCryptoRefresh(coin: "usdt" | "btc" | "eth") {
    const qc = useQueryClient();
    return async () => {
        try {
            const newData = await economic.getCrypto(coin, true);
            qc.setQueryData(["economic", "crypto", coin], newData);
        } catch (err) {
            toast(getApiErrorMessage(err));
        }
    };
}

function CryptoSection({ coin, title }: { coin: "usdt" | "btc" | "eth"; title: string }) {
    const { data, isLoading, isError, error } = useCrypto(coin);
    const { data: userConfig } = useUserConfig();
    const userDateFormat = getDateFormat(userConfig?.date_format);
    const handleRefresh = useCryptoRefresh(coin);

    if (isLoading || isError || !data) {
        return <MetricCard title={title} loading={isLoading} error={isError ? getApiErrorMessage(error) : null} onRefresh={handleRefresh} />;
    }

    return (
        <MetricCard title={title} loading={false} onRefresh={handleRefresh} delta={data.delta?.pct} points={data.series?.points} footer={data.last?.date ? `Fecha: ${formatDateStr(data.last.date, userDateFormat)}` : null}>
            <div style={shared.valueStyle}>${formatNumber(data.last?.value ?? 0)}</div>
        </MetricCard>
    );
}

export function UsdtSection() { return <CryptoSection coin="usdt" title="Dólar Crypto (USDT)" />; }
export function BtcSection() { return <CryptoSection coin="btc" title="Bitcoin (BTC/USDT)" />; }
export function EthSection() { return <CryptoSection coin="eth" title="Ethereum (ETH/USDT)" />; }
