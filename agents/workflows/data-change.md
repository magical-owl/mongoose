# Data Change Workflow

## Use When

The request changes domain models, persistence, repositories, services, database shape, cache behavior, import/export, deletion, backup, restore, migrations, or privacy-sensitive data flow.

Use Gated Path for destructive operations, sensitive storage, deletion/export/backup/restore, migrations, encryption, or cache behavior that can affect user trust.

## Required Guides

1. `agents/00-orchestrator.md`
2. `agents/compliance-gates.md`
3. `agents/04-data-architecture.md`
4. `agents/07-security-privacy-reviewer.md`
5. `agents/repositories.md`
6. `agents/services.md`
7. `agents/database.md`
8. `agents/testing.md`

## Workflow

1. Identify affected data and current owner.
2. Confirm the correct layer for the change.
3. Define migration and rollback needs.
4. Check export, deletion, backup, restore, cache, and stale-data behavior.
5. Update service/repository contracts with strict types.
6. Add tests for success, failure, migration, and deletion/export impact where applicable.
7. Add an ADR from `docs/adr/0000-template.md` when storage, migration, encryption, backup, sync, or deletion strategy changes.
8. Run validation.
9. Apply `agents/review-checklist.md` before reporting completion.

## Required Review Format

```text
Data affected:
Current storage:
Proposed storage:
Migration:
Rollback:
Deletion behavior:
Export behavior:
Cache impact:
Privacy impact:
Security impact:
Tests:
```

## Required Checks

- `npm run typecheck`
- `npm run lint`
- Repository/service/cache tests.
- Data deletion/export tests when affected.

## Output Example

```text
Data affected:
- Profile display name and avatar URI.

Deletion behavior:
- Included in profile purge path.

Export behavior:
- Included in JSON export metadata.

Validation:
- npm run typecheck
- npm run lint
- Profile repository/service tests

Residual risk:
- Existing encrypted backups were not migrated by this change.
```

## Done When

- Sensitive data remains protected.
- Existing users and persisted data are handled.
- Deletion/export behavior still matches user rights requirements.
- Cache and loading behavior are predictable.
- ADR exists for durable data architecture decisions.
