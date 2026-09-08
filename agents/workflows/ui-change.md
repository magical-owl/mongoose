# UI Change Workflow

## Use When

The request changes visual layout, interaction behavior, screen structure, navigation surfaces, reusable UI components, or accessibility behavior.

Use Fast Path for small spacing, color-token, clipped-text, icon, or label fixes that do not change behavior, data, dependencies, permissions, AI, payments, or release posture.

## Required Guides

1. `agents/00-orchestrator.md`
2. `agents/compliance-gates.md`
3. `agents/02-design-agent.md`
4. `agents/03-expo-engineer.md`
5. `agents/componentization.md`
6. `agents/testing.md`

Add `agents/09-localization-reviewer.md` when user-facing copy, labels, date/time formatting, or text-length risk changes.
Add `agents/10-performance-specialist.md` when animation, large list, image, loading, or scroll performance changes.
Add `agents/13-responsive-layout-reviewer.md` when the change affects tablet, landscape, split-screen, full-bleed media, grids, fixed headers/footers, drawers, modals, or large-screen behavior.

## Workflow

1. Identify the affected screen, component, and primary workflow.
2. Inspect adjacent screens for existing header, drawer, footer, card, picker, modal, and toolbar patterns.
3. Run the UI placement check before writing code:
   - Does this belong in a route file, feature component, shared component, hook, service, or domain model?
   - Does an existing component already represent this pattern?
   - Will this appear in more than one entry surface such as timeline, card, feed, view, edit, calendar, or rediscover?
   - Will this add more than one new state variable to a route file?
4. If the target route is already over 400 lines, prefer extracting a component or hook before adding behavior. If it is over 500 lines, extraction is the default unless the change is a tiny token/copy fix.
5. Preserve existing behavior before changing visual structure.
6. Use theme values and localized strings for user-facing UI.
7. Update or add focused component tests when behavior, public props, or reusable components change.
8. Run validation.
9. Apply `agents/review-checklist.md` before reporting completion.

## UI Consistency Pass

When a change affects diary entry presentation, check every surface that renders the same concept:

- Timeline view
- Card view
- Feed view
- View diary screen
- Edit diary screen
- Calendar and rediscover cards when entry metadata, cover images, reactions, reflections, or body previews are involved

When a change affects app chrome, check every matching chrome surface:

- Main footer navigation
- Create and edit footers
- Header buttons
- Drawer controls
- Settings/onboarding selectors

## Required Checks

- `npm run typecheck`
- `npm run lint`
- Relevant component tests.

## Animation And Modal Checks

When the change touches animations, drawers, modals, floating panels, segmented controls, or route-driven UI state:

- Test the first interaction, repeated interaction, close/reopen, route leave/return, and rapid taps when relevant.
- Prefer shared animation and native-module mocks from `tests/` instead of adding inline mocks to individual test files.
- Verify active, inactive, dismissed, and interrupted states instead of only the happy path.
- Run the directly affected component test plus one nearby integration-style component test that exercises the component in its real screen context.
- Do not broadly suppress `act()` warnings. Fix the async test boundary, timer handling, or shared mock instead.

## Output Example

```text
Changed:
- Updated the journal drawer spacing and reused `SlidingDrawer`.

Validation:
- npm run typecheck
- npm run lint
- SlidingDrawer tests

Gates applied:
- UI change: Design Agent, Expo Engineer, accessibility check

Residual risk:
- Not checked on physical Android.
```

## Done When

- The UI matches the requested behavior.
- No duplicated reusable pattern remains in the touched area.
- Accessibility labels, roles, states, and touch targets remain valid.
- Text fits small screens and large text settings as far as the component scope allows.
- Final response includes validation and residual risk when relevant.
