/**
 * Application Error Types
 *
 * Standardized error types for the architecture layers.
 * Each layer has its own error type, following the dependency rule.
 */

import type { ArchitectureError } from '@/shared/types/architecture';

/**
 * Error codes organized by layer.
 */
export const ErrorCodes = {
  // Infrastructure errors
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  STORAGE: 'STORAGE_ERROR',
  SECURE_STORAGE: 'SECURE_STORAGE_ERROR',
  AI_SERVICE: 'AI_SERVICE_ERROR',

  // Repository errors
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE_ENTRY',
  REPOSITORY: 'REPOSITORY_ERROR',

  // Service errors
  VALIDATION: 'VALIDATION_ERROR',
  BUSINESS_RULE: 'BUSINESS_RULE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // General errors
  UNKNOWN: 'UNKNOWN_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Base application error.
 */
export class AppError extends Error implements ArchitectureError {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;
  }

  public toArchitectureError(): ArchitectureError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.cause,
    };
  }
}

/**
 * Network error (API calls, connectivity).
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    options?: { details?: Record<string, unknown>; cause?: unknown }
  ) {
    super(ErrorCodes.NETWORK, message, options);
    this.name = 'NetworkError';
  }
}

/**
 * Not found error (entity not found).
 */
export class NotFoundError extends AppError {
  constructor(
    entityName: string,
    id: string,
    options?: { details?: Record<string, unknown> }
  ) {
    super(ErrorCodes.NOT_FOUND, `${entityName} with id '${id}' not found`, {
      details: { entityName, entityId: id, ...options?.details },
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (invalid input data).
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    options?: { details?: Record<string, unknown>; cause?: unknown }
  ) {
    super(ErrorCodes.VALIDATION, message, options);
    this.name = 'ValidationError';
  }
}

/**
 * Business rule violation error.
 */
export class BusinessRuleError extends AppError {
  constructor(
    message: string,
    options?: { details?: Record<string, unknown> }
  ) {
    super(ErrorCodes.BUSINESS_RULE, message, options);
    this.name = 'BusinessRuleError';
  }
}

/**
 * Unauthorized error.
 */
export class UnauthorizedError extends AppError {
  constructor(
    message = 'Authentication required',
    options?: { details?: Record<string, unknown> }
  ) {
    super(ErrorCodes.UNAUTHORIZED, message, options);
    this.name = 'UnauthorizedError';
  }
}