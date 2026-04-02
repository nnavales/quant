import { useState } from "react";
import { ChannelList } from "@/components/ChannelList";
import { AccountList } from "@/components/AccountList";
import { CategoryList } from "@/components/CategoryList";
import { SubcategoryList } from "@/components/SubcategoryList";
import { UserSettings } from "@/components/UserSettings";

type SettingsTab = "user" | "channels" | "accounts" | "categories" | "subcategories";

const tabs: { id: SettingsTab; label: string }[] = [
    { id: "user", label: "Usuario" },
    { id: "channels", label: "Canales" },
    { id: "accounts", label: "Cuentas" },
    { id: "categories", label: "Categorías" },
    { id: "subcategories", label: "Subcategorías" },
];

const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "var(--spacing-2) var(--spacing-4)",
    backgroundColor: active ? "var(--highlight-medium)" : "transparent",
    color: active ? "var(--fg-default)" : "var(--fg-muted)",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.15s",
});

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("channels");

    return (
        <div>
            <h2
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--font-size-lg)",
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: "var(--spacing-4)",
                }}
            >
                Configuración
            </h2>

            <div style={{ display: "flex", gap: "var(--spacing-2)", marginBottom: "var(--spacing-6)" }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={tabStyle(activeTab === tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "user" && <UserSettings />}
            {activeTab === "channels" && <ChannelList />}
            {activeTab === "accounts" && <AccountList />}
            {activeTab === "categories" && <CategoryList />}
            {activeTab === "subcategories" && <SubcategoryList />}
        </div>
    );
}
