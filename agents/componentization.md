# Componentization & Reuse Rules

Meadow is a reusable template. UI should be designed so a future app can replace a domain feature without copying screen-sized implementations.

## Extraction Rule

Extract a component when at least one of these is true:

- The same visual behavior appears on two screens.
- A screen contains a complete visual mode, workflow, or repeated interaction with its own states.
- The component can be described by domain data and callbacks rather than a specific route.
- The component is likely to be reused by a new app built from this template.
- A screen file is approaching the 300-line component limit.

Do not extract a one-off wrapper only to reduce line count. Keep screen-specific composition in the screen until the boundary is clear.

## Component Boundaries

Screens own:

- Route parameters and navigation.
- Feature hooks and service orchestration.
- Authentication, lockbox checks, and screen-level side effects.
- Loading, error, and empty-state decisions.

Presentational components own:

- Layout, styles, accessibility labels, and visual states.
- Rendering data received through typed props.
- User events emitted through callbacks such as `onPress`, `onChange`, and `onSubmit`.
- Local interaction state only when it is intrinsic to the widget.

Components must not access repositories, storage, APIs, or route params directly. A reusable component should not call `router.push`; the screen supplies the callback.

## Placement

- `src/shared/components/`: domain-neutral primitives used by multiple features or future apps (`Text`, `Modal`, `Card`, `EmptyState`).
- `src/features/<feature>/components/`: reusable UI that understands one feature's domain (`DiaryEntryView`, `DiaryDatePicker`, `StickerPickerModal`).
- `app/`: route composition only. Avoid defining reusable visual systems in route files.

Use a typed public interface and export only the intended API. Keep feature internals private unless another feature has a documented presentation-level dependency.

## Current Meadow Extraction Map

Already reusable:

- `DiaryEntryView`: Card, Timeline, and Feed entry presentations used by Home.
- `CalendarEntryView`: Calendar-specific compact activity rows used by Calendar.
- `DiaryDatePicker`, `EntryDetailsModal`, `StickerPickerModal`, `TemplatePickerModal`, and `CompanionPickerModal`.
- Shared typography, modal, input, button, and feedback components.

Recommended next extractions:

1. `DiaryFilterDrawer` — Home drawer layout and filter option behavior.
2. `DiaryDateHierarchy` — year/month/date grouping, collapse state, and headings.
3. `DiaryCalendarGrid` — month navigation, weekday ordering, day markers, and selection.
4. `DiaryComposer` — shared title, body editor, toolbar, stickers, companion, favorite, and save composition used by create/edit.
5. `InsightsMetricCard` and chart primitives — reusable analytics presentation with data supplied by the screen.
6. `DisplayPreferenceControl` — compact radio/toggle rows for settings screens in future apps.

Extract these incrementally. Preserve existing behavior first, then move duplicated JSX and styles behind props. Add a component test for each extracted public state and interaction.

## Extraction Checklist

- [ ] Component has a single visual responsibility.
- [ ] Props and callback types are explicit; no `any`.
- [ ] Screen retains navigation, hooks, services, and side effects.
- [ ] Styles use theme tokens and are defined outside render.
- [ ] Accessibility roles, labels, and states move with the control.
- [ ] Loading, empty, error, selected, and disabled states are defined where applicable.
- [ ] Existing screens use the component instead of duplicating the old JSX.
- [ ] Component tests cover user-visible behavior.
- [ ] Documentation or a feature README records the public API when reused outside its feature.
