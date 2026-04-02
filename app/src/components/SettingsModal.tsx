import { useState } from "react";
import { X, CreditCard, Tag, User } from "lucide-react";
import { ChannelAccountManager } from "@/components/ChannelAccountManager";
import { CategoryManager } from "@/components/CategoryManager";
import { UserSettings } from "@/components/UserSettings";
import { colors } from "@/styles/colors";

type SettingsTab = "user" | "channels" | "categories";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "user", label: "Usuario", icon: User },
    { id: "channels", label: "Canales / Cuentas", icon: CreditCard },
    { id: "categories", label: "Categorías", icon: Tag },
];

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.bg.dim}b3`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
};

const modalStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    width: "90%",
    maxWidth: "900px",
    height: "80vh",
    display: "flex",
    border: "1px solid var(--highlight-medium)",
    overflow: "hidden",
};

const sidebarStyle: React.CSSProperties = {
    width: "200px",
    borderRight: "1px solid var(--highlight-medium)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg-dim)",
};

const sidebarItemStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-2)",
    padding: "var(--spacing-3) var(--spacing-4)",
    backgroundColor: active ? "var(--highlight-medium)" : "transparent",
    color: active ? "var(--fg-default)" : "var(--fg-muted)",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "var(--font-size-sm)",
    transition: "all 0.15s",
    width: "100%",
});

const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--spacing-4) var(--spacing-6)",
    borderBottom: "1px solid var(--highlight-medium)",
};

const closeButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "var(--fg-muted)",
    cursor: "pointer",
    padding: "var(--spacing-2)",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const contentScrollStyle: React.CSSProperties = {
    padding: "var(--spacing-4) var(--spacing-6)",
    overflowY: "auto",
    flex: 1,
};

interface SettingsModalProps {
    onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("channels");

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={sidebarStyle}>
                    <div style={{ padding: "var(--spacing-4)", borderBottom: "1px solid var(--highlight-medium)" }}>
                        <h3 style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Configuración
                        </h3>
                    </div>
                    <div style={{ padding: "var(--spacing-2)" }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={sidebarItemStyle(activeTab === tab.id)}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.backgroundColor = "var(--highlight-low)";
                                        e.currentTarget.style.color = "var(--fg-default)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "var(--fg-muted)";
                                    }
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={contentStyle}>
                    <div style={headerStyle}>
                        <h2
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "var(--font-size-lg)",
                                fontWeight: 600,
                                margin: 0,
                            }}
                        >
                            {tabs.find((t) => t.id === activeTab)?.label}
                        </h2>
                        <button onClick={onClose} style={closeButtonStyle}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={contentScrollStyle}>
                        {activeTab === "user" && <UserSettings />}
                        {activeTab === "channels" && <ChannelAccountManager />}
                        {activeTab === "categories" && <CategoryManager />}
                    </div>
                </div>
            </div>
        </div>
    );
}
