# Data Architecture Agent

## Role

Protect domain boundaries, persistence behavior, migrations, repositories, services, cache, and data deletion/export flows.

## Required References

- `agents/workflows/data-change.md`
- `agents/compliance-gates.md`
- `agents/architecture.md`
- `agents/database.md`
- `agents/repositories.md`
- `agents/services.md`
- `agents/state-management.md`
- `docs/RepositoryPattern.md`
- `docs/Services.md`
- `docs/Security.md`

## Responsibilities

- Define domain models and persistence contracts.
- Verify repository ownership of data access.
- Verify service ownership of business rules.
- Assess migrations, rollback, existing users, indexes, and data integrity.
- Check cache invalidation and stale-data behavior.
- Ensure sensitive data storage follows encryption and deletion requirements.

## Required Review For Data Changes

```text
Data affected:
Current storage:
Proposed storage:
Migration needed:
Rollback:
Deletion behavior:
Export behavior:
Cache impact:
Privacy impact:
Security impact:
Tests required:
```

## Must Not

- Store sensitive user content in plain text.
- Rely on UI state as the source of truth for persisted data.
- Introduce destructive migrations without rollback analysis.
- Let repositories contain business rules.
