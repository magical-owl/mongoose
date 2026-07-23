/**
 * Data Source Interface
 *
 * Data sources are the outermost layer, providing access to:
 * - Remote APIs (HTTP/REST)
 * - Local storage (MMKV, SecureStore)
 * - Device APIs (Camera, Location, etc.)
 * - AI services
 *
 * Data sources:
 * - Handle raw communication with external systems
 * - Return typed responses (never raw HTTP responses)
 * - Handle serialization/deserialization
 * - Manage authentication tokens for API calls
 * - Are consumed exclusively by repositories
 */

import type { Result, ArchitectureError } from '@/shared/types/architecture';

/**
 * HTTP method types.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request configuration for API calls.
 */
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Base API data source interface.
 * Wraps HTTP client operations.
 */
export interface IApiDataSource {
  /**
   * Execute an HTTP request.
   */
  request<T>(
    config: ApiRequestConfig
  ): Promise<Result<T, ArchitectureError>>;

  /**
   * Set authentication token for subsequent requests.
   */
  setAuthToken(token: string | null): void;

  /**
   * Get the current base URL.
   */
  getBaseUrl(): string;
}

/**
 * Base storage data source interface.
 * Wraps local persistence operations.
 */
export interface IStorageDataSource {
  /**
   * Get a value by key.
   */
  get<T>(key: string): Promise<Result<T | null, ArchitectureError>>;

  /**
   * Set a value by key.
   */
  set<T>(key: string, value: T): Promise<Result<void, ArchitectureError>>;

  /**
   * Delete a value by key.
   */
  delete(key: string): Promise<Result<void, ArchitectureError>>;

  /**
   * Check if a key exists.
   */
  exists(key: string): Promise<Result<boolean, ArchitectureError>>;

  /**
   * Clear all stored values.
   */
  clear(): Promise<Result<void, ArchitectureError>>;
}

/**
 * Secure storage data source interface.
 * For sensitive data (tokens, keys, etc.).
 */
export interface ISecureStorageDataSource extends IStorageDataSource {
  /**
   * Check if the device supports secure storage.
   */
  isAvailable(): Promise<Result<boolean, ArchitectureError>>;
}

/**
 * AI data source interface.
 * Wraps AI service operations.
 */
export interface IAiDataSource {
  /**
   * Send a prompt to the AI service and get a response.
   */
  generate<T>(
    prompt: string,
    options?: AiRequestOptions
  ): Promise<Result<T, ArchitectureError>>;

  /**
   * Stream a response from the AI service.
   */
  stream(
    prompt: string,
    options?: AiRequestOptions
  ): AsyncIterable<Result<string, ArchitectureError>>;
}

/**
 * Options for AI requests.
 */
export interface AiRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  systemPrompt?: string;
}