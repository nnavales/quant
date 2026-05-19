import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { colors } from "@/styles/colors";

const titleBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "36px",
    flexShrink: 0,
    backgroundColor: colors.bg.base,
    userSelect: "none",
};

const dragRegionStyle = {
    flex: 1,
    height: "100%",
    WebkitAppRegion: "drag",
} as React.CSSProperties;

const buttonContainerStyle = {
    display: "flex",
    alignItems: "stretch",
    height: "100%",
    position: "relative",
    zIndex: 1000,
    WebkitAppRegion: "no-drag",
} as React.CSSProperties;

const winBtnStyle = {
    width: "46px",
    height: "100%",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: colors.fg.dim,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    transition: "background-color 120ms ease",
    WebkitAppRegion: "no-drag",
} as React.CSSProperties;

export function TitleBar() {
    const appWindow = getCurrentWindow();

    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        let mounted = true;
        let unlistenResize: (() => void) | undefined;

        const syncMaximized = async () => {
            try {
                const maximized = await appWindow.isMaximized();

                if (mounted) {
                    setIsMaximized(maximized);
                }
            } catch {
                // ignore
            }
        };

        syncMaximized();

        appWindow.onResized(syncMaximized).then((fn) => {
            unlistenResize = fn;
        });

        return () => {
            mounted = false;
            unlistenResize?.();
        };
    }, [appWindow]);

    return (
        <div style={titleBarStyle}>
            <div data-tauri-drag-region style={dragRegionStyle} />

            <div style={buttonContainerStyle}>
                <button
                    type="button"
                    style={winBtnStyle}
                    onClick={async () => {
                        await appWindow.minimize();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.fill;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Minimizar"
                >
                    &#x2014;
                </button>

                <button
                    type="button"
                    style={{
                        ...winBtnStyle,
                        fontSize: "12px",
                        fontWeight: 100,
                    }}
                    onClick={async () => {
                        await appWindow.toggleMaximize();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.fill;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title={isMaximized ? "Restaurar" : "Maximizar"}
                >
                    {isMaximized ? "\u29C9" : "\u25A1"}
                </button>

                <button
                    type="button"
                    style={winBtnStyle}
                    onClick={async () => {
                        await appWindow.close();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#c42b1c";
                        e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = colors.fg.dim;
                    }}
                    title="Cerrar"
                >
                    &#x2715;
                </button>
            </div>
        </div>
    );
}
