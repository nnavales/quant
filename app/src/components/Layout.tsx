import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
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
                height: "100dvh",
                overflow: "hidden",
                backgroundColor: colors.bg.base,
                color: colors.fg.base,
                fontFamily: fonts.family.text,
            }}
        >
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} onOpenSettings={onOpenSettings} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <TitleBar />
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
