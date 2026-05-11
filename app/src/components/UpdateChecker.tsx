import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Button } from "@/components/ui/Button";

const CURRENT_VERSION = "0.3.5";
const UPDATE_CHECK_URL = "https://api.github.com/repos/nnavales/quant/releases?per_page=1";

export function UpdateChecker() {
    const [checking, setChecking] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<"none" | "available" | "error" | "up-to-date">("none");
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
            console.log("GitHub response:", data);
            const latest = Array.isArray(data) && data.length > 0 
                ? data[0].tag_name?.replace("v", "") 
                : "";

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
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            <div>
                <h3 style={{ fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base, margin: 0 }}>
                    Verificar actualizaciones
                </h3>
                <p style={{ fontSize: fonts.size.sm, color: colors.fg.dim, margin: `${spacing[1]} 0 0` }}>
                    Versión actual: {CURRENT_VERSION}
                </p>
            </div>

            <div style={{
                backgroundColor: colors.bg.base,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                padding: spacing[4],
            }}>
                {updateStatus === "none" && (
                    <p style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0 }}>
                        Haz clic en "Buscar actualizaciones" para verificar si hay una nueva versión disponible.
                    </p>
                )}

                {updateStatus === "up-to-date" && (
                    <p style={{ color: colors.accent.green, fontSize: fonts.size.sm, margin: 0 }}>
                        ✓ Estás usando la última versión ({CURRENT_VERSION})
                    </p>
                )}

                {updateStatus === "available" && (
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                        <p style={{ color: colors.accent.orange, fontSize: fonts.size.sm, margin: 0 }}>
                            Nueva versión disponible: {latestVersion}
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            iconLeft={<Download size={14} />}
                            onClick={() => open("https://github.com/nnavales/quant/releases")}
                        >
                            Descargar
                        </Button>
                    </div>
                )}

                {updateStatus === "error" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                        <p style={{ color: colors.accent.red, fontSize: fonts.size.sm, margin: 0 }}>
                            Error al verificar actualizaciones. Podés verificar manualmente en GitHub.
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => open("https://github.com/nnavales/quant/releases")}
                        >
                            Ver releases en GitHub
                        </Button>
                    </div>
                )}
            </div>

            <Button
                variant="secondary"
                iconLeft={<RefreshCw size={14} className={checking ? "spin" : ""} />}
                onClick={checkForUpdates}
                disabled={checking}
            >
                {checking ? "Buscando..." : "Buscar actualizaciones"}
            </Button>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}