# Compliance Gate Matrix

## Purpose

Map common change types to required specialist reviews. This matrix helps agents avoid over-reviewing small changes while still escalating user-data, release, security, privacy, IP, and accessibility risks.

Agents may screen risk and recommend mitigations. Agents must not claim legal, security, privacy, IP, or store compliance is guaranteed.

## Gate Levels

| Level | Meaning |
|---|---|
| `NONE` | No specialist gate beyond normal implementation checks. |
| `LIGHT` | Agent performs focused self-check and documents risk. |
| `REQUIRED` | Named specialist guide must be applied before work is considered complete. |
| `HUMAN` | Escalate to the human owner or qualified reviewer before release or irreversible action. |

## Blocking Priority

When several gates apply, resolve them in this order:

1. `HUMAN` escalation: blocks release, production submission, destructive data operations, and irreversible behavior until the owner decides.
2. Security and Privacy: blocks merge/release when sensitive data, permissions, logs, auth, AI data sharing, or deletion guarantees are unsafe or unclear.
3. Data Architecture: blocks merge when storage, migration, deletion, export, backup, restore, or cache behavior is inconsistent or untested.
4. Monetization and Store Commerce: blocks release when purchase, restore, entitlement, paywall, or store-policy behavior is unclear.
5. AI Prompt: blocks release when user data sent to a model, labeling, opt-in, ZDR, safety boundaries, or prompt-injection handling is unclear.
6. QA: blocks release when critical flows are untested or failing.
7. Accessibility and Localization: blocks UI completion when users cannot operate, understand, or read affected flows.
8. Performance: blocks release only for user-visible jank, blank screens, memory pressure, startup regressions, or severe loading issues.
9. Code Review: blocks merge for correctness, architecture, maintainability, or test gaps according to severity.

Lower-priority gates cannot override an unresolved higher-priority gate. A gate can pass with residual risk only when the risk is documented and does not trigger human escalation.

## Fast Path Exemptions

Fast Path tasks may use `LIGHT` checks instead of full specialist review when all are true:

- The change is small and reversible.
- No sensitive data, storage, cache, migration, AI, auth, permission, payment, dependency, release, or legal/IP behavior changes.
- The affected surface can be validated locally.
- The final response states validation and any test gap.

Examples: small spacing adjustment, typo fix, non-sensitive docs edit, narrow test-only cleanup.

## Change Type Matrix

| Change Type | Required Gates |
|---|---|
| Copy or text-only UI change | `LIGHT` Design/accessibility check |
| User-facing copy, translation, locale, date/time, number, currency, pluralization, or error-message change | `REQUIRED` Localization Reviewer; add Design Agent when visible layout can be affected |
| Layout, spacing, header, drawer, footer, modal, list, or navigation UI change | `REQUIRED` Design Agent, Expo Engineer, accessibility check |
| New reusable component | `REQUIRED` Expo Engineer, componentization review, component test |
| New screen or major workflow | `REQUIRED` Product Manager, Design Agent, Expo Engineer, QA |
| Bug fix with no data impact | `LIGHT` QA regression check |
| Bug fix affecting navigation, loading, cache, or persisted state | `REQUIRED` QA, Data Architecture when cache/persistence is involved |
| Performance issue, optimization, animation, image, large list, startup, or blank-screen loading change | `REQUIRED` Performance Specialist, Expo Engineer, QA |
| Domain model change | `REQUIRED` Data Architecture, service/repository tests |
| Repository, service, cache, import/export, backup, restore, or deletion change | `REQUIRED` Data Architecture, Security and Privacy Reviewer, QA |
| Database schema or migration change | `REQUIRED` Data Architecture, Security and Privacy Reviewer, rollback review |
| Sensitive local storage change | `REQUIRED` Security and Privacy Reviewer; `HUMAN` if encryption or deletion guarantees are uncertain |
| Authentication, app lock, biometrics, session, token, or permission change | `REQUIRED` Security and Privacy Reviewer, QA |
| Logs, telemetry, analytics, crash reporting, or monitoring change | `REQUIRED` Security and Privacy Reviewer; `HUMAN` if user data collection changes |
| AI prompt, AI provider, AI output, model call, or remote inference change | `REQUIRED` Product Manager, AI Prompt Evaluator, Security and Privacy Reviewer; `HUMAN` if user content is sent remotely |
| New dependency | `REQUIRED` Expo Engineer dependency evaluation, Code Reviewer; `HUMAN` for native, analytics, auth, payment, AI, storage, or security dependencies |
| Asset, icon, illustration, sticker, sound, font, or generated image change | `REQUIRED` Design Agent, IP and Asset Review; `HUMAN` if provenance, commercial license, trademark, likeness, or AI generation is uncertain |
| Monetization, paywall, subscription, purchase, restore purchases, receipt validation, or entitlement change | `REQUIRED` Product Manager, Monetization and Store Commerce Reviewer, Expo Engineer, Security and Privacy Reviewer, Release Gatekeeper; `HUMAN` for store-policy uncertainty |
| Release, TestFlight, Google Play, App Store, EAS build, or OTA update | `REQUIRED` QA, Security and Privacy Reviewer, Release Gatekeeper; `HUMAN` before production submission |

## Required Validation By Gate

| Gate | Minimum Evidence |
|---|---|
| Design/accessibility | Affected screens, states considered, theme/localization impact, accessibility labels/roles/states checked |
| Localization | Affected strings, locale-sensitive formatting, text-length risk, accessibility-label impact |
| Componentization | Existing patterns inspected, public props typed, screen keeps navigation/side effects, component tests updated |
| QA | Regression scope, steps tested, expected/actual behavior, environment |
| Performance | Observed issue, likely bottleneck, affected screens, validation/profiling evidence, residual risk |
| Data Architecture | Data affected, storage owner, migration/rollback, export/deletion/cache impact, tests |
| Security and Privacy | Sensitive data inventory, permissions, logs, storage, AI/data sharing, residual risk |
| AI Prompt | User data sent, consent/control, provider/model, ZDR status, output label, safety constraints, prompt-injection risk |
| Monetization | Product IDs, purchase/restore flow, entitlement states, store metadata/copy risk, validation |
| Release | Version/build target, validation results, QA/security/privacy status, rollback plan, decision |

## Escalation Triggers

Escalate to the human owner when:

- A change affects sensitive user-generated content, backups, deletion, restore, encryption, AI remote processing, auth, permissions, purchases, or production release.
- A guide cannot verify a compliance claim from code and docs alone.
- A dependency introduces native code, tracking, analytics, payment, AI, storage, or authentication behavior.
- Asset provenance, commercial licensing, trademark safety, celebrity likeness, or AI generation similarity is uncertain.
- Store policy, privacy disclosure, legal wording, or security posture is ambiguous.

## Completion Statement

For gated work, final responses should state:

```text
Gates applied:
Validation run:
Residual risk:
Human review needed:
```
