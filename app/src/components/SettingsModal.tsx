import { useState } from "react";
import { X, CreditCard, Tag, User, Layers, Database, RefreshCw } from "lucide-react";
import { ChannelAccountManager } from "@/components/ChannelAccountManager";
import { CategoryManager } from "@/components/CategoryManager";
import { UserSettings } from "@/components/UserSettings";
import { PresetManager } from "@/components/PresetManager";
import { BackupManager } from "@/components/BackupManager";
import { UpdateChecker } from "@/components/UpdateChecker";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";

type SettingsTab = "user" | "channels" | "categories" | "presets" | "backup" | "updates";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "user", label: "Usuario", icon: User },
    { id: "channels", label: "Métodos de pago", icon: CreditCard },
    { id: "categories", label: "Categorías", icon: Tag },
    { id: "presets", label: "Presets", icon: Layers },
    { id: "backup", label: "Backup", icon: Database },
    { id: "updates", label: "Actualizaciones", icon: RefreshCw },
];

interface SettingsModalProps {
    onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("user");

    return (
        <Modal isOpen onClose={onClose} opacity={0.5}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.xl,
                    width: "90%",
                    maxWidth: "900px",
                    height: "80vh",
                    display: "flex",
                    border: `1px solid ${colors.border}`,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: "200px",
                        borderRight: `1px solid ${colors.border}`,
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: colors.bg.surface,
                    }}
                >
                    <div
                        style={{
                            padding: `${spacing[3]} ${spacing[4]}`,
                            borderBottom: `1px solid ${colors.border}`,
                            display: "flex",
                            alignItems: "center",
                            height: "44px",
                            boxSizing: "border-box",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: fonts.size.sm,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Opciones
                        </h3>
                    </div>
                    <div style={{ padding: spacing[2], display: "flex", flexDirection: "column", gap: spacing[1] }}>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: spacing[3],
                        padding: `${spacing[3]} ${spacing[4]}`,
                                        backgroundColor: isActive ? colors.fill : "transparent",
                                        border: "none",
                                        borderRadius: radius.md,
                                        color: isActive ? colors.fg.base : colors.fg.dim,
                                        fontSize: fonts.size.sm,
                                        fontWeight: isActive ? 600 : 500,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        fontFamily: fonts.family.text,
                                        textAlign: "left",
                                        width: "100%",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = colors.fill + "80";
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
                                    <tab.icon size={16} style={{ flexShrink: 0, color: isActive ? colors.accent.cyan : colors.fg.dim }} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            padding: `${spacing[3]} ${spacing[5]}`,
                            height: "44px",
                            boxSizing: "border-box",
                            borderBottom: `1px solid ${colors.border}`,
                        }}
                    >
                        <Button variant="icon" onClick={onClose}>
                            <X size={20} />
                        </Button>
                    </div>

                    <div
                        style={{
                            padding: `${spacing[4]} ${spacing[6]}`,
                            overflowY: "scroll",
                            overscrollBehavior: "contain",
                            flex: 1,
                        }}
                    >
                        {activeTab === "user" && <UserSettings />}
                        {activeTab === "channels" && <ChannelAccountManager />}
                        {activeTab === "categories" && <CategoryManager />}
                        {activeTab === "presets" && <PresetManager />}
                        {activeTab === "backup" && <BackupManager />}
                        {activeTab === "updates" && <UpdateChecker />}
                    </div>
                </div>
            </ModalContent>
        </Modal>
    );
}
