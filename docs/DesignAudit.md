# Design Audit

Date: 2026-08-25

Scope: static sweep of app screens, shared components, diary feature components, and design documentation against `docs/AppDesignGuidelines.md`, `docs/DesignSystem.md`, `docs/FigmaWorkflow.md`, `agents/design.md`, and `agents/componentization.md`.

## Completed During Sweep

- Aligned the create-entry spec with the current compact favorite, journal selector, and Entry Details row.
- Updated the mood spec to reflect the current nine-step manual mood scale from `-4` through `4`.
- Added missing selected-state semantics to Calendar date cells and month picker choices.
- Changed tab-like view/range switchers in Journals, Journal Entry List, and Insights from generic buttons to `tab` roles.
- Added radio roles and selected state to Entry Details mood and mood-weather selectors.
- Added radio roles and selected state to Settings theme mode and accent color selectors.
- Added button roles to Entry Details help icon controls.

## Findings

### High Priority

1. **Large route files need component extraction.**

   The componentization guide recommends extraction when a screen approaches 300 lines. The largest current route files are:

   - `app/(tabs)/settings.tsx`: 1115 lines
   - `app/journal/[id].tsx`: 1107 lines
   - `app/entry/[id].tsx`: 942 lines
   - `app/entry/new.tsx`: 700 lines
   - `app/onboarding.tsx`: 643 lines
   - `app/(tabs)/insights.tsx`: 583 lines
   - `app/(tabs)/index.tsx`: 515 lines
   - `app/(tabs)/calendar.tsx`: 496 lines

   Recommended next extractions remain consistent with `agents/componentization.md`: `DiaryComposer`, `DiaryFilterDrawer`, `DiaryDateHierarchy`, `DiaryCalendarGrid`, `InsightsMetricCard`, and reusable settings preference rows.

2. **Settings is still the densest design surface.**

   Settings now uses modal grouping, but the route still owns too many unrelated presentation patterns. Extract settings sections and selector rows so Display, Appearance, Privacy and Security, Data, Subscription, and About stay visually consistent.

3. **Create/Edit composer duplication is high.**

   Create and edit screens share header actions, sticker layering, journal chips, mood/tags/date/title/editor composition, keyboard toolbar, template picker, and sticker picker behavior. Extracting `DiaryComposer` would reduce future drift and make sticker and toolbar fixes safer.

### Medium Priority

4. **Raw colors remain in UI code.**

   Some hardcoded values are valid one-off values, such as shadows or white icons on selected accent backgrounds. Others should become theme tokens if reused:

   - selected text/icon color on accent backgrounds
   - sticker control strip background
   - destructive sticker control background
   - modal and drawer scrim overlays

   Consider adding `onTint`, `controlOverlay`, and `destructiveControl` tokens rather than repeating `#fff`, `#000`, or fixed slate/red colors.

5. **Hidden Archive route is not design-system ready.**

   `app/(tabs)/archive.tsx` is not exposed in the bottom tab bar, but it contains hardcoded English strings, inline layouts, emoji-like symbols, and mixed feature concepts. Keep it shelved, or convert it into localized, tokenized, componentized surfaces before exposing it.

6. **Some current product behavior has outpaced the Figma workflow spec.**

   The create/edit composer and journal features have evolved quickly. Keep `docs/FigmaWorkflow.md` updated whenever product behavior changes, or future design changes will optimize against stale screen specs.

### Lower Priority

7. **Border radius usage is inconsistent.**

   The design docs prefer 8 px or less for compact controls and diary cards, but pills, badges, onboarding elements, modals, and tab actions often use larger radii. This is acceptable for true pills and sheets, but repeated card surfaces should move toward the documented 4-8 px range.

8. **Accessibility semantics are improving but should be enforced in reusable controls.**

   Many selectors now expose state, but repeated hand-built `TouchableOpacity` selectors still appear across screens. Prefer shared segmented/radio/chip components so selected, disabled, checked, expanded, and busy states are automatic.

## Recommended Next Pass

1. Extract `DiaryComposer` from create/edit.
2. Extract `SettingsPreferenceRow` and `SettingsRadioPillGroup`.
3. Introduce missing theme tokens for selected-on-accent text and sticker controls.
4. Replace remaining custom selector groups with shared controls.
5. Decide whether Archive is productized or kept internal, then either localize/refactor it or leave it out of navigation.
