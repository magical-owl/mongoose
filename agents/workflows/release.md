# Release Workflow

## Use When

The request prepares, audits, builds, submits, or gates a release candidate for TestFlight, App Store, Google Play, internal testing, or production OTA.

## Required Guides

1. `agents/00-orchestrator.md`
2. `agents/compliance-gates.md`
3. `agents/08-release-gatekeeper.md`
4. `agents/06-qa-engineer.md`
5. `agents/07-security-privacy-reviewer.md`
6. `agents/09-localization-reviewer.md` when store metadata, release notes, screenshots, onboarding, paywall copy, or user-facing copy changed.
7. `agents/10-performance-specialist.md` when release includes heavy UI, startup, list, animation, image, or loading changes.
8. `agents/11-monetization-store-commerce-reviewer.md` when paid features, IAP, subscriptions, entitlements, or restore purchases changed.
9. `agents/12-ai-prompt-evaluator.md` when AI prompts, provider behavior, or user-visible AI output changed.
10. `agents/13-responsive-layout-reviewer.md` when release readiness includes tablet screenshots, large-screen support, landscape behavior, or split-screen behavior.
11. `agents/release.md`
12. `docs/ReleaseChecklist.md`
13. `docs/ProductionReadiness.md`
14. `docs/Deployment.md`
15. `docs/Versioning.md`

## Workflow

1. Identify release candidate, branch, version, build number, runtime, and target platform.
2. Confirm code quality gates passed.
3. Confirm QA scope and evidence.
4. Confirm security/privacy review for changed data flows.
5. Confirm IP/assets and store metadata match app behavior.
6. Confirm rollback plan.
7. Produce release decision.
8. Apply `agents/review-checklist.md` for changed areas with unresolved risk.

## Gate Format

```text
Release candidate:
Changed areas:
Validation:
QA status:
Security status:
Privacy status:
IP/assets status:
Accessibility status:
Store readiness:
Rollback plan:
Decision:
Required follow-up:
```

## Required Checks

- Full test suite.
- Lint and typecheck.
- EAS/build validation appropriate to the release target.
- Store/privacy/security checklist review.

## Output Example

```text
Release candidate:
- 1.4.0 build 42

Validation:
- typecheck, lint, full tests, iOS preview build

Decision:
- GO WITH CAVEATS

Required follow-up:
- Android physical-device smoke test before Play submission.
```

## Done When

- Gate decision is `GO`, `GO WITH CAVEATS`, or `NO-GO`.
- Evidence is recorded.
- Human owner has unresolved release risks in front of them.
