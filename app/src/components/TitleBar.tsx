import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { colors } from "@/styles/colors";

const appWindow = getCurrentWindow();

const titleBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "36px",
    flexShrink: 0,
    backgroundColor: colors.bg.base,
    userSelect: "none",
    paddingRight: "2px",
};

const dragRegionStyle: React.CSSProperties = {
    height: "100%",
    flex: 1,
};

const winBtnStyle: React.CSSProperties = {
    width: "46px",
    height: "100%",
    border: "none",
    backgroundColor: "transparent",
    color: colors.fg.dim,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    transition: "background-color 0.1s",
};

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        appWindow.isMaximized().then(setIsMaximized);
        const unlisten = appWindow.onResized(() => {
            appWindow.isMaximized().then(setIsMaximized);
        });
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    return (
        <div style={titleBarStyle}>
            <div data-tauri-drag-region style={dragRegionStyle} />
            <div style={{ display: "flex", height: "100%" }}>
                <button
                    style={winBtnStyle}
                    onClick={() => appWindow.minimize()}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    title="Minimizar"
                >
                    &#x2014;
                </button>
                <button
                    style={{
                        ...winBtnStyle,
                        fontSize: "12px",
                        fontWeight: 100,
                    }}
                    onClick={() => appWindow.toggleMaximize()}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    title={isMaximized ? "Restaurar" : "Maximizar"}
                >
                    {isMaximized ? "\u29C9" : "\u25A1"}
                </button>
                <button
                    style={winBtnStyle}
                    onClick={() => appWindow.close()}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#c42b1c";
                        e.currentTarget.style.color = "#fff";
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
