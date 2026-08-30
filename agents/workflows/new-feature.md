# New Feature Workflow

## Use When

The request adds a new user capability, screen, onboarding step, settings area, data type, paid capability, AI behavior, or platform permission.

Use Standard or Gated Path by default. Use Fast Path only for very small feature toggles or copy-only additions with no new data, dependencies, permissions, AI, payments, or release risk.

## Required Guides

1. `agents/00-orchestrator.md`
2. `agents/compliance-gates.md`
3. `agents/01-product-manager.md`
4. `agents/02-design-agent.md` when UI is involved.
5. `agents/03-expo-engineer.md`
6. `agents/04-data-architecture.md` when data, cache, storage, sync, export, or deletion changes.
7. `agents/07-security-privacy-reviewer.md` when sensitive data, AI, permissions, auth, backup, or telemetry is involved.
8. `agents/09-localization-reviewer.md` when user-facing copy, locale-sensitive formatting, or translation readiness changes.
9. `agents/10-performance-specialist.md` when the feature adds heavy media, large lists, rich text, gestures, animations, startup work, or expensive rendering.
10. `agents/11-monetization-store-commerce-reviewer.md` when paid features, IAP, subscriptions, entitlements, restore purchases, or store-commerce copy are involved.
11. `agents/12-ai-prompt-evaluator.md` when AI prompts, model input/output, summaries, suggestions, embeddings, moderation, or provider routing are involved.

## Workflow

1. Produce a feature brief with requirements, non-requirements, acceptance criteria, edge cases, and privacy/security impact.
2. Define domain model, service/repository needs, storage behavior, and migration impact.
3. Define screen states and reusable components.
4. Implement by layer: domain, repository, service, hook, UI.
5. Add tests by layer.
6. Add an ADR from `docs/adr/0000-template.md` when the feature changes architecture, storage strategy, AI data flow, release posture, or a cross-feature contract.
7. Update relevant docs.
8. Run validation.
9. Apply `agents/review-checklist.md` before reporting completion.

## Definition Of Ready

- User goal is clear.
- Acceptance criteria are testable.
- Data ownership and privacy/security impact are understood.
- Required platform permissions or store implications are identified.

## Required Checks

- `npm run typecheck`
- `npm run lint`
- Relevant tests for all changed layers.
- Full test suite for broad or risky changes.

## Output Example

```text
Changed:
- Added profile name and avatar capture in onboarding.
- Added profile display in feed and reflection rows.

Validation:
- npm run typecheck
- npm run lint
- Profile service and component tests

Gates applied:
- New feature: Product Manager, Design Agent, Expo Engineer, QA
- Sensitive profile data: Security and Privacy Reviewer

Human review needed:
- No
```

## Done When

- Acceptance criteria are met.
- Tests cover important success and failure paths.
- Documentation reflects the new behavior.
- ADR exists for durable architectural decisions.
- Required specialist reviews are identified or completed.
