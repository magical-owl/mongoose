/**
 * Offline Service
 *
 * Queues write operations when offline and replays them when connectivity returns.
 * Provides conflict resolution hooks for handling data conflicts.
 */

import { logger } from './LoggingService';
import { database, type DatabaseRecord } from '@/database/DatabaseService';

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

/**
 * Offline service for queueing and replaying operations.
 */
export class OfflineService {
  private isOnline: boolean = true;
  private isReplaying: boolean = false;
  private conflictResolvers: Map<string, ConflictResolver> = new Map();
  private onReplayCallbacks: Array<() => void> = [];

  /**
   * Set the online/offline status.
   */
  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    logger.info(TAG, `Network status: ${isOnline ? 'online' : 'offline'}`);

    if (isOnline && !this.isReplaying) {
      this.replayQueue();
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
   * Register a callback for when replay completes.
   */
  public onReplayComplete(callback: () => void): void {
    this.onReplayCallbacks.push(callback);
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

    database.create(QUEUE_COLLECTION, operation);
    logger.debug(TAG, `Operation queued: ${operationType} on ${collection}`, {
      entityId,
    });
  }

  /**
   * Get the count of pending operations.
   */
  public getPendingCount(): number {
    return database.getAll(QUEUE_COLLECTION).length;
  }

  /**
   * Clear all pending operations.
   */
  public clearQueue(): void {
    database.clearCollection(QUEUE_COLLECTION);
    logger.info(TAG, 'Offline queue cleared');
  }

  /**
   * Replay all queued operations.
   */
  public async replayQueue(): Promise<void> {
    if (this.isReplaying || !this.isOnline) {
      return;
    }

    this.isReplaying = true;
    logger.info(TAG, 'Replaying offline queue');

    const operations = database.getAll<OfflineOperation>(QUEUE_COLLECTION, {
      sort: { createdAt: 'asc' },
    });

    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      const success = await this.replayOperation(operation);
      if (success) {
        database.delete(QUEUE_COLLECTION, operation.id);
        successCount++;
      } else {
        failureCount++;
      }
    }

    this.isReplaying = false;
    logger.info(TAG, `Queue replay complete: ${successCount} succeeded, ${failureCount} failed`);

    this.onReplayCallbacks.forEach((callback) => callback());
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

      // TODO: Execute the actual operation against the API
      // This would call the appropriate API endpoint based on operationType
      logger.debug(TAG, `Replaying operation: ${operation.operationType}`, {
        collection: operation.collection,
        entityId: operation.entityId,
      });

      return true;
    } catch (error) {
      const updatedRetryCount = operation.retryCount + 1;

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

      // Update retry count
      database.update(QUEUE_COLLECTION, operation.id, {
        retryCount: updatedRetryCount,
        lastAttempt: Date.now(),
      } as Partial<OfflineOperation>);

      return false;
    }
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const offlineService = new OfflineService();