import axios, { AxiosInstance, AxiosError } from "axios";
import type { ApiError } from "./types";

const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6969/api";

export class ApiClient {
    private client: AxiosInstance;

    constructor(baseURL: string = DEFAULT_BASE_URL) {
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

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<T>(url);
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
}

export const api = new ApiClient();
