# Agent Flow

## Default Flow

Use this sequence for non-trivial work:

1. Classify the request with [`00-orchestrator.md`](00-orchestrator.md).
2. Pick one primary workflow from [`workflows/`](workflows/).
3. Check [`compliance-gates.md`](compliance-gates.md).
4. Read only the required role guides and topic references.
5. Implement or review the smallest scope that satisfies the request.
6. Run validation appropriate to the touched surface.
7. Apply [`review-checklist.md`](review-checklist.md).
8. Report changed files, validation, gates, residual risk, and human-review needs.

For code changes that touch app architecture boundaries, include `npm run validate:architecture` with the normal validation set.

## Path Selection

- Use **Fast Path** for small reversible fixes with no sensitive data, storage, dependency, AI, auth, payment, or release impact.
- Use **Standard Path** for normal app changes that require implementation and focused validation.
- Use **Gated Path** for sensitive, persistent, AI, payment, dependency, release, legal/IP, or irreversible changes.

## Keep Work Moving

- Do not ask for clarification when local code or docs can answer the question.
- Do not load every guide by default.
- Do not create ADRs for routine implementation details.
- Do not add roles, templates, or process unless they remove ambiguity or prevent a real failure mode.
- Do not stop at a plan when the user has asked to proceed and the change is safe to make.

## Escalate

Escalate to the human owner when a decision changes user-data handling, weakens safeguards, adds payment or AI data-sharing risk, affects production release, or cannot be verified from code and docs.
