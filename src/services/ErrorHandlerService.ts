/**
 * Error Handler Service
 *
 * Centralized error handling for the application.
 * All errors should flow through this service for consistent handling,
 * logging, and user feedback.
 */

import { logger, LogLevel } from './LoggingService';
import { AppError, ErrorCodes } from '@/shared/errors/AppError';
import type { ArchitectureError } from '@/shared/types/architecture';

/**
 * Error severity levels for user-facing error handling.
 */
export enum ErrorSeverity {
  /** Silent — log only, no user feedback */
  SILENT = 'silent',
  /** Toast — show a brief notification */
  TOAST = 'toast',
  /** Alert — show a modal alert */
  ALERT = 'alert',
  /** Critical — show a full-screen error */
  CRITICAL = 'critical',
}

/**
 * Error handler configuration for specific error codes.
 */
export interface ErrorHandlerConfig {
  readonly severity: ErrorSeverity;
  readonly userMessage: string;
  readonly retryable: boolean;
}

/**
 * Default error handling configurations.
 */
const DEFAULT_ERROR_HANDLING: Record<string, ErrorHandlerConfig> = {
  [ErrorCodes.NETWORK]: {
    severity: ErrorSeverity.TOAST,
    userMessage: 'Unable to connect. Please check your internet connection.',
    retryable: true,
  },
  [ErrorCodes.TIMEOUT]: {
    severity: ErrorSeverity.TOAST,
    userMessage: 'The request timed out. Please try again.',
    retryable: true,
  },
  [ErrorCodes.NOT_FOUND]: {
    severity: ErrorSeverity.TOAST,
    userMessage: 'The requested item was not found.',
    retryable: false,
  },
  [ErrorCodes.VALIDATION]: {
    severity: ErrorSeverity.TOAST,
    userMessage: 'Please check your input and try again.',
    retryable: false,
  },
  [ErrorCodes.UNAUTHORIZED]: {
    severity: ErrorSeverity.ALERT,
    userMessage: 'Your session has expired. Please sign in again.',
    retryable: false,
  },
  [ErrorCodes.BUSINESS_RULE]: {
    severity: ErrorSeverity.TOAST,
    userMessage: 'This action cannot be completed.',
    retryable: false,
  },
  [ErrorCodes.UNKNOWN]: {
    severity: ErrorSeverity.ALERT,
    userMessage: 'Something went wrong. Please try again.',
    retryable: true,
  },
};

/**
 * Error handler service for consistent error management.
 */
export class ErrorHandlerService {
  private configs: Record<string, ErrorHandlerConfig>;

  constructor(customConfigs?: Record<string, Partial<ErrorHandlerConfig>>) {
    this.configs = { ...DEFAULT_ERROR_HANDLING };

    if (customConfigs) {
      for (const [code, config] of Object.entries(customConfigs)) {
        if (this.configs[code]) {
          this.configs[code] = { ...this.configs[code], ...config };
        }
      }
    }
  }

  /**
   * Handle an error with the appropriate severity and user feedback.
   */
  public handle(error: unknown, context?: string): ErrorHandlerConfig {
    const architectureError = this.normalizeError(error);
    const config = this.getConfig(architectureError.code);

    // Log the error
    const logLevel = config.severity === ErrorSeverity.SILENT
      ? LogLevel.DEBUG
      : config.severity === ErrorSeverity.CRITICAL
        ? LogLevel.ERROR
        : LogLevel.WARN;

    logger.log(
      logLevel,
      context ?? 'ErrorHandler',
      architectureError.message,
      {
        code: architectureError.code,
        details: architectureError.details,
        severity: config.severity,
      }
    );

    return config;
  }

  /**
   * Get the user-facing message for an error.
   */
  public getUserMessage(error: unknown): string {
    const architectureError = this.normalizeError(error);
    return this.getConfig(architectureError.code).userMessage;
  }

  /**
   * Check if an error is retryable.
   */
  public isRetryable(error: unknown): boolean {
    const architectureError = this.normalizeError(error);
    return this.getConfig(architectureError.code).retryable;
  }

  /**
   * Normalize any error type to an ArchitectureError.
   */
  private normalizeError(error: unknown): ArchitectureError {
    if (error instanceof AppError) {
      return error.toArchitectureError();
    }

    if (error instanceof Error) {
      return {
        code: ErrorCodes.UNKNOWN,
        message: error.message,
        cause: error,
      };
    }

    return {
      code: ErrorCodes.UNKNOWN,
      message: 'An unexpected error occurred',
      cause: error,
    };
  }

  /**
   * Get the error handling config for a given error code.
   */
  private getConfig(code: string): ErrorHandlerConfig {
    return this.configs[code] ?? this.configs[ErrorCodes.UNKNOWN]!;
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const errorHandler = new ErrorHandlerService();