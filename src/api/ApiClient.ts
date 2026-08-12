/**
 * API Client
 *
 * Typed API client that wraps NetworkService with endpoint configuration
 * and request/response transformation using Zod schemas.
 */

import { z } from 'zod';
import { networkService } from '@/services/NetworkService';
import { logger } from '@/services/LoggingService';
import type { Result } from '@/shared/types/architecture';
import { NetworkError } from '@/shared/errors/AppError';

const TAG = 'ApiClient';

/**
 * API endpoint configuration.
 */
export interface ApiEndpoint<TRequest, TResponse> {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly requestSchema?: z.ZodSchema<TRequest>;
  readonly responseSchema: z.ZodSchema<TResponse>;
}

/**
 * Typed API client for making requests to REST endpoints.
 */
export class ApiClient {
  private readonly basePath: string;

  constructor(basePath: string = '') {
    this.basePath = basePath;
  }

  /**
   * Execute a typed API request.
   */
  public async request<TRequest, TResponse>(
    endpoint: ApiEndpoint<TRequest, TResponse>,
    options?: {
      params?: Record<string, unknown>;
      data?: TRequest;
      signal?: AbortSignal;
    }
  ): Promise<Result<TResponse, NetworkError>> {
    const url = `${this.basePath}${endpoint.path}`;
    const method = endpoint.method;

    // Validate request data if schema provided
    if (endpoint.requestSchema && options?.data) {
      const parsed = endpoint.requestSchema.safeParse(options.data);
      if (!parsed.success) {
        logger.error(TAG, 'Request validation failed', undefined, {
          path: endpoint.path,
          errors: parsed.error.flatten(),
        });
        return {
          success: false,
          error: new NetworkError('Invalid request format', {
            details: { path: endpoint.path, errors: parsed.error.flatten() },
          }),
        };
      }
    }

    // Execute the request
    const result = await this.executeRequest(url, method, options);

    // Validate response data
    if (result.success) {
      const parsed = endpoint.responseSchema.safeParse(result.data);
      if (!parsed.success) {
        logger.error(TAG, 'Response validation failed', undefined, {
          path: endpoint.path,
          errors: parsed.error.flatten(),
        });
        return {
          success: false,
          error: new NetworkError('Invalid response format'),
        };
      }
      return { success: true, data: parsed.data };
    }

    return result as Result<TResponse, NetworkError>;
  }

  private async executeRequest<TRequest>(
    url: string,
    method: ApiEndpoint<TRequest, unknown>['method'],
    options?: {
      params?: Record<string, unknown>;
      data?: TRequest;
      signal?: AbortSignal;
    }
  ): Promise<Result<unknown, NetworkError>> {
    switch (method) {
      case 'GET':
        return networkService.get(url, options?.params, options?.signal);
      case 'POST':
        return networkService.post(url, options?.data, options?.signal);
      case 'PUT':
        return networkService.put(url, options?.data, options?.signal);
      case 'PATCH':
        return networkService.patch(url, options?.data, options?.signal);
      case 'DELETE':
        return networkService.delete(url, options?.signal);
    }
  }

  /**
   * Create a GET endpoint configuration.
   */
  public static get<TResponse>(
    path: string,
    responseSchema: z.ZodSchema<TResponse>
  ): ApiEndpoint<never, TResponse> {
    return { method: 'GET', path, responseSchema };
  }

  /**
   * Create a POST endpoint configuration.
   */
  public static post<TRequest, TResponse>(
    path: string,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema<TRequest>
  ): ApiEndpoint<TRequest, TResponse> {
    return { method: 'POST', path, requestSchema, responseSchema };
  }

  /**
   * Create a PUT endpoint configuration.
   */
  public static put<TRequest, TResponse>(
    path: string,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema<TRequest>
  ): ApiEndpoint<TRequest, TResponse> {
    return { method: 'PUT', path, requestSchema, responseSchema };
  }

  /**
   * Create a PATCH endpoint configuration.
   */
  public static patch<TRequest, TResponse>(
    path: string,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema<TRequest>
  ): ApiEndpoint<TRequest, TResponse> {
    return { method: 'PATCH', path, requestSchema, responseSchema };
  }

  /**
   * Create a DELETE endpoint configuration.
   */
  public static delete<TResponse>(
    path: string,
    responseSchema: z.ZodSchema<TResponse>
  ): ApiEndpoint<never, TResponse> {
    return { method: 'DELETE', path, responseSchema };
  }
}

/**
 * Singleton API client instance.
 */
export const apiClient = new ApiClient('/api/v1');
