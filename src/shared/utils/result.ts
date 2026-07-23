/**
 * Result Helper Utilities
 *
 * Helper functions for working with the Result discriminated union type.
 */

import type { Result, ArchitectureError } from '@/shared/types/architecture';
import { AppError, ErrorCodes } from '@/shared/errors/AppError';

/**
 * Create a successful Result.
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true as const, data };
}

/**
 * Create a failed Result.
 */
export function failure<E = ArchitectureError>(error: E): Result<never, E> {
  return { success: false as const, error };
}

/**
 * Wrap a promise in a Result, catching any errors.
 */
export async function tryCatch<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<Result<T, ArchitectureError>> {
  try {
    const data = await promise;
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.toArchitectureError());
    }
    return failure({
      code: ErrorCodes.UNKNOWN,
      message: errorMessage ?? (error instanceof Error ? error.message : 'An unknown error occurred'),
      cause: error,
    });
  }
}

/**
 * Unwrap a Result, throwing if it's a failure.
 * Use sparingly — prefer pattern matching on Result.
 */
export function unwrap<T>(result: Result<T, ArchitectureError>): T {
  if (!result.success) {
    throw new AppError(
      ErrorCodes.UNKNOWN,
      result.error.message,
      { cause: result.error }
    );
  }
  return result.data;
}

/**
 * Map over the success value of a Result.
 */
export function map<T, U, E = ArchitectureError>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (!result.success) {
    return result as unknown as Result<U, E>;
  }
  return success(fn(result.data));
}

/**
 * Map over the error value of a Result.
 */
export function mapError<T, E1, E2>(
  result: Result<T, E1>,
  fn: (error: E1) => E2
): Result<T, E2> {
  if (!result.success) {
    return failure(fn(result.error));
  }
  return result;
}

/**
 * Chain operations that return Results.
 */
export function chain<T, U, E = ArchitectureError>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (!result.success) {
    return result as unknown as Result<U, E>;
  }
  return fn(result.data);
}