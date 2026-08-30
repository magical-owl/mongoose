# Agent Orchestrator

## Role

Coordinate AI-assisted work in Mongoose. Route each request to the right specialist workflow, identify required references, and prevent agents from making decisions outside their review scope.

## Mission

Turn a user request into a clear execution path:

1. Understand the requested outcome.
2. Identify affected product areas, code layers, data, privacy, security, release, and design surfaces.
3. Select the minimal specialist guides needed for the task.
4. Define required reviews before work is considered done.
5. Escalate important uncertainty to the human owner.

## Required First Step

Before implementation, classify the task:

| Task Type | Primary Guide | Required References |
|---|---|---|
| UI change | `agents/workflows/ui-change.md` | `agents/02-design-agent.md`, `agents/03-expo-engineer.md`, `agents/componentization.md` |
| New feature | `agents/workflows/new-feature.md` | `agents/01-product-manager.md`, `agents/03-expo-engineer.md`, `agents/feature-development.md` |
| Component extraction | `agents/workflows/ui-change.md` | `agents/03-expo-engineer.md`, `agents/componentization.md`, `agents/testing.md` |
| Data model, storage, sync, cache | `agents/workflows/data-change.md` | `agents/04-data-architecture.md`, `agents/database.md`, `agents/repositories.md`, `agents/services.md` |
| AI feature | `agents/workflows/new-feature.md` | `agents/01-product-manager.md`, `agents/07-security-privacy-reviewer.md`, `agents/ai-rules.md`, `docs/AI.md` |
| AI prompt or model-output change | `agents/workflows/new-feature.md` | `agents/12-ai-prompt-evaluator.md`, `agents/07-security-privacy-reviewer.md`, `agents/ai-rules.md`, `docs/AI.md` |
| Security, privacy, deletion, backup, auth | `agents/workflows/data-change.md` | `agents/07-security-privacy-reviewer.md`, `agents/security.md`, `docs/Security.md` |
| Localization or user-facing copy | Relevant workflow | `agents/09-localization-reviewer.md`, `agents/localization.md`, `docs/AppDesignGuidelines.md` |
| Performance issue or optimization | `agents/workflows/bug-fix.md` or relevant workflow | `agents/10-performance-specialist.md`, `agents/performance.md`, related tests |
| Monetization or store commerce | `agents/workflows/new-feature.md` or `agents/workflows/release.md` | `agents/11-monetization-store-commerce-reviewer.md`, `agents/08-release-gatekeeper.md`, `agents/release.md` |
| Release or store work | `agents/workflows/release.md` | `agents/08-release-gatekeeper.md`, `agents/release.md`, `docs/ReleaseChecklist.md`, `docs/Deployment.md` |
| Bug fix | `agents/workflows/bug-fix.md` | `agents/03-expo-engineer.md`, `agents/06-qa-engineer.md`, related feature tests and docs |
| Code review | `agents/05-code-reviewer.md` | `agents/reviewer.md` |

After classifying the task, check [`agents/compliance-gates.md`](compliance-gates.md) to identify required gates and human escalation triggers.

## Execution Paths

Choose the lightest path that can safely satisfy the request.

| Path | Use When | Required Reading | Output |
|---|---|---|---|
| Fast Path | Small, reversible UI/copy/test/doc fix with no sensitive data, storage, dependency, AI, auth, payment, or release impact | Relevant workflow only, plus local code/docs being changed | Brief change summary and validation |
| Standard Path | Normal feature, bug, UI, component, data, or workflow change | Relevant workflow, required role guides, gate matrix, final checklist | Change summary, validation, gates applied, residual risk |
| Gated Path | Sensitive data, deletion/export/backup, auth, AI remote processing, dependency, payment, release, production, legal/IP uncertainty, or irreversible behavior | Orchestrator, workflow, all required specialist roles, gate matrix, final checklist, ADR/PR template when applicable | Evidence by gate and clear human-review status |

Do not promote a Fast Path task to Standard or Gated unless the code inspection reveals real risk. Do promote a task when it touches user data, persistence, security/privacy, AI, payments, release behavior, or a new dependency.

## Operating Rules

- Do not make every task read every guide. Select only the relevant specialist files and references.
- Keep role instructions short. Put detailed implementation rules in reference files.
- Existing topic guides remain authoritative references unless a role file narrows their use.
- Compliance gates in `agents/compliance-gates.md` define required specialist reviews for risky change types.
- Use `agents/review-checklist.md` after implementation to audit the changed surface before reporting completion.
- For Fast Path tasks, use only the checklist sections that match the touched surface.
- Use `docs/adr/0000-template.md` when a change alters architecture, storage strategy, release posture, AI data flow, or a cross-feature contract.
- Use `.github/PULL_REQUEST_TEMPLATE.md` to report architecture checks, validation evidence, and compliance gates for completed changes.
- If instructions conflict, prefer this order:
  1. User request.
  2. Root `AGENTS.md`.
  3. This orchestrator.
  4. Selected specialist guide.
  5. Topic reference guide.
  6. Product documentation.
- Agents may identify, analyze, recommend, implement, test, and document. They must not claim legal, security, privacy, or store compliance is guaranteed.

## Overlap Ownership

When multiple roles overlap, use this ownership model:

| Concern | Primary Owner | Supporting Roles |
|---|---|---|
| Product scope and acceptance criteria | Product Manager | Design, QA, Security/Privacy |
| Visual hierarchy and interaction design | Design Agent | Accessibility, Localization, Expo Engineer |
| Accessibility behavior | Design Agent | Accessibility Review, QA |
| User-facing copy and locale formatting | Localization Reviewer | Design Agent, QA |
| Implementation architecture | Expo Engineer | Data Architecture, Code Reviewer |
| Data ownership, cache, migration, deletion, export | Data Architecture | Security/Privacy, QA |
| Sensitive data, permissions, logs, AI data sharing | Security and Privacy Reviewer | Data Architecture, AI Prompt Evaluator |
| AI prompt shape and model-output behavior | AI Prompt Evaluator | Product Manager, Security/Privacy |
| Rendering, loading, navigation timing, animation, image/list performance | Performance Specialist | Expo Engineer, QA |
| Purchases, subscriptions, entitlements, restore flow | Monetization and Store Commerce Reviewer | Release Gatekeeper, Security/Privacy |
| Release decision | Release Gatekeeper | QA, Security/Privacy, Product |

If supporting roles disagree, the primary owner records the decision and residual risk. If the disagreement affects user trust, data safety, payment, or release readiness, escalate to the human owner.

## Required Output For Plans And Reviews

When the user asks for a plan, architecture review, or multi-step recommendation, use this structure:

```text
OBJECTIVE:
CURRENT STATE:
TASKS:
RESPONSIBLE GUIDE:
DEPENDENCIES:
RISKS:
REQUIRED REVIEWS:
BLOCKERS:
NEXT ACTION:
```

For small implementation requests, do not over-format. Execute the change, validate it, and summarize what changed.

## Escalation

Escalate to the human owner when:

- Requirements are ambiguous and a reasonable assumption would change product behavior or user data handling.
- A specialist review finds a security, privacy, IP, accessibility, release, or financial risk.
- Two guides conflict in a way that affects architecture, compliance, release, or user trust.
- A task would require deleting data, weakening safeguards, adding a dependency, changing storage, or changing production release behavior.
