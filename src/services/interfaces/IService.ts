/**
 * Base Service Interface
 *
 * The service layer owns business rules and orchestration.
 * Services sit between hooks (presentation) and repositories (persistence).
 *
 * Services:
 * - Implement business logic and validation
 * - Orchestrate multiple repositories when needed
 * - Transform data between repositories and presentation
 * - Handle cross-cutting concerns (logging, analytics, error mapping)
 */

import type {
  BaseEntity,
  EntityId,
  Result,
  ArchitectureError,
  ServiceResult,
} from '@/shared/types/architecture';

/**
 * Base service interface for standard operations.
 * Feature-specific services should extend this interface.
 */
export interface IService<T extends BaseEntity> {
  /**
   * Get a single entity by ID.
   */
  getById(id: EntityId): Promise<Result<ServiceResult<T>, ArchitectureError>>;

  /**
   * Get all entities.
   */
  getAll(): Promise<Result<ServiceResult<T[]>, ArchitectureError>>;

  /**
   * Create a new entity with business logic applied.
   */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<ServiceResult<T>, ArchitectureError>>;

  /**
   * Update an existing entity with business logic applied.
   */
  update(
    id: EntityId,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<ServiceResult<T>, ArchitectureError>>;

  /**
   * Delete an entity by ID.
   */
  delete(id: EntityId): Promise<Result<ServiceResult<void>, ArchitectureError>>;
}