/**
 * API Client
 * 
 * Type-safe API client with automatic token injection,
 * error handling, and retry logic.
 */

import { ApiResponse, ApiError, ApiErrorCode } from '@/types';
import { authService } from '@/lib/firebase';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Request options
interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: Record<string, unknown> | FormData;
    skipAuth?: boolean;
    retries?: number;
}

// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Make authenticated request
     */
    async request<T>(
        method: HttpMethod,
        path: string,
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const { body, skipAuth = false, retries = MAX_RETRIES, ...init } = options;

        const url = `${this.baseUrl}${path}`;
        const headers = new Headers(init.headers);

        // Set content type for JSON
        if (body && !(body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        // Add auth token
        if (!skipAuth) {
            const token = await authService.getIdToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        const requestInit: RequestInit = {
            ...init,
            method,
            headers,
            body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        } as RequestInit;

        // Execute with retry logic
        let lastError: ApiError | undefined;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, requestInit);
                const data = await response.json();

                if (!response.ok) {
                    // Check if retryable
                    if (this.isRetryable(response.status) && attempt < retries - 1) {
                        await this.delay(RETRY_DELAY * Math.pow(2, attempt));
                        continue;
                    }

                    return {
                        success: false,
                        error: data.error || {
                            code: ApiErrorCode.INTERNAL_ERROR,
                            message: 'An unexpected error occurred',
                        },
                    };
                }

                return { success: true, data: data.data ?? data };
            } catch (error) {
                lastError = {
                    code: ApiErrorCode.EXTERNAL_SERVICE_ERROR,
                    message: error instanceof Error ? error.message : 'Network error',
                };

                if (attempt < retries - 1) {
                    await this.delay(RETRY_DELAY * Math.pow(2, attempt));
                    continue;
                }
            }
        }

        return {
            success: false,
            error: lastError || {
                code: ApiErrorCode.INTERNAL_ERROR,
                message: 'Max retries exceeded',
            },
        };
    }

    // Convenience methods
    async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('GET', path, options);
    }

    async post<T>(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('POST', path, { ...options, body: body as any });
    }

    async put<T>(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', path, { ...options, body: body as any });
    }

    async patch<T>(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', path, { ...options, body: body as any });
    }

    async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', path, options);
    }

    // Helpers
    private isRetryable(status: number): boolean {
        return status === 429 || status >= 500;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton
export const apiClient = new ApiClient();
