# Review Checklist

Use this checklist after implementation and before the final response. Select only the checks relevant to the change and the gates required by [`compliance-gates.md`](compliance-gates.md).

## Checklist Modes

| Mode | Use When | Required Sections |
|---|---|---|
| Fast Path | Small reversible change with no sensitive data, storage, dependency, AI, auth, payment, or release impact | Scope, relevant surface section, validation |
| Standard Path | Normal implementation work | Scope, architecture, TypeScript, touched surface sections, validation |
| Gated Path | Sensitive, persistent, AI, payment, dependency, release, or irreversible work | All relevant sections plus gate evidence and human-review status |

Do not include irrelevant checklist sections in the final response. Use them for the internal audit, then report only the evidence the user needs.

## Scope

- User request is satisfied without unrelated refactors.
- Changed files match the selected workflow.
- Existing behavior outside the requested surface is preserved.

## Architecture

- Route files remain composition roots.
- UI does not call storage, repositories, APIs, or AI directly.
- Hooks bridge React state to services.
- Services own business rules and validation.
- Repositories own persistence and cache behavior.
- Shared modules stay domain-neutral.

## TypeScript

- No `any`, implicit `any`, or unsafe casts.
- Public props and service/repository contracts are explicit.
- Nullable and loading states are handled.

## UI And Accessibility

- Theme tokens are used for color, spacing, typography, and radii.
- Text fits small screens and large text settings.
- Icon-only buttons have labels and roles.
- Selected, disabled, expanded, busy, and destructive states are exposed where relevant.
- Touch targets are usable on iOS and Android.

## Data, Security, And Privacy

- Sensitive user content is not logged.
- Sensitive storage remains encrypted or behind the existing secure storage boundary.
- Deletion, export, backup, restore, and cache behavior are preserved when affected.
- Permissions are requested only at point of need.
- AI processing remains opt-in and does not silently share user content.

## Tests And Validation

- Focused tests cover new behavior or regression risk.
- `npm run validate:architecture` passes when layer boundaries are touched.
- `npm run typecheck` passes when code changes.
- `npm run lint` passes when code changes.
- Relevant tests pass, or the final response states why they could not run.

## Final Response Evidence

Fast Path:

```text
Changed:
Validation:
Test gap:
```

Standard or Gated Path:

```text
Changed:
Validation:
Gates applied:
Residual risk:
Human review needed:
```
