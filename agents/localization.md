# AI Agent Localization Instructions

Start with [`agents/09-localization-reviewer.md`](09-localization-reviewer.md), the relevant workflow in [`agents/workflows/`](workflows/), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed localization reference.

## Translation File Rule

When adding a new feature, renaming a feature, changing a user-facing label, or adding any new UI text, update `src/localization/i18n.ts` in the same change.

## Required Updates

- Add translation keys for all new user-facing strings.
- Update existing translation keys when a feature name, tab name, setting name, modal title, button label, empty state, error message, helper text, or accessibility label changes.
- Keep English (`en`) and Japanese (`ja`) dictionaries structurally aligned. Every key added to one language must be added to the other.
- Prefer reusable semantic keys over screen-specific duplicates when the same label appears in multiple places.
- Use translation helpers such as `useTranslation()` and existing label helpers instead of hardcoding UI strings in components.

## Review Checklist

Before finishing any feature or UI text change:

- Search touched files for hardcoded strings that should be localized.
- Confirm `src/localization/i18n.ts` includes matching keys for `en` and `ja`.
- Confirm TypeScript still accepts `TranslationKey`.
- Run focused lint/typecheck for touched localization and UI files.
