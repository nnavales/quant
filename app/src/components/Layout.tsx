import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { colors } from "@/styles/colors";
import { spacing } from "@/styles/theme";
import { fonts } from "@/styles/fonts";

interface LayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    showSettings: boolean;
    onOpenSettings: () => void;
    onCloseSettings: () => void;
}

export function Layout({ children, activeTab, onTabChange, showSettings, onOpenSettings, onCloseSettings }: LayoutProps) {
    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                backgroundColor: colors.bg.base,
                color: colors.fg.base,
                fontFamily: fonts.family.text,
            }}
        >
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} onOpenSettings={onOpenSettings} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <header
                    style={{
                        padding: `${spacing[4]} ${spacing[6]}`,
                        borderBottom: `1px solid ${colors.fill}`,
                    }}
                >
                    <h1
                        style={{
                            fontFamily: fonts.family.display,
                            fontSize: fonts.size.xl,
                            fontWeight: 600,
                            margin: 0,
                        }}
                    >
                        Summit
                    </h1>
                </header>
                <main
                    style={{
                        padding: spacing[6],
                        flex: 1,
                    }}
                >
                    {children}
                </main>
            </div>
            {showSettings && <SettingsModal onClose={onCloseSettings} />}
        </div>
    );
}
