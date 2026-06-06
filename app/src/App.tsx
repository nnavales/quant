import { useState, useEffect, useRef, useCallback } from "react";
import "./index.css";
import { Layout } from "@/components/Layout";
import { TitleBar } from "@/components/TitleBar";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { EconomicPage } from "@/pages/EconomicPage";
import { AnalysisPage } from "@/pages/AnalysisPage";
import { PlanningPage } from "@/pages/PlanningPage";
import { MetricsComparisonPage } from "@/pages/MetricsComparisonPage";
import { EvolutionPage } from "@/pages/EvolutionPage";
import { HistoricalPage } from "@/pages/HistoricalPage";
import { ToastContainer } from "@/components/ui/Toast";
import { WifiOff } from "lucide-react";
import { api } from "@/api_client/client";
import { colors, radius, flexColumn, flexRow } from "@/styles";
import { fonts } from "@/styles/fonts";

function ApiUnavailable({ onRetry }: { onRetry: () => void }) {
    return (
        <div
            style={{
                flex: 1,
                ...flexRow,
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    ...flexColumn,
                    alignItems: "center",
                    gap: "24px",
                }}
            >
                <span
                    style={{
                        fontFamily: fonts.family,
                        fontSize: fonts.size.xl,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.base,
                        letterSpacing: "-0.02em",
                    }}
                >
                    Quant
                </span>

                <div
                    style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: `${colors.accent.red}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <WifiOff size={20} strokeWidth={2.5} color={colors.accent.red} />
                </div>

                <div
                    style={{
                        ...flexColumn,
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <span
                        style={{
                            fontSize: fonts.size.base,
                            fontWeight: fonts.weight.medium,
                            color: colors.fg.base,
                        }}
                    >
                        Sin conexión
                    </span>
                    <span
                        style={{
                            fontSize: fonts.size.sm,
                            color: colors.fg.dim,
                            textAlign: "center",
                            maxWidth: "280px",
                            lineHeight: 1.5,
                        }}
                    >
                        No se pudo conectar con la API.
                    </span>
                </div>

                <button
                    onClick={onRetry}
                    style={{
                        padding: "8px 24px",
                        backgroundColor: colors.fill,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        color: colors.fg.base,
                        fontSize: fonts.size.sm,
                        fontWeight: fonts.weight.medium,
                        cursor: "pointer",
                        transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.hover;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.fill;
                    }}
                >
                    Reintentar
                </button>
            </div>
        </div>
    );
}

function ApiStarting() {
    return (
        <div
            style={{
                flex: 1,
                ...flexRow,
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    ...flexColumn,
                    alignItems: "center",
                    gap: "24px",
                }}
            >
                <span
                    style={{
                        fontFamily: fonts.family,
                        fontSize: fonts.size.xl,
                        fontWeight: fonts.weight.semibold,
                        color: colors.fg.base,
                        letterSpacing: "-0.02em",
                    }}
                >
                    Quant
                </span>

                <div
                    style={{
                        width: "160px",
                        height: "2px",
                        backgroundColor: colors.fill,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: "30%",
                            backgroundColor: colors.fg.dim,
                            animation: "splash-loading 1.4s ease-in-out infinite",
                        }}
                    />
                </div>

                <span
                    style={{
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                    }}
                >
                    Conectando...
                </span>
            </div>
        </div>
    );
}

function App() {
    const [activeTab, setActiveTab] = useState("analysis");
    const [showSettings, setShowSettings] = useState(false);
    const [apiStatus, setApiStatus] = useState<"loading" | "starting" | "ready" | "error">(
        "loading"
    );
    const retryCount = useRef(0);
    const apiStatusRef = useRef(apiStatus);
    apiStatusRef.current = apiStatus;

    const doHealthCheck = useCallback(async () => {
        await api.initFromConfig();
        return api.healthCheck();
    }, []);

    const startPolling = useCallback(() => {
        retryCount.current = 0;
        setApiStatus("loading");

        const poll = async () => {
            const ok = await doHealthCheck();
            if (ok) {
                setApiStatus("ready");
                return;
            }
            retryCount.current++;
            if (retryCount.current >= 10) {
                setApiStatus("error");
                return;
            }
            setApiStatus("starting");
            setTimeout(poll, 1000);
        };

        poll();
    }, [doHealthCheck]);

    useEffect(() => {
        startPolling();
    }, []);

    // React faster when Tauri sidecar emits api-ready event
    useEffect(() => {
        let cancelled = false;
        let unlisten: (() => void) | undefined;
        (async () => {
            const { listen } = await import("@tauri-apps/api/event");
            if (cancelled) return;
            unlisten = await listen("api-ready", async () => {
                if (apiStatusRef.current === "starting" || apiStatusRef.current === "loading") {
                    const ok = await doHealthCheck();
                    if (ok) setApiStatus("ready");
                }
            });
        })();
        return () => {
            cancelled = true;
            unlisten?.();
        };
    }, [doHealthCheck]);

    useEffect(() => {
        if (apiStatus !== "ready") return;
        const interval = setInterval(async () => {
            const ok = await doHealthCheck();
            if (!ok) setApiStatus("error");
        }, 15000);
        return () => clearInterval(interval);
    }, [apiStatus, doHealthCheck]);

    if (apiStatus === "ready") {
        return (
            <>
                <Layout
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    showSettings={showSettings}
                    onOpenSettings={() => setShowSettings(true)}
                    onCloseSettings={() => setShowSettings(false)}
                >
                    <div
                        style={{
                            display: activeTab === "analysis" ? "" : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <AnalysisPage />
                    </div>
                    <div
                        style={{
                            display: activeTab === "transactions" ? undefined : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <TransactionsPage />
                    </div>
                    <div
                        style={{
                            display: activeTab === "economic" ? "" : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <EconomicPage />
                    </div>
                    <div
                        style={{
                            display: activeTab === "planning" ? "" : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <PlanningPage />
                    </div>
                    <div
                        style={{
                            display: activeTab === "metrics" ? "" : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <MetricsComparisonPage />
                    </div>
                    <div
                        style={{
                            display: activeTab === "evolution" ? "" : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <EvolutionPage />
                    </div>
                    <div
                        style={{
                            display: activeTab === "historical" ? "" : "none",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <HistoricalPage />
                    </div>
                </Layout>
                <ToastContainer />
            </>
        );
    }

    return (
        <div
            style={{
                ...flexColumn,
                height: "100vh",
                backgroundColor: colors.bg.base,
                color: colors.fg.base,
            }}
        >
            <TitleBar />
            {apiStatus === "starting" && <ApiStarting />}
            {apiStatus === "error" && <ApiUnavailable onRetry={startPolling} />}
        </div>
    );
}

export default App;
