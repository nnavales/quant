import axios, { AxiosInstance, AxiosError } from "axios";
import type { ApiError } from "./types";

const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:43123/api";

export class ApiClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor(baseURL: string = DEFAULT_BASE_URL) {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ApiError>) => {
                let message: string;
                if (!error.response) {
                    message = error.code === "ECONNABORTED" ? "timeout" : "network error";
                } else {
                    const data = error.response.data as unknown;
                    if (typeof data === "string" && data.length > 0) {
                        message = data;
                    } else if (data && typeof data === "object" && "error" in data) {
                        message = (data as ApiError).error;
                    } else {
                        message = error.message || `HTTP ${error.response.status}`;
                    }
                }
                return Promise.reject(new Error(message));
            }
        );
    }

    async initFromConfig(): Promise<void> {
        try {
            const { invoke } = await import("@tauri-apps/api/core");
            const port = await invoke<number>("get_port");
            this.baseURL = `http://127.0.0.1:${port}/api`;
            this.client.defaults.baseURL = this.baseURL;
        } catch {
            // keep default
        }
    }

    getBaseURL(): string {
        return this.baseURL;
    }

    async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        const response = await this.client.get<T>(url, { params });
        return response.data;
    }

    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    async patch<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.patch<T>(url, data);
        return response.data;
    }

    async delete<T>(url: string, body?: unknown): Promise<T> {
        const config = body !== undefined ? { data: body } : {};
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    setBaseURL(url: string) {
        this.client.defaults.baseURL = url;
    }

    async healthCheck(timeoutMs = 3000): Promise<boolean> {
        try {
            await this.client.get("/healthz", { timeout: timeoutMs });
            return true;
        } catch {
            return false;
        }
    }

    get clientInstance() {
        return this.client;
    }
}

export const api = new ApiClient();
