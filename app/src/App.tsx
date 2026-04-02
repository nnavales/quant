import { useState } from "react";
import "./index.css";
import { Layout } from "@/components/Layout";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { EconomicPage } from "@/pages/EconomicPage";
import { ToastContainer } from "@/components/ui/Toast";

function App() {
    const [activeTab, setActiveTab] = useState("transactions");
    const [showSettings, setShowSettings] = useState(false);

    return (
        <>
            <Layout
                activeTab={activeTab}
                onTabChange={setActiveTab}
                showSettings={showSettings}
                onOpenSettings={() => setShowSettings(true)}
                onCloseSettings={() => setShowSettings(false)}
            >
                {activeTab === "transactions" && <TransactionsPage />}
                {activeTab === "economic" && <EconomicPage />}
            </Layout>
            <ToastContainer />
        </>
    );
}

export default App;
