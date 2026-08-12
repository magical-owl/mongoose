/**
 * Offline Service
 *
 * Queues write operations when offline and replays them when connectivity returns.
 * Provides conflict resolution hooks for handling data conflicts.
 */

import { logger } from './LoggingService';
import {
  database,
  type DatabaseRecord,
  type IDatabaseService,
} from '@/database/DatabaseService';

const TAG = 'OfflineService';
const QUEUE_COLLECTION = 'offline_queue';

/**
 * Offline operation types.
 */
export type OfflineOperationType = 'create' | 'update' | 'delete';

/**
 * Queued offline operation.
 */
export interface OfflineOperation<T = unknown> extends DatabaseRecord {
  readonly operationType: OfflineOperationType;
  readonly collection: string;
  readonly entityId?: string;
  readonly data: T;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly lastAttempt: number | null;
}

/**
 * Conflict resolution strategy.
 */
export type ConflictResolutionStrategy =
  | 'client_wins'
  | 'server_wins'
  | 'manual'
  | 'last_write_wins';

/**
 * Conflict resolution handler.
 */
export interface ConflictResolver<T = unknown> {
  readonly strategy: ConflictResolutionStrategy;
  resolve?: (local: T, remote: T) => Promise<T>;
}

/** Executes a queued operation for one collection against its remote data source. */
export type OfflineOperationExecutor = (
  operation: OfflineOperation
) => Promise<void>;

export interface OfflineReplaySummary {
  readonly succeeded: number;
  readonly failed: number;
}

/**
 * Offline service for queueing and replaying operations.
 */
export class OfflineService {
  private readonly database: IDatabaseService;
  private isOnline: boolean = true;
  private isReplaying: boolean = false;
  private conflictResolvers: Map<string, ConflictResolver> = new Map();
  private executors: Map<string, OfflineOperationExecutor> = new Map();
  private onReplayCallbacks: (() => void)[] = [];

  constructor(databaseService: IDatabaseService = database) {
    this.database = databaseService;
  }

  /**
   * Set the online/offline status.
   */
  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    logger.info(TAG, `Network status: ${isOnline ? 'online' : 'offline'}`);

    if (isOnline && !this.isReplaying) {
      void this.replayQueue().catch((error: unknown) => {
        logger.error(TAG, 'Offline queue replay failed unexpectedly', error as Error);
      });
    }
  }

  /**
   * Check if the device is online.
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Register a conflict resolver for a collection.
   */
  public registerConflictResolver(
    collection: string,
    resolver: ConflictResolver
  ): void {
    this.conflictResolvers.set(collection, resolver);
  }

  /**
   * Register the remote executor for a collection. An operation is never
   * removed from the queue until this executor resolves successfully.
   */
  public registerExecutor(
    collection: string,
    executor: OfflineOperationExecutor
  ): void {
    this.executors.set(collection, executor);
  }

  /**
   * Register a callback for when replay completes.
   */
  public onReplayComplete(callback: () => void): () => void {
    this.onReplayCallbacks.push(callback);
    return () => {
      this.onReplayCallbacks = this.onReplayCallbacks.filter(
        (registeredCallback) => registeredCallback !== callback
      );
    };
  }

  /**
   * Queue an operation for offline execution.
   */
  public async queueOperation<T>(
    operationType: OfflineOperationType,
    collection: string,
    data: T,
    entityId?: string,
    maxRetries: number = 3
  ): Promise<void> {
    const operation: Omit<OfflineOperation<T>, 'id' | 'createdAt' | 'updatedAt'> = {
      operationType,
      collection,
      entityId,
      data,
      retryCount: 0,
      maxRetries,
      lastAttempt: null,
    };

    this.database.create(QUEUE_COLLECTION, operation);
    logger.debug(TAG, `Operation queued: ${operationType} on ${collection}`, {
      entityId,
    });
  }

  /**
   * Get the count of pending operations.
   */
  public getPendingCount(): number {
    return this.database.getAll(QUEUE_COLLECTION).length;
  }

  /**
   * Clear all pending operations.
   */
  public clearQueue(): void {
    this.database.clearCollection(QUEUE_COLLECTION);
    logger.info(TAG, 'Offline queue cleared');
  }

  /**
   * Replay all queued operations.
   */
  public async replayQueue(): Promise<OfflineReplaySummary> {
    if (this.isReplaying || !this.isOnline) {
      return { succeeded: 0, failed: 0 };
    }

    this.isReplaying = true;
    logger.info(TAG, 'Replaying offline queue');

    const operations = this.database.getAll<OfflineOperation>(QUEUE_COLLECTION, {
      sort: { createdAt: 'asc' },
    });

    let successCount = 0;
    let failureCount = 0;

    try {
      for (const operation of operations) {
        const success = await this.replayOperation(operation);
        if (success) {
          this.database.delete(QUEUE_COLLECTION, operation.id);
          successCount++;
        } else {
          failureCount++;
        }
      }
    } finally {
      this.isReplaying = false;
    }

    logger.info(TAG, `Queue replay complete: ${successCount} succeeded, ${failureCount} failed`);

    this.onReplayCallbacks.forEach((callback) => callback());
    return { succeeded: successCount, failed: failureCount };
  }

  /**
   * Replay a single operation.
   */
  private async replayOperation(operation: OfflineOperation): Promise<boolean> {
    try {
      // Check for conflicts
      if (operation.entityId) {
        const resolver = this.conflictResolvers.get(operation.collection);
        if (resolver && resolver.strategy === 'server_wins') {
          // Skip local changes if server wins
          logger.debug(TAG, `Skipping operation due to server_wins strategy`, {
            collection: operation.collection,
            entityId: operation.entityId,
          });
          return true;
        }
      }

      const executor = this.executors.get(operation.collection);
      if (!executor) {
        throw new Error(`No offline executor registered for '${operation.collection}'`);
      }

      await executor(operation);
      logger.debug(TAG, `Replaying operation: ${operation.operationType}`, {
        collection: operation.collection,
        entityId: operation.entityId,
      });

      return true;
    } catch (error) {
      const updatedRetryCount = operation.retryCount + 1;

      this.database.update(QUEUE_COLLECTION, operation.id, {
        retryCount: updatedRetryCount,
        lastAttempt: Date.now(),
      } as Partial<OfflineOperation>);

      if (updatedRetryCount >= operation.maxRetries) {
        logger.error(
          TAG,
          `Operation failed after ${operation.maxRetries} retries`,
          error as Error,
          {
            collection: operation.collection,
            entityId: operation.entityId,
          }
        );
        return false;
      }

      return false;
    }
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const offlineService = new OfflineService();
