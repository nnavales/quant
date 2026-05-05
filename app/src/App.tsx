import { useState, useEffect } from "react";
import "./index.css";
import { Layout } from "@/components/Layout";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { EconomicPage } from "@/pages/EconomicPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AnalysisPage } from "@/pages/AnalysisPage";
import { ToastContainer } from "@/components/ui/Toast";
import { api } from "@/api_client/client";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

function ApiUnavailable({ onRetry }: { onRetry: () => void }) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: colors.bg.base,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: `${colors.accent.red}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span style={{ fontSize: "24px" }}>⚠️</span>
            </div>
            <h2
                style={{
                    margin: 0,
                    fontSize: fonts.size.lg,
                    fontWeight: 600,
                    color: colors.fg.base,
                }}
            >
                API no disponible
            </h2>
            <p
                style={{
                    margin: 0,
                    fontSize: fonts.size.sm,
                    color: colors.fg.dim,
                    textAlign: "center",
                    maxWidth: "360px",
                    lineHeight: 1.5,
                }}
            >
                No se pudo conectar con el servidor. Verificá que la API esté corriendo e intentá de nuevo.
            </p>
            <button
                onClick={onRetry}
                style={{
                    marginTop: "8px",
                    padding: "8px 20px",
                    backgroundColor: colors.fill,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    color: colors.fg.base,
                    fontSize: fonts.size.sm,
                    fontWeight: 500,
                    cursor: "pointer",
                }}
            >
                Reintentar
            </button>
        </div>
    );
}

function App() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showSettings, setShowSettings] = useState(false);
    const [apiReady, setApiReady] = useState<boolean | null>(null);

    const checkHealth = async () => {
        setApiReady(null);
        await api.initFromConfig();
        const ok = await api.healthCheck();
        setApiReady(ok);
    };

    useEffect(() => {
        checkHealth();
        const interval = setInterval(async () => {
            await api.initFromConfig();
            const ok = await api.healthCheck();
            if (!ok) setApiReady(false);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    if (apiReady === null) {
        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: colors.bg.base,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.fg.dim,
                    fontSize: fonts.size.sm,
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                Iniciando...
            </div>
        );
    }

    if (!apiReady) {
        return <ApiUnavailable onRetry={checkHealth} />;
    }

    return (
        <>
            <Layout
                activeTab={activeTab}
                onTabChange={setActiveTab}
                showSettings={showSettings}
                onOpenSettings={() => setShowSettings(true)}
                onCloseSettings={() => setShowSettings(false)}
            >
                {activeTab === "dashboard" && <DashboardPage />}
                {activeTab === "transactions" && <TransactionsPage />}
                {activeTab === "economic" && <EconomicPage />}
                {activeTab === "analysis" && <AnalysisPage />}
            </Layout>
            <ToastContainer />
        </>
    );
}

export default App;
