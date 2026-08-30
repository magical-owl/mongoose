# AI Agent Documentation Instructions

Start with [`agents/00-orchestrator.md`](00-orchestrator.md), the relevant workflow in [`agents/workflows/`](workflows/), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed documentation reference.

## Documentation Philosophy

Documentation is code. It is subject to the same review process, the same quality standards, and the same merge requirements as source code. Every PR that changes behavior must update the relevant documentation in the same PR.

## JSDoc/TSDoc

### Where JSDoc Is Required

- Every **public function or method** exported from a module.
- Every **interface** and **type** that is part of a module's public API.
- Every **class** constructor and public method.
- Every **custom hook**.
- Every **Zod schema** that defines input validation for a service method.

### JSDoc Format

Use TSDoc (`/** ... */`) style — not the single-line `//` comment style for API docs.

```typescript
/**
 * Validates user credentials and returns a session if valid.
 *
 * @param input - The login credentials (email + password).
 * @returns A `Result` containing either a `Session` on success or a `ServiceError`.
 *
 * @throws Never throws. All errors are returned as `ServiceError` types.
 *
 * @example
 * const result = await authService.login({ email: 'user@example.com', password: 'secret' });
 * if (result.ok) { console.log(result.data.sessionToken); }
 */
async login(input: LoginInput): Promise<Result<Session>>;
```

### JSDoc Rules

- **@param** for every parameter — include description and type context if not obvious.
- **@returns** — describe the return value, especially for `Result<T>` types.
- **@throws** — document only if the function actually throws. Service methods returning `Result` should NOT throw.
- **@example** — include for non-obvious usage, but keep it concise.
- No JSDoc for internal/private functions — use inline comments if needed.
- No JSDoc for trivial getters/setters — the name should be sufficient.

## README Files

### When a README Is Required

- Every **feature folder** (`src/features/<feature>/README.md`).
- Every **shared module** folder (`src/shared/components/`, `src/shared/utils/`).
- The **project root** (`README.md` — already exists, update as needed).

### Feature README Template

```markdown
# Feature: <Feature Name>

## Overview

<!-- 2-3 sentences describing what this feature does and when it's used. -->

## Architecture

<!-- Diagram or description of how this feature fits into the layered architecture. -->

### Layers Used

- **Screens:** `<Feature>Screen` — entry point, composes components.
- **Components:** `<Feature>Card`, `<Feature>Form` — reusable UI pieces.
- **Hooks:** `use<Feature>` — bridges service to state.
- **Services:** `<Feature>Service` — business logic, validation, orchestration.
- **Repositories:** `<Feature>Repository` — data access (API + cache).

## Public API

<!-- What other features can import from this feature's barrel export (index.ts). -->

| Export | Type | Description |
|--------|------|-------------|
| `use<Feature>` | Hook | Returns `{ data, isLoading, error, refetch }` |
| `<Feature>Screen` | Component | Full screen component for navigation |

## Dependencies

<!-- What this feature depends on (other features, shared modules, external packages). -->

- `@services/` — AuthService (for user session)
- `@shared/components/ui` — Button, Text, Card

## State Management

<!-- How state is managed for this feature. -->

- **Server state:** TanStack Query — `<Feature>List`, `<Feature>Detail`
- **Client state:** Zustand store — `use<Feature>Store` (for UI state only)
- **Persistence:** MMKV cache via repository layer

## Error States

<!-- Document all error states the user might encounter. -->

| Error | UI Handling |
|-------|------------|
| Network unavailable | Offline banner + cached data fallback |
| Validation error | Inline form field errors |
| Server error | Error toast with retry button |
| Not found | Empty state screen with CTA |

## Testing

<!-- What tests exist and how to run them. -->

```bash
npm run test -- --testPathPattern="<Feature>"
```

## Related ADRs

<!-- Links to relevant ADRs. -->

- `ADR-0023: Feature-First Architecture` at `docs/adr/0023-feature-first-architecture.md`
```

## Architecture Decision Records (ADRs)

### When to Write an ADR

- Introducing a new pattern, library, or architectural approach.
- Changing the folder structure, dependency rules, or build system.
- Deciding between significant competing approaches.
- Adding a new integration with an external system.
- Any decision that will be difficult to reverse.

### ADR Location and Naming

- **Location:** `docs/adr/NNNN-title-with-hyphens.md`
- **Numbering:** Sequential, starting from 0001. Check the ADR index for the next number.
- **Naming:** kebab-case matching the title.

### ADR Template

```markdown
# ADR-NNNN: Title

## Status

[Proposed | Accepted | Deprecated | Superseded]

*Superseded by `ADR-NNNN` at `NNNN-new-title.md` if applicable.*

## Context

<!-- Describe the problem, constraints, and forces at play. Why is this decision needed? What alternatives were considered? -->

## Decision

<!-- State the decision clearly. What are we doing? -->

## Consequences

<!-- Positive, negative, and neutral consequences. What trade-offs are we accepting? -->

## Alternatives Considered

### Alternative 1: <Brief description>

**Pros:**
- ...

**Cons:**
- ...

## References

- Links to relevant issues, PRs, discussions, or documents.
- Link to related ADRs.
```

### ADR Lifecycle Rules

1. **Propose** in a branch `adr/NNNN-title`.
2. **Review** by at least 2 engineers.
3. **Accept** by merging to `develop`.
4. **Never edit** an accepted ADR. If the decision changes, write a new ADR that supersedes it.
5. **Update the index** in `docs/adr/INDEX.md` when adding a new ADR.

## Changelog Entries

### When to Add a Changelog Entry

- Every PR that introduces a user-facing change.
- Every PR that changes the public API of a feature or shared module.
- Every PR that fixes a bug.
- Every PR that adds or removes a dependency.
- Every PR that changes the build or deployment process.
- Every PR that deprecates functionality.
- Every security fix.

### Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format in `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- New feature X with support for Y (#123)

### Changed
- Upgraded dependency Z from v1 to v2 (#124)

### Fixed
- Bug where login would crash on slow networks (#125)

### Deprecated
- Legacy onboarding flow will be removed in v2.0 (#126)

### Removed
- Deprecated analytics event tracking (#127)

### Security
- Fixed XSS vulnerability in profile bio rendering (#128)
```

### Changelog Entry Rules

- Each entry references the PR or issue number in parentheses.
- Entries are grouped by category (Added, Changed, Fixed, etc.).
- Categories are ordered as shown above.
- Within a category, entries are ordered by relevance, not chronologically.
- Write for end-users and integrators — avoid internal implementation details.

## Inline Code Comments

### When to Inline Comment

- **Non-obvious logic** — a complex algorithm, a workaround for a third-party bug, a performance optimization.
- **Edge cases** — why a particular edge case is handled the way it is.
- **Type assertions** — why an `as` cast or `!` non-null assertion is safe.
- **ts-expect-error** — what the type error is and why it's acceptable.
- **Workarounds** — any code that exists to work around a known issue in a dependency.

### Inline Comment Format

```typescript
// The API returns dates as ISO strings in UTC, but the server sends them
// without a timezone suffix. We append 'Z' to ensure correct parsing.
const normalizedDate = rawDate.endsWith('Z') ? rawDate : `${rawDate}Z`;
```

```typescript
// This `as` cast is safe because Zod has already validated that the value
// matches `UserIdBrand` at the service boundary.
const userId = parsedData.id as UserId;
```

```typescript
// @ts-expect-error - The `@expo/vector-icons` types are missing the `size`
// prop on this icon variant, but it is accepted at runtime.
```

### When NOT to Inline Comment

- Obvious code — `const x = y + 1; // add 1 to y` adds no value.
- The "what" if the code already makes it clear — comment the "why".
- Instead of commenting bad code, refactor it to be self-documenting.

## Documentation Maintenance

### Pre-Merge Checklist

Before marking a PR as ready for review, verify:

- [ ] JSDoc added/updated for all new public APIs.
- [ ] Feature README created/updated if a new feature was added.
- [ ] ADR written if an architectural decision was made.
- [ ] Changelog updated if there is a user-facing change.
- [ ] Inline comments added for non-obvious logic.
- [ ] No stale comments — existing comments were reviewed and updated.

### Documentation Debt

- If you encounter undocumented code that you modify, add documentation as part of your change.
- If you encounter an ADR that is no longer accurate, write a new ADR superseding it.
- If you encounter a stale README, update it.
- Documentation debt is tech debt — address it in the same PR or create a follow-up issue.
