# Output Examples

Use these as compact examples for final responses. Keep the answer proportional to the task and include only evidence that applies.

## UI Change

```text
Changed:
- Updated the calendar header to use the shared accent button.
- Preserved the existing drawer and month navigation behavior.

Validation:
- npm run typecheck
- npm run lint
- Calendar component tests

Gates applied:
- UI change: Design Agent, Expo Engineer, accessibility check

Residual risk:
- Not verified on physical Android device.

Human review needed:
- No
```

## Bug Fix

```text
Changed:
- Fixed the stale diary fallback by reading the cached entry before showing the not-found state.
- Added a regression test for delayed entry loading.

Validation:
- npm run typecheck
- npm run lint
- Diary entry tests

Gates applied:
- Bug fix affecting loading/cache: QA, Data Architecture

Residual risk:
- Manual navigation timing should still be checked on a simulator.

Human review needed:
- No
```

## Data Change

```text
Changed:
- Added a profile repository method and preserved deletion/export coverage.
- Updated the service contract with strict input validation.

Validation:
- npm run typecheck
- npm run lint
- Profile repository and service tests

Gates applied:
- Repository/service change: Data Architecture, Security and Privacy, QA

Residual risk:
- Existing encrypted backups were not migrated by this change.

Human review needed:
- No
```

## Release Gate

```text
Release candidate:
- 1.4.0 build 42

Validation:
- typecheck, lint, full test suite, iOS preview build

QA status:
- Passed smoke and regression scope

Security status:
- No new sensitive data flows

Privacy status:
- Store disclosures unchanged

Decision:
- GO WITH CAVEATS

Required follow-up:
- Android physical-device smoke test before Play submission
```
