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
3. Decide whether the change belongs in a route file, feature component, or shared component.
4. Preserve existing behavior before changing visual structure.
5. Use theme values and localized strings for user-facing UI.
6. Update or add focused component tests when behavior, public props, or reusable components change.
7. Run validation.
8. Apply `agents/review-checklist.md` before reporting completion.

## Required Checks

- `npm run typecheck`
- `npm run lint`
- Relevant component tests.

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
