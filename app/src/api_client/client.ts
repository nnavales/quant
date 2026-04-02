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
                const message = error.response?.data?.error || error.message || "Unknown error";
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
}

export const api = new ApiClient();
