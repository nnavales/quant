import { useState } from "react";
import { ChannelList } from "@/components/ChannelList";
import { AccountList } from "@/components/AccountList";
import { CategoryManager } from "@/components/CategoryManager";
import { SubcategoryList } from "@/components/SubcategoryList";
import { UserSettings } from "@/components/UserSettings";
import { PresetManager } from "@/components/PresetManager";
import { BackupManager } from "@/components/BackupManager";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";


type SettingsTab = "user" | "channels" | "accounts" | "categories" | "subcategories" | "presets" | "backup";

const tabs: { id: SettingsTab; label: string }[] = [
    { id: "user", label: "Usuario" },
    { id: "channels", label: "Canales" },
    { id: "accounts", label: "Cuentas" },
    { id: "categories", label: "Categorías" },
    { id: "subcategories", label: "Subcategorías" },
    { id: "presets", label: "Presets" },
    { id: "backup", label: "Backup" },
];

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("user");

    return (
        <div style={{ padding: spacing[3], display: "flex", flexDirection: "column", gap: spacing[4], animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: `${spacing[2]} ${spacing[4]}`,
                                borderRadius: radius.md,
                                border: isActive ? `1px solid ${colors.border}` : `1px solid ${colors.fill}`,
                                backgroundColor: isActive ? colors.bg.surface : "transparent",
                                color: isActive ? colors.fg.base : colors.fg.dim,
                                fontSize: fonts.size.sm,
                                fontWeight: isActive ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s",
                                fontFamily: fonts.family.text,
                                letterSpacing: "0.3px",
                                boxShadow: "none",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = colors.fill;
                                    e.currentTarget.style.color = colors.fg.base;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = colors.fg.dim;
                                }
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === "user" && <UserSettings />}
            {activeTab === "channels" && <ChannelList />}
            {activeTab === "accounts" && <AccountList />}
            {activeTab === "categories" && <CategoryManager />}
            {activeTab === "subcategories" && <SubcategoryList />}
            {activeTab === "presets" && <PresetManager />}
            {activeTab === "backup" && <BackupManager />}
        </div>
    );
}
