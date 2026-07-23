import { success, failure, tryCatch, map, chain, unwrap } from '@/shared/utils/result';
import { AppError, ErrorCodes } from '@/shared/errors/AppError';
import type { ArchitectureError } from '@/shared/types/architecture';

describe('result utilities', () => {
  describe('success', () => {
    it('creates a successful result with the given data', () => {
      const result = success(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('creates a successful result with object data', () => {
      const data = { id: 1, name: 'test' };
      const result = success(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe('failure', () => {
    it('creates a failed result with the given error', () => {
      const error: ArchitectureError = {
        code: ErrorCodes.NOT_FOUND,
        message: 'Item not found',
      };
      const result = failure(error);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual(error);
      }
    });

    it('creates a failed result with an AppError', () => {
      const appError = new AppError(ErrorCodes.VALIDATION, 'Invalid input');
      const result = failure(appError);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(appError);
        expect(result.error.code).toBe(ErrorCodes.VALIDATION);
      }
    });
  });

  describe('tryCatch', () => {
    it('returns a success result when the promise resolves', async () => {
      const promise = Promise.resolve('hello');
      const result = await tryCatch(promise);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('returns a failure result when the promise rejects with an AppError', async () => {
      const appError = new AppError(ErrorCodes.NETWORK, 'Network failure', {
        details: { statusCode: 500 },
      });
      const promise = Promise.reject(appError);
      const result = await tryCatch(promise);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCodes.NETWORK);
        expect(result.error.message).toBe('Network failure');
        expect(result.error.details).toEqual({ statusCode: 500 });
      }
    });

    it('returns a failure result when the promise rejects with a generic Error', async () => {
      const promise = Promise.reject(new Error('Something went wrong'));
      const result = await tryCatch(promise);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCodes.UNKNOWN);
        expect(result.error.message).toBe('Something went wrong');
      }
    });

    it('returns a failure result with a custom error message for non-AppError rejects', async () => {
      const promise = Promise.reject(new Error('original error'));
      const result = await tryCatch(promise, 'Custom error message');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCodes.UNKNOWN);
        expect(result.error.message).toBe('Custom error message');
      }
    });

    it('returns a failure result for non-Error rejects', async () => {
      const promise = Promise.reject('string error');
      const result = await tryCatch(promise, 'Non-error reject');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCodes.UNKNOWN);
        expect(result.error.message).toBe('Non-error reject');
      }
    });
  });

  describe('map', () => {
    it('transforms the data of a successful result', () => {
      const result = success(5);
      const mapped = map(result, (x) => x * 2);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(10);
      }
    });

    it('preserves the error of a failed result', () => {
      const error: ArchitectureError = {
        code: ErrorCodes.NOT_FOUND,
        message: 'Not found',
      };
      const result = failure<ArchitectureError>(error);
      const mapped = map(result, (x: never) => x);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toEqual(error);
      }
    });

    it('transforms the data type correctly', () => {
      const result = success({ name: 'test' });
      const mapped = map(result, (data) => data.name.toUpperCase());

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe('TEST');
      }
    });
  });

  describe('chain', () => {
    it('chains a successful result into a new result', () => {
      const result = success(3);
      const chained = chain(result, (x) => success(x * 3));

      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.data).toBe(9);
      }
    });

    it('preserves failure through a chain', () => {
      const error: ArchitectureError = {
        code: ErrorCodes.NOT_FOUND,
        message: 'Initial error',
      };
      const result = failure<ArchitectureError>(error);
      const chained = chain(result, (x: never) => success(x));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toEqual(error);
      }
    });

    it('chains into a failure from a success', () => {
      const result = success(10);
      const error: ArchitectureError = {
        code: ErrorCodes.VALIDATION,
        message: 'Chained error',
      };
      const chained = chain(result, () => failure(error));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toEqual(error);
      }
    });
  });

  describe('unwrap', () => {
    it('returns the data from a successful result', () => {
      const result = success('value');
      expect(unwrap(result)).toBe('value');
    });

    it('throws an AppError when unwrapping a failed result', () => {
      const error: ArchitectureError = {
        code: ErrorCodes.NOT_FOUND,
        message: 'Missing data',
      };
      const result = failure(error);

      expect(() => unwrap(result)).toThrow(AppError);
      expect(() => unwrap(result)).toThrow('Missing data');
    });
  });
});
