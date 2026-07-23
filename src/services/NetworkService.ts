/**
 * Network Service
 *
 * Provides HTTP client functionality with interceptors, retry logic,
 * and authentication token management.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { config } from '@/config/ConfigService';
import { logger } from './LoggingService';
import { NetworkError } from '@/shared/errors/AppError';
import type { Result } from '@/shared/types/architecture';
import { success, failure } from '@/shared/utils/result';

const TAG = 'NetworkService';

/**
 * Retry configuration for failed requests.
 */
export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelay: number;
  readonly maxDelay: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Network service wrapping Axios with enterprise features.
 */
export class NetworkService {
  private readonly client: AxiosInstance;
  private readonly retryConfig: RetryConfig;
  private authToken: string | null = null;
  private refreshTokenPromise: Promise<string | null> | null = null;

  constructor(
    baseURL: string = config.apiBaseUrl,
    timeout: number = config.apiTimeout,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.retryConfig = { ...DEFAULT_RETRY, ...retryConfig };

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set the authentication token for subsequent requests.
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Set a custom refresh token function.
   */
  public setRefreshTokenHandler(
    handler: () => Promise<string | null>
  ): void {
    this.refreshTokenHandler = handler;
  }

  private refreshTokenHandler: (() => Promise<string | null>) | null = null;

  /**
   * Make a GET request.
   */
  public async get<T>(
    url: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<Result<T, NetworkError>> {
    return this.request<T>({ method: 'GET', url, params, signal });
  }

  /**
   * Make a POST request.
   */
  public async post<T>(
    url: string,
    data?: unknown,
    signal?: AbortSignal
  ): Promise<Result<T, NetworkError>> {
    return this.request<T>({ method: 'POST', url, data, signal });
  }

  /**
   * Make a PUT request.
   */
  public async put<T>(
    url: string,
    data?: unknown,
    signal?: AbortSignal
  ): Promise<Result<T, NetworkError>> {
    return this.request<T>({ method: 'PUT', url, data, signal });
  }

  /**
   * Make a PATCH request.
   */
  public async patch<T>(
    url: string,
    data?: unknown,
    signal?: AbortSignal
  ): Promise<Result<T, NetworkError>> {
    return this.request<T>({ method: 'PATCH', url, data, signal });
  }

  /**
   * Make a DELETE request.
   */
  public async delete<T>(
    url: string,
    signal?: AbortSignal
  ): Promise<Result<T, NetworkError>> {
    return this.request<T>({ method: 'DELETE', url, signal });
  }

  /**
   * Core request method with retry logic.
   */
  private async request<T>(
    config: AxiosRequestConfig & { method: string }
  ): Promise<Result<T, NetworkError>> {
    let lastError: NetworkError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return success(response.data);
      } catch (error) {
        lastError = this.handleError(error);

        // Don't retry if it's not a network/server error
        if (!this.isRetryableError(error)) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          logger.debug(TAG, `Retrying request (${attempt + 1}/${this.retryConfig.maxRetries})`, {
            url: config.url,
            delay,
          });
          await this.sleep(delay);
        }
      }
    }

    return failure(lastError!);
  }

  /**
   * Set up Axios interceptors.
   */
  private setupInterceptors(): void {
    // Request interceptor: add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 with token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.refreshTokenHandler) {
          try {
            // Prevent multiple simultaneous refresh attempts
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshTokenHandler();
            }

            const newToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            if (newToken) {
              this.authToken = newToken;
              // Retry the original request with the new token
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return this.client.request(error.config);
              }
            }
          } catch {
            this.refreshTokenPromise = null;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle an Axios error and convert to a NetworkError.
   */
  private handleError(error: unknown): NetworkError {
    if (error instanceof NetworkError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data
        ? typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data)
        : error.message;

      if (error.code === 'ECONNABORTED') {
        return new NetworkError('Request timed out', {
          details: { timeout: this.client.defaults.timeout },
          cause: error,
        });
      }

      if (!error.response) {
        return new NetworkError('Network request failed', {
          details: { status, url: error.config?.url },
          cause: error,
        });
      }

      return new NetworkError(message, {
        details: { status, url: error.config?.url },
        cause: error,
      });
    }

    return new NetworkError(
      error instanceof Error ? error.message : 'Unknown network error',
      { cause: error }
    );
  }

  /**
   * Check if an error is retryable.
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      // Retry on network errors and 5xx server errors
      if (!error.response) {
        return true;
      }
      const status = error.response.status;
      return status >= 500 && status < 600;
    }
    return false;
  }

  /**
   * Calculate exponential backoff delay.
   */
  private calculateBackoff(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    // Add jitter: ±25%
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const networkService = new NetworkService();