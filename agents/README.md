# Mongoose Agent System

## Purpose

This directory contains the AI operating model for Mongoose. The role files define how agents should approach work. The existing topic files remain the detailed reference library.

## Start Here

Use [`00-orchestrator.md`](00-orchestrator.md) before non-trivial work. It selects the smallest relevant set of specialist guides and reference documents for the request.

Use [`compliance-gates.md`](compliance-gates.md) after task classification to identify required specialist reviews and human escalation triggers.

Use [`AGENT_FLOW.md`](AGENT_FLOW.md) when you need the shortest end-to-end operating flow.

## Decision Tree

1. If the request changes layout, styling, controls, screen states, or accessibility, use [`workflows/ui-change.md`](workflows/ui-change.md).
2. If the request adds a new capability, screen, onboarding step, setting, AI behavior, permission, or paid feature, use [`workflows/new-feature.md`](workflows/new-feature.md).
3. If the request fixes broken, delayed, stale, missing, clipped, overlapping, or crashing behavior, use [`workflows/bug-fix.md`](workflows/bug-fix.md).
4. If the request changes domain models, repositories, services, storage, cache, backup, restore, export, deletion, or migrations, use [`workflows/data-change.md`](workflows/data-change.md).
5. If the request prepares, audits, builds, submits, or gates a release, use [`workflows/release.md`](workflows/release.md).
6. If the request is a review, use [`05-code-reviewer.md`](05-code-reviewer.md) and apply the relevant workflow based on the changed files.
7. If the request touches localization, performance, monetization, or AI prompts, add the matching specialist role from the role guide table.

## Role Guides

| File | Use For |
|---|---|
| [`00-orchestrator.md`](00-orchestrator.md) | Task routing, dependencies, risks, and required reviews |
| [`01-product-manager.md`](01-product-manager.md) | Requirements, user stories, acceptance criteria, and scope control |
| [`02-design-agent.md`](02-design-agent.md) | UX/UI, accessibility, design-system fit, and reusable screen patterns |
| [`03-expo-engineer.md`](03-expo-engineer.md) | Expo, React Native, TypeScript implementation, validation, and component extraction |
| [`04-data-architecture.md`](04-data-architecture.md) | Domain models, repositories, services, storage, migrations, cache, export, and deletion |
| [`05-code-reviewer.md`](05-code-reviewer.md) | Independent diff review and severity-ranked findings |
| [`06-qa-engineer.md`](06-qa-engineer.md) | Test planning, regression testing, and bug reports |
| [`07-security-privacy-reviewer.md`](07-security-privacy-reviewer.md) | Security, privacy, AI, permissions, logs, backups, and sensitive data risk review |
| [`08-release-gatekeeper.md`](08-release-gatekeeper.md) | Release readiness, store checks, validation evidence, and rollback planning |
| [`09-localization-reviewer.md`](09-localization-reviewer.md) | User-facing copy, locale-sensitive formatting, translation readiness, and text-length risk |
| [`10-performance-specialist.md`](10-performance-specialist.md) | Rendering, loading, navigation, animation, list, image, and startup performance |
| [`11-monetization-store-commerce-reviewer.md`](11-monetization-store-commerce-reviewer.md) | Subscriptions, IAP, paywalls, entitlements, restore purchases, and store commerce risk |
| [`12-ai-prompt-evaluator.md`](12-ai-prompt-evaluator.md) | AI prompts, model inputs/outputs, labeling, opt-in, safety boundaries, and prompt privacy |
| [`13-responsive-layout-reviewer.md`](13-responsive-layout-reviewer.md) | Large-screen, tablet, landscape, split-screen, and responsive layout readiness |

## Gate Matrix

| File | Use For |
|---|---|
| [`compliance-gates.md`](compliance-gates.md) | Required review gates by change type, validation evidence, and escalation triggers |
| [`AGENT_FLOW.md`](AGENT_FLOW.md) | Short execution flow, path selection, and escalation rules |
| [`review-checklist.md`](review-checklist.md) | Final implementation audit for scope, architecture, types, UI, data, privacy, and validation |
| [`output-examples.md`](output-examples.md) | Example final responses for UI changes, bug fixes, data changes, and release gates |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history for agent-system changes |
| [`MIGRATION.md`](MIGRATION.md) | Mapping from older topic files to the role-and-workflow agent system |

## Automated Validation

| Command | Checks |
|---|---|
| `npm run validate:agent-docs` | Required agent files, banned local paths, and local Markdown links |
| `npm run validate:architecture` | High-signal layer boundaries for services, hooks, repositories, and shared utilities |

## Workflow Guides

| File | Use For |
|---|---|
| [`workflows/ui-change.md`](workflows/ui-change.md) | Visual layout, interaction, navigation surface, reusable UI, and accessibility changes |
| [`workflows/bug-fix.md`](workflows/bug-fix.md) | Broken, delayed, inconsistent, stale, crashing, clipped, or overlapping behavior |
| [`workflows/new-feature.md`](workflows/new-feature.md) | New capabilities, screens, onboarding steps, settings, paid features, AI behavior, or permissions |
| [`workflows/data-change.md`](workflows/data-change.md) | Domain models, storage, repositories, services, cache, backup, restore, export, deletion, and migrations |
| [`workflows/release.md`](workflows/release.md) | TestFlight, App Store, Google Play, internal builds, production OTA, and release gates |

## Operating Templates

| File | Use For |
|---|---|
| [`../docs/adr/0000-template.md`](../docs/adr/0000-template.md) | Architectural decisions, tradeoffs, migrations, rollback, and compliance gate notes |
| [`../.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) | Pull request summaries, architecture checks, validation evidence, and gate reporting |
| [`../.github/ISSUE_TEMPLATE/feature_brief.md`](../.github/ISSUE_TEMPLATE/feature_brief.md) | Feature requirements, acceptance criteria, edge cases, and agent routing |
| [`../.github/ISSUE_TEMPLATE/bug_report.md`](../.github/ISSUE_TEMPLATE/bug_report.md) | Bug reports with reproduction details, regression risk, and routing |
| [`../.github/ISSUE_TEMPLATE/qa_evidence.md`](../.github/ISSUE_TEMPLATE/qa_evidence.md) | QA validation evidence, environment, results, gates, and residual risk |

## Reference Guides

Use the topic files when selected by the orchestrator or a role guide:

- `architecture.md`
- `coding-style.md`
- `componentization.md`
- `accessibility-review.md`
- `dependency-review.md`
- `ip-asset-review.md`
- `testing.md`
- `security.md`
- `repositories.md`
- `services.md`
- `database.md`
- `state-management.md`
- `design.md`
- `expo.md`
- `ios.md`
- `android.md`
- `release.md`
- `documentation.md`
- `localization.md`
- `performance.md`
- `navigation.md`
- `api.md`
- `prompts.md`

## Compliance Boundary

Agents may identify, analyze, recommend, implement, test, and document. Agents must not claim legal, security, privacy, IP, or store compliance is guaranteed. High-risk or uncertain findings must be escalated to the human owner.
