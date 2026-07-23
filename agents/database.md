# Database Operations — Agent Instructions

## Core Principles

- **Always use the database abstraction layer.** Never write raw SQL queries unless the abstraction layer cannot express the operation. The abstraction layer provides connection pooling, prepared statements, and consistent error handling.
- **All database interactions must go through the service layer.** Controllers and API routes call services; services call repositories; repositories use the abstraction layer. Never access the database directly from a route handler or component.

## Migrations

- **Create one migration file per schema change.** Migration files must be timestamped (YYYYMMDDHHMMSS-description.sql) and placed in `src/db/migrations/`.
- **Every migration must be reversible.** Each `up` migration must have a corresponding `down` migration that undoes exactly the change. Test both directions before committing.
- **Use `up()` and `down()` functions** in the migration runner. The `down()` must restore the schema to its exact pre-migration state.
- **Never edit a migration that has already been applied** to a shared environment. Create a new migration to reverse or modify the change.
- **Naming convention:** `[timestamp]_[verb]_[table_name]_[description].sql` — e.g., `20250321143000_add_users_table.sql`.
- **Include schema version tracking** — the migration runner should record applied migrations in a `_migrations` table.

## Query Construction

- **Always use parameterized queries.** Never interpolate user input into SQL strings. Use `?` or `$1` placeholders depending on the database driver, and pass values as separate parameters.
- **Use named parameters** when a query has more than 3 parameters to improve readability.
- **Prefer the abstraction layer's query builder** for dynamic queries (filtering, sorting, pagination). Fall back to raw parameterized queries only when the builder cannot produce the needed SQL.
- **Always specify columns explicitly** in SELECT statements. Never use `SELECT *`.

## Indexing

- **Add indexes for all foreign key columns.** Indexes must be created in a migration, never manually.
- **Add composite indexes** for queries that filter or sort by multiple columns. Order columns in the index by selectivity (most selective first).
- **Use `CREATE INDEX CONCURRENTLY`** in production migrations to avoid table locking.
- **Monitor slow query logs** and add indexes proactively for queries that appear in the top 10 by execution time.
- **Avoid over-indexing.** Don't index columns with low cardinality (e.g., boolean flags) unless a specific query requires it.
- **Use partial indexes** for queries that filter on a subset of rows — e.g., `CREATE INDEX idx_active_users ON users (last_login) WHERE active = true`.

## Safe Migrations

- **Run migrations in a transaction** when the database supports DDL transactions. Group related schema changes into a single migration within the transaction.
- **Use `IF NOT EXISTS` / `IF EXISTS`** clauses to make migrations idempotent.
- **For large tables**, add columns with a default value of `NULL` (not a non-null default) to avoid table rewrites. Set the non-null constraint in a separate migration after backfilling data.
- **Break dangerous migrations into steps:**
  1. Add the new column or table (no downtime)
  2. Backfill data in batches (application continues working)
  3. Add constraints or drop old columns (deferred to low-traffic window)
- **Never `DROP` a column in the same migration that creates a replacement.** Use a multi-phase approach: add → backfill → migrate reads → drop.
- **Test migrations against a copy of production data** before deploying.

## Transactions

- **Wrap multi-statement write operations in transactions.** The abstraction layer must expose a `transaction()` method that handles begin/commit/rollback.
- **Keep transactions short.** Do not perform network calls (API requests, file uploads) inside a transaction.
- **Set a statement timeout** to prevent long-running queries from holding locks indefinitely.
- **Handle serialization failures** by retrying the transaction (up to 3 retries with exponential backoff).

## Error Handling

- **Catch database errors in the service layer** and wrap them in domain-specific error types. Never propagate raw database driver errors to API responses.
- **Log query parameters** in development environments only. Never log sensitive data (passwords, tokens, PII).
- **Use structured error codes:** `DB_CONNECTION_ERROR`, `DB_QUERY_TIMEOUT`, `DB_CONSTRAINT_VIOLATION`, `DB_DEADLOCK`.

## Connection Management

- **Use a connection pool** with configurable min/max size. Default: min=2, max=10. Adjust based on workload.
- **Implement health checks** that execute `SELECT 1` on a pooled connection every 30 seconds.
- **Handle disconnections gracefully.** The pool should automatically retry connections with exponential backoff (max 30 seconds).
- **Close all connections on application shutdown.** Register a graceful shutdown handler.
