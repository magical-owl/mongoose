# Agent System Migration

## Purpose

Mongoose now uses a role-and-workflow agent architecture. Older topic-based files remain valid detailed references, but they are no longer the starting point for non-trivial work.

## Current Entry Order

1. Start with [`00-orchestrator.md`](00-orchestrator.md).
2. Select the relevant workflow from [`workflows/`](workflows/).
3. Apply [`compliance-gates.md`](compliance-gates.md).
4. Read only the required specialist roles and topic references.
5. Use [`review-checklist.md`](review-checklist.md) before reporting completion.

## Old To New Mapping

| Older Topic | New Entry Point |
|---|---|
| `architecture.md` | `00-orchestrator.md`, relevant workflow, `03-expo-engineer.md`, `04-data-architecture.md` |
| `feature-development.md` | `workflows/new-feature.md`, `01-product-manager.md`, `03-expo-engineer.md` |
| `design.md` | `workflows/ui-change.md`, `02-design-agent.md` |
| `componentization.md` | `workflows/ui-change.md`, `03-expo-engineer.md` |
| `testing.md` | `06-qa-engineer.md`, relevant workflow |
| `reviewer.md` | `05-code-reviewer.md` |
| `security.md` | `07-security-privacy-reviewer.md`, `compliance-gates.md` |
| `release.md` | `workflows/release.md`, `08-release-gatekeeper.md` |
| `localization.md` | `09-localization-reviewer.md` |
| `performance.md` | `10-performance-specialist.md` |
| `ai-rules.md`, `prompts.md` | `12-ai-prompt-evaluator.md`, `07-security-privacy-reviewer.md` |
| `expo.md`, `navigation.md` | `03-expo-engineer.md` |
| `repositories.md`, `services.md`, `database.md`, `state-management.md`, `api.md` | `04-data-architecture.md`, relevant workflow |

## Migration Rules

- Keep role files short and decision-oriented.
- Keep detailed implementation rules in topic references.
- Do not duplicate long checklists across roles and workflows.
- When a topic reference conflicts with a role, workflow, or `AGENTS.md`, update the topic reference.
- When adding a new required agent document, add it to `scripts/validate-agent-docs.js`.
- When adding a new workflow, update `README.md`, `00-orchestrator.md`, and `compliance-gates.md`.

## Completion Criteria

The migration is considered healthy when:

- The README gives a clear starting path.
- The orchestrator can route every common task.
- Compliance gates identify required reviewers.
- Topic files act as references, not competing entry points.
- `npm run validate:agent-docs` passes locally and in CI.
