/**
 * Core Architecture Types
 *
 * This file defines the foundational types for the Clean Architecture layers.
 * These types enforce the dependency rules:
 * - Presentation → Hooks → Services → Repositories → Data Sources → Storage/API/AI
 * - No layer may import from a layer above it
 * - Data flows inward, dependencies flow outward
 */

// ---------------------------------------------------------------------------
// Layer-specific identifier types
// ---------------------------------------------------------------------------

/** Unique identifier for domain entities */
export type EntityId = string;

/** ISO 8601 timestamp string */
export type ISOTimestamp = string;

// ---------------------------------------------------------------------------
// Base entity types
// ---------------------------------------------------------------------------

/**
 * Base entity that all domain entities extend.
 * Every entity has an id, creation timestamp, and update timestamp.
 */
export interface BaseEntity {
  readonly id: EntityId;
  readonly createdAt: ISOTimestamp;
  readonly updatedAt: ISOTimestamp;
}

/**
 * A soft-deletable entity.
 */
export interface SoftDeletableEntity extends BaseEntity {
  readonly deletedAt: ISOTimestamp | null;
}

// ---------------------------------------------------------------------------
// Data transfer object types
// ---------------------------------------------------------------------------

/**
 * Base DTO for create operations.
 */
export interface CreateDTO<T> {
  data: T;
}

/**
 * Base DTO for update operations.
 */
export interface UpdateDTO<T> {
  id: EntityId;
  data: Partial<T>;
}

/**
 * Pagination parameters for list queries.
 */
export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  cursor?: string;
}

// ---------------------------------------------------------------------------
// Result type (discriminated union for error handling)
// ---------------------------------------------------------------------------

/**
 * A discriminated union representing success or failure.
 * This replaces try/catch at architectural boundaries.
 */
export type Result<T, E = ArchitectureError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Standard error structure for the architecture.
 */
export interface ArchitectureError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
}

// ---------------------------------------------------------------------------
// Repository query types
// ---------------------------------------------------------------------------

/**
 * Standard query options for repository find operations.
 */
export interface FindOptions<T = Record<string, unknown>> {
  filters?: Partial<T>;
  pagination?: PaginationParams;
  sort?: SortOption[];
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

/**
 * Standard service result with optional metadata.
 */
export interface ServiceResult<T> {
  data: T;
  metadata?: Record<string, unknown>;
}