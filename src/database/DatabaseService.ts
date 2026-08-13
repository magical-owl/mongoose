/**
 * Database Service
 *
 * Abstract database service with MMKV implementation.
 * Provides generic CRUD operations with type safety.
 */

import { createSafeMMKV } from './mmkvSafe';
import type { MMKV } from 'react-native-mmkv';
import { logger } from '@/services/LoggingService';

const TAG = 'DatabaseService';

/**
 * Database record with metadata.
 */
export interface DatabaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Query options for collection queries.
 */
export interface QueryOptions {
  sort?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

/**
 * Abstract database service interface.
 */
export abstract class IDatabaseService {
  abstract get<T extends DatabaseRecord>(collection: string, id: string): T | null;
  abstract getAll<T extends DatabaseRecord>(collection: string, options?: QueryOptions): T[];
  abstract create<T extends DatabaseRecord>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T;
  abstract update<T extends DatabaseRecord>(collection: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): T | null;
  abstract delete(collection: string, id: string): boolean;
  abstract clearCollection(collection: string): void;
  abstract clearAll(): void;
}

/**
 * MMKV implementation of the database service.
 */
export class MmkvDatabaseService extends IDatabaseService {
  private readonly storage: MMKV;

  constructor(storageId: string = 'meadow-db') {
    super();
    this.storage = createSafeMMKV({ id: storageId });
  }

  /**
   * Get a record by ID from a collection.
   */
  public get<T extends DatabaseRecord>(collection: string, id: string): T | null {
    try {
      const key = `${collection}:${id}`;
      const data = this.storage.getString(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(TAG, `Failed to get record from ${collection}`, error as Error, { id });
      return null;
    }
  }

  /**
   * Get all records from a collection with optional sorting and pagination.
   */
  public getAll<T extends DatabaseRecord>(collection: string, options?: QueryOptions): T[] {
    try {
      const keys = this.storage.getAllKeys().filter((key) => key.startsWith(`${collection}:`));
      const records: T[] = [];

      for (const key of keys) {
        const data = this.storage.getString(key);
        if (data) {
          records.push(JSON.parse(data) as T);
        }
      }

      // Apply sorting
      if (options?.sort) {
        const [field, direction] = Object.entries(options.sort)[0]!;
        records.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[field] as number;
          const bVal = (b as Record<string, unknown>)[field] as number;
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

      // Apply pagination
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? records.length;

      return records.slice(offset, offset + limit);
    } catch (error) {
      logger.error(TAG, `Failed to get all records from ${collection}`, error as Error);
      return [];
    }
  }

  /**
   * Create a new record in a collection.
   */
  public create<T extends DatabaseRecord>(
    collection: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): T {
    const now = Date.now();
    const id = `${now}-${Math.random().toString(36).substring(2, 9)}`;
    const record = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    const key = `${collection}:${id}`;
    this.storage.set(key, JSON.stringify(record));

    return record;
  }

  /**
   * Update an existing record.
   */
  public update<T extends DatabaseRecord>(
    collection: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): T | null {
    const existing = this.get<T>(collection, id);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    } as T;

    const key = `${collection}:${id}`;
    this.storage.set(key, JSON.stringify(updated));

    return updated;
  }

  /**
   * Delete a record by ID.
   */
  public delete(collection: string, id: string): boolean {
    const key = `${collection}:${id}`;
    if (!this.storage.contains(key)) {
      return false;
    }
    this.storage.remove(key);
    return true;
  }

  /**
   * Clear all records in a collection.
   */
  public clearCollection(collection: string): void {
    const keys = this.storage.getAllKeys().filter((key) =>
      key.startsWith(`${collection}:`)
    );
    for (const key of keys) {
      this.storage.remove(key);
    }
  }

  /**
   * Clear all stored data.
   */
  public clearAll(): void {
    this.storage.clearAll();
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const database = new MmkvDatabaseService();
