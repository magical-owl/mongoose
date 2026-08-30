# AI Agent Repository Instructions

Start with [`agents/04-data-architecture.md`](04-data-architecture.md), [`agents/workflows/data-change.md`](workflows/data-change.md), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed repository reference.

## Always Implement IRepository Interface
- Every data repository must implement a well-defined `IRepository<T>` interface.
- The interface should declare standard CRUD operations: `getById`, `getAll`, `create`, `update`, `delete`.
- Method signatures must use the application's domain models, not raw database or API types.
- Example:
  ```typescript
  interface IRepository<T> {
    getById(id: string): Promise<T | null>;
    getAll(options?: QueryOptions): Promise<T[]>;
    create(input: CreateInput<T>): Promise<T>;
    update(id: string, input: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
  }
  ```

## Compose Multiple Data Sources
- Implement repository patterns that combine remote (API) and local (cache/database) sources.
- Use an offline-first strategy: read from local cache first, then sync with remote in the background.
- For write operations, attempt remote sync first; fall back to queueing the write locally if offline.
- Expose data source composition clearly so the caller understands the staleness/refresh behavior.

## Handle Offline Scenarios
- Detect network connectivity using `NetInfo` and expose connection status to the repository layer.
- When offline, serve data exclusively from the local cache.
- Queue mutations (creates, updates, deletes) in a local store and replay them when connectivity returns.
- Handle conflict resolution (e.g., last-write-wins, server-authoritative) and communicate conflicts to the UI.
- Provide a `isSyncing` observable so UI can show sync indicators.

## Implement Proper Error Handling
- Wrap all data source calls in try/catch blocks with typed error handling.
- Distinguish between network errors, server errors, authentication errors, and data corruption errors.
- Never swallow errors silently; always log (with PII stripped) and re-throw or return a typed error result.
- Use a Result type pattern for repository methods to force callers to handle success and failure paths:
  ```typescript
  type Result<T> = { success: true; data: T } | { success: false; error: AppError };
  ```

## Write Tests for Each Method
- Write unit tests for every repository method covering: success path, empty result, network error, parse error, offline mode.
- Mock data sources (API client, local database) to isolate the repository logic.
- Test that the correct data source is queried based on connectivity state.
- Verify that queued offline mutations are replayed in the correct order when back online.

## Document the Data Flow
- Include a clear comment or README section at the top of each repository file describing:
  - Which data sources are composed (e.g., "Remote API + SQLite cache").
  - The staleness policy (e.g., "Cache is valid for 5 minutes; stale data triggers background refresh").
  - Conflict resolution strategy (e.g., "Server wins; local changes are discarded on conflict").
- Use JSDoc or TSDoc on each public method to document parameters, return types, and error conditions.
