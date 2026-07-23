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
import type { NetworkError } from '@/shared/errors/AppError';

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
        throw parsed.error;
      }
    }

    // Execute the request
    const result = await networkService[method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete']<unknown>(
      url,
      method === 'GET' ? options?.params : options?.data,
      options?.signal
    );

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
          error: new (require('@/shared/errors/AppError').NetworkError)(
            'Invalid response format'
          ),
        };
      }
      return { success: true, data: parsed.data };
    }

    return result as Result<TResponse, NetworkError>;
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