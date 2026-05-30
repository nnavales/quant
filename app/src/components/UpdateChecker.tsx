import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { SettingsCard } from "@/components/SettingsCard";
import { flexColumn, flexRow } from "@/styles/layout";

const CURRENT_VERSION = "0.7.0";
const UPDATE_CHECK_URL = "https://api.github.com/repos/nnavales/quant/releases?per_page=1";

export function UpdateChecker() {
    const [checking, setChecking] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<"none" | "available" | "error" | "up-to-date">(
        "none"
    );
    const [latestVersion, setLatestVersion] = useState("");

    const checkForUpdates = async () => {
        setChecking(true);
        setUpdateStatus("none");

        try {
            const response = await fetch(UPDATE_CHECK_URL, {
                headers: {
                    Accept: "application/vnd.github+json",
                },
            });

            if (!response.ok) {
                console.error("Update check failed:", response.status, response.statusText);
                setUpdateStatus("error");
                setChecking(false);
                return;
            }

            const data = await response.json();
            const latest =
                Array.isArray(data) && data.length > 0 ? data[0].tag_name?.replace("v", "") : "";

            setLatestVersion(latest);

            if (latest && latest !== CURRENT_VERSION) {
                setUpdateStatus("available");
            } else {
                setUpdateStatus("up-to-date");
            }
        } catch (err) {
            console.error("Update check error:", err);
            setUpdateStatus("error");
        }

        setChecking(false);
    };

    return (
        <div style={{ ...flexColumn, gap: spacing[4] }}>
            <SettingsCard title="Verificar actualizaciones">
                <p
                    style={{
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        marginBottom: spacing[3],
                    }}
                >
                    Versión actual: {CURRENT_VERSION}
                </p>

                {updateStatus === "none" && (
                    <p style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0 }}>
                        Haz clic en "Buscar actualizaciones" para verificar si hay una nueva versión
                        disponible.
                    </p>
                )}

                {updateStatus === "up-to-date" && (
                    <p style={{ color: colors.accent.green, fontSize: fonts.size.sm, margin: 0 }}>
                        ✓ Estás usando la última versión ({CURRENT_VERSION})
                    </p>
                )}

                {updateStatus === "available" && (
                    <div style={{ ...flexRow, gap: spacing[3] }}>
                        <p
                            style={{
                                color: colors.accent.orange,
                                fontSize: fonts.size.sm,
                                margin: 0,
                            }}
                        >
                            Nueva versión disponible: {latestVersion}
                        </p>
                        <button
                            onClick={() => open("https://github.com/nnavales/quant/releases")}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = colors.fg.base;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = colors.fg.dim;
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: spacing[1],
                                backgroundColor: colors.bg.surface,
                                border: "none",
                                borderRadius: radius.md,
                                height: "28px",
                                padding: `0 ${spacing[2]}`,
                                color: colors.fg.dim,
                                fontSize: fonts.size.sm,
                                fontFamily: fonts.family,
                                fontWeight: fonts.weight.medium,
                                cursor: "pointer",
                                transition: "color 0.15s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Download size={14} />
                            Descargar
                        </button>
                    </div>
                )}

                {updateStatus === "error" && (
                    <div style={{ ...flexColumn, gap: spacing[2] }}>
                        <p style={{ color: colors.accent.red, fontSize: fonts.size.sm, margin: 0 }}>
                            Error al verificar actualizaciones. Podés verificar manualmente en
                            GitHub.
                        </p>
                        <button
                            onClick={() => open("https://github.com/nnavales/quant/releases")}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = colors.fg.base;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = colors.fg.dim;
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: spacing[1],
                                backgroundColor: colors.bg.surface,
                                border: "none",
                                borderRadius: radius.md,
                                height: "28px",
                                padding: `0 ${spacing[2]}`,
                                color: colors.fg.dim,
                                fontSize: fonts.size.sm,
                                fontFamily: fonts.family,
                                fontWeight: fonts.weight.medium,
                                cursor: "pointer",
                                transition: "color 0.15s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Ver releases en GitHub
                        </button>
                    </div>
                )}

                <button
                    onClick={checkForUpdates}
                    disabled={checking}
                    onMouseEnter={(e) => {
                        if (!checking) e.currentTarget.style.color = colors.fg.base;
                    }}
                    onMouseLeave={(e) => {
                        if (!checking) e.currentTarget.style.color = colors.fg.dim;
                    }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: spacing[2],
                        backgroundColor: colors.bg.surface,
                        border: "none",
                        borderRadius: radius.md,
                        height: "32px",
                        padding: `0 ${spacing[3]}`,
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        fontFamily: fonts.family,
                        fontWeight: fonts.weight.medium,
                        cursor: checking ? "not-allowed" : "pointer",
                        opacity: checking ? 0.5 : 1,
                        transition: "color 0.15s",
                        whiteSpace: "nowrap",
                        marginTop: spacing[3],
                    }}
                >
                    <RefreshCw
                        size={14}
                        style={checking ? { animation: "spin 1s linear infinite" } : undefined}
                    />
                    {checking ? "Buscando..." : "Buscar actualizaciones"}
                </button>
            </SettingsCard>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

