import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2,
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
            refetchOnWindowFocus: false,
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
