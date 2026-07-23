/**
 * Base Repository Interface
 *
 * The repository layer owns persistence. All data access goes through repositories.
 * No other layer should access storage, API, or data sources directly.
 *
 * Repositories:
 * - Abstract storage/API details from the rest of the application
 * - Provide a clean interface for CRUD operations
 * - Own the mapping between DTOs and domain entities
 * - Can combine multiple data sources (API + local storage)
 */

import type {
  BaseEntity,
  EntityId,
  FindOptions,
  PaginatedResponse,
  Result,
  ArchitectureError,
} from '@/shared/types/architecture';

/**
 * Base repository interface for standard CRUD operations.
 * Feature-specific repositories should extend this interface.
 */
export interface IRepository<T extends BaseEntity> {
  /**
   * Find a single entity by its ID.
   */
  findById(id: EntityId): Promise<Result<T, ArchitectureError>>;

  /**
   * Find all entities matching the given options.
   */
  findAll(options?: FindOptions<Partial<T>>): Promise<Result<T[], ArchitectureError>>;

  /**
   * Find entities with pagination.
   */
  findPaginated(
    options?: FindOptions<Partial<T>>
  ): Promise<Result<PaginatedResponse<T>, ArchitectureError>>;

  /**
   * Create a new entity.
   */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<T, ArchitectureError>>;

  /**
   * Update an existing entity.
   */
  update(id: EntityId, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Result<T, ArchitectureError>>;

  /**
   * Delete an entity by its ID.
   */
  delete(id: EntityId): Promise<Result<void, ArchitectureError>>;

  /**
   * Check if an entity exists.
   */
  exists(id: EntityId): Promise<Result<boolean, ArchitectureError>>;

  /**
   * Count entities matching the given filters.
   */
  count(filters?: Partial<T>): Promise<Result<number, ArchitectureError>>;
}