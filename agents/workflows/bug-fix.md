# Bug Fix Workflow

## Use When

The request describes broken, delayed, inconsistent, crashing, clipped, overlapping, stale, missing, or unexpected behavior.

Use Fast Path when the bug is narrow, reversible, and has no sensitive data, storage, dependency, AI, auth, payment, or release impact.

## Required Guides

1. `agents/00-orchestrator.md`
2. `agents/compliance-gates.md`
3. `agents/03-expo-engineer.md`
4. `agents/06-qa-engineer.md`
5. `agents/testing.md`

Add `agents/07-security-privacy-reviewer.md` when the bug affects sensitive data, deletion, backup, restore, auth, permissions, logs, or AI.
Add `agents/10-performance-specialist.md` when the bug involves jank, blank screens, slow loading, memory pressure, list performance, images, animations, or navigation timing.
Add `agents/09-localization-reviewer.md` when the bug involves clipped text, wrong labels, date/time formatting, or untranslated copy.
Add `agents/13-responsive-layout-reviewer.md` when the bug appears on tablets, large screens, landscape, split-screen, fixed headers/footers, drawers, modals, grids, or full-bleed media.

## Workflow

1. Reproduce or locate the behavior from code and tests.
2. Identify the smallest responsible surface.
3. Check whether the bug is caused by stale data, async loading, layout math, navigation params, cache, state persistence, or platform behavior.
4. Make the narrowest fix that preserves nearby behavior.
5. Add a regression test when practical.
6. Run validation.
7. Apply `agents/review-checklist.md` before reporting completion.

## Bug Analysis Format

```text
Observed:
Expected:
Likely cause:
Affected files:
Fix:
Regression test:
Residual risk:
```

## Required Checks

- `npm run typecheck`
- `npm run lint`
- Relevant unit/component tests.

## Output Example

```text
Observed:
- Entry briefly showed a not-found state before cached data loaded.

Fix:
- Read cached entry before rendering the fallback state.

Validation:
- npm run typecheck
- npm run lint
- Diary entry cache tests

Residual risk:
- Manual timing check still recommended on simulator.
```

## Done When

- The reported bug is addressed.
- The fix is scoped to the affected behavior.
- The final response states what was verified and any remaining test gap.
