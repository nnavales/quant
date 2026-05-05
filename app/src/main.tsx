import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/api_client/client";

async function bootstrap() {
    await api.initFromConfig();
    const apiUrl = api.getBaseURL();

    try {
        const res = await fetch(`${apiUrl}/users/config`, {
            headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
            const data = await res.json();
            if (data.theme) {
                localStorage.setItem("theme", data.theme);
            }
        }
    } catch {
        // Si la API no está disponible, usamos lo que haya en localStorage
        // o el default dark que aplica colors.ts
    }

    const [{ applyCssVars }, { default: App }] = await Promise.all([
        import("@/styles/colors"),
        import("./App"),
    ]);
    applyCssVars();

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 5,
                retry: (failureCount, error) => {
                    const msg = (error as Error)?.message?.toLowerCase() || "";
                    const isNetworkError =
                        msg.includes("network error") ||
                        msg.includes("timeout") ||
                        msg.includes("service unavailable") ||
                        msg.includes("upstream error") ||
                        msg.includes("upstream timeout") ||
                        msg.includes("request failed with status code 50");
                    if (isNetworkError) return false;
                    return failureCount < 1;
                },
                networkMode: "always",
                refetchOnWindowFocus: true,
            },
            mutations: {
                networkMode: "always",
                retry: false,
            },
        },
    });

    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </React.StrictMode>
    );
}

bootstrap();
