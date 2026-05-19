import { useEffect, useState } from "react";
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
};

const dragRegionStyle: React.CSSProperties = {
    flex: 1,
    height: "100%",
};

const controlsStyle: React.CSSProperties = {
    display: "flex",
    height: "100%",
};

const buttonStyle: React.CSSProperties = {
    width: "46px",
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: colors.fg.dim,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 120ms ease",
};

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        let mounted = true;
        let unlisten: (() => void) | undefined;

        appWindow.isMaximized().then((v) => {
            if (mounted) setIsMaximized(v);
        });

        appWindow
            .onResized(async () => {
                if (!mounted) return;
                setIsMaximized(await appWindow.isMaximized());
            })
            .then((fn) => {
                unlisten = fn;
            });

        return () => {
            mounted = false;
            unlisten?.();
        };
    }, []);

    return (
        <div style={titleBarStyle}>
            <div data-tauri-drag-region style={dragRegionStyle} />

            <div style={controlsStyle}>
                <button
                    style={buttonStyle}
                    onClick={() => appWindow.minimize()}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.fill;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Minimize"
                >
                    &#x2014;
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => appWindow.toggleMaximize()}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.fill;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? "\u29C9" : "\u25A1"}
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => appWindow.close()}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#c42b1c";
                        e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = colors.fg.dim;
                    }}
                    title="Close"
                >
                    &#x2715;
                </button>
            </div>
        </div>
    );
}
