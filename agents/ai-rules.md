# AI Agent Behavioral Rules

## Golden Rules

### Never Bypass Layers
- **Never import** across layers that violate dependency direction: Screen → Hook → Service → Repository → Data Source.
- **Never call** a repository from a screen, hook, or component. Always go through a service.
- **Never call** an API client, database, or AI module from a service. Always go through a repository.
- **Never access** storage (SecureStore, MMKV, SQLite) from a service or hook. Always go through a repository.
- **Never put** business logic in a hook or component. Business logic belongs in services.
- If you find yourself tempted to bypass a layer, stop and create the missing layer instead.

### Never Hardcode Values

| What Not to Hardcode | Instead Use |
|---------------------|-------------|
| Colors | Theme tokens from `@theme/colors` |
| Spacing | Theme tokens from `@theme/spacing` |
| Typography | Theme tokens from `@theme/typography` |
| Border radii | Theme tokens from `@theme/borders` |
| Shadow values | Theme tokens from `@theme/shadows` |
| Animation durations | Theme tokens from `@theme/animations` |
| Breakpoints | Theme tokens from `@theme/breakpoints` |
| AI prompts | Constants from `@constants/prompts` or `@config/prompts` |
| API URLs | Environment config from `@config/env` |
| Feature flags | Remote config from `@config/feature-flags` |
| Error messages | Localized strings from translation module |

### Never Use `any`
- Every type must be explicitly defined. No `any`, no implicit `any`, no `as any`.
- Use `unknown` for values of uncertain type, then narrow with type guards or Zod.
- Use generics to maintain type safety in reusable utilities.
- Use branded types for domain primitives (e.g., `type UserId = string & { __brand: 'UserId' }`).

### Never Duplicate Logic
- If a utility is useful across features, extract it to `@shared/utils/`.
- If a type is useful across features, extract it to `@shared/types/`.
- If a hook is useful across features, extract it to `@hooks/`.
- If a component is useful across features, extract it to `@shared/components/`.
- If a piece of logic already exists, import and reuse it — do not rewrite.

### Never Create Circular Dependencies
- Features must NOT import from other features at the service or repository level.
- Features MAY import types or components from other features at the presentation level only.
- Shared modules must NOT import from features.
- Use barrel exports (`index.ts`) to control the public API of each module.
- If circular dependency is detected, extract the shared concern into `@shared/`.

### Never Leave Dead Code
- No commented-out code. Delete it.
- No unused imports, variables, or parameters. TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` will catch these.
- No console.log statements in committed code. Use the project logger.
- No TODO without an issue reference. Every TODO must link to a GitHub issue.

### Always Use Theme
- Every color, spacing, font size, border radius, shadow, and animation duration must come from theme tokens.
- Import theme tokens using path aliases: `import { colors } from '@theme/colors'`.
- Never hardcode a raw hex color, pixel value, or font size.
- If the theme lacks a token you need, extend the theme — don't hardcode the value.

### Always Write Tests
- Every new service method requires a unit test.
- Every new repository method requires a unit test.
- Every new hook requires a unit or component test.
- Every new screen or significant component requires a component test.
- Every bug fix requires a regression test.
- Test coverage threshold: ≥80% across all modules.

### Always Update Documentation
- Every new feature requires a README in the feature folder.
- Every new public API requires JSDoc.
- Every architectural decision requires an ADR.
- Every user-facing change requires a changelog entry.
- When you change behavior, update the relevant docs in the same PR.

### Always Follow the Architecture Pattern
- New code must fit within Feature-First + Clean Architecture.
- If the architecture doesn't support the new code, extend the architecture first (with an ADR).
- Never compromise architectural integrity for development speed.

## AI Privacy & Compliance Governance

When developing or integrating AI capabilities in sensitive apps (Diary, Journal, Finance, AI Companion, Notes):

### Zero-Data Retention (ZDR) & Model Training Prohibition
- **Never submit user data for model training**: Configure all third-party AI service calls (OpenAI, Anthropic, Gemini, etc.) with Zero Data Retention (ZDR) options.
- **On-Device Preference**: Prefer local on-device execution (Core ML / ONNX Runtime) for personal data analysis where possible.
- **Prompt Sanitization**: Strip direct PII (emails, names, exact addresses) from AI prompt contexts before transmission.

### EU AI Act & Apple App Store Transparency (Guideline 2.5.18)
- **Clear AI Content Labeling**: Explicitly tag and label all AI-generated content (e.g., "AI-generated reflection", "AI summary") in the UI.
- **User Control & Opt-out**: AI features must require explicit user opt-in consent with an immediate toggle in Settings → Privacy → AI Features to disable remote AI analysis.
- **Content Moderation & Guardrails**: Implement safety filters on all AI outputs to prevent harmful, defamatory, or non-compliant text generation.



## What AI Agents Must Do Before Writing Code

1. **Read the architecture guide** (`agents/architecture.md`) to understand layering.
2. **Read the coding style guide** (`agents/coding-style.md`) to follow conventions.
3. **Read existing feature code** in `src/features/` to match established patterns.
4. **Check the theme** in `src/theme/` for available tokens — never hardcode.
5. **Check existing utilities** in `@shared/`, `@utils/`, `@hooks/` before creating new ones.
6. **Check existing tests** in `tests/` or alongside features to follow test patterns.

## What AI Agents Must Do After Writing Code

1. **Run type checking:** `npm run typecheck` — all files must pass with strict mode.
2. **Run linting:** `npm run lint` — no warnings or errors.
3. **Run tests:** `npm run test` — all tests must pass.
4. **Verify no `any` types** were introduced — grep for `: any`, `as any`, `<any>`.
5. **Verify no hardcoded values** — check colors, spacing, fonts, prompts.
6. **Verify no layer violations** — check import paths cross-referencing the dependency rules.
7. **Verify documentation** is updated (JSDoc, README, ADR, changelog as appropriate).

## Handling Ambiguity

- If the requirements are ambiguous, ask clarifying questions. Do not guess.
- If you need to make a design decision, document it in the code or in a brief ADR.
- If you find a bug, fix it and add a regression test. Do not leave a TODO.
- If you see code that violates these rules, flag it for refactoring in a separate PR.

## Escalation

If you encounter a situation where following these rules would significantly impede progress:
1. Document the conflict and the proposed exception.
2. Flag it in the PR description for human review.
3. The human reviewer will decide whether to grant an exception.
