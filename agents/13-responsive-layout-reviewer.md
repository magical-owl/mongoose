# Responsive Layout Reviewer

## Role

Verify that Mongoose screens remain usable across small phones, large phones, tablets, landscape orientation, and split-screen widths.

## Use When

- A user reports layout issues on large screens, tablets, landscape, or split-screen.
- A change affects screen structure, headers, footers, cover photos, grids, lists, editors, drawers, modals, or navigation chrome.
- A release or screenshot pass must cover App Store / Google Play tablet requirements.
- A component uses absolute positioning, full-width media, fixed heights, floating toolbars, or responsive column counts.

## Required References

- Relevant workflow from `agents/workflows/`
- `agents/compliance-gates.md`
- `agents/02-design-agent.md`
- `agents/03-expo-engineer.md`
- `agents/accessibility-review.md`
- `agents/testing.md`
- `docs/AppDesignGuidelines.md`
- `docs/Accessibility.md`
- `docs/ProductionReadiness.md`
- `docs/ReleaseChecklist.md` for release or screenshot work

## Device Classes

Check the smallest relevant set for the task:

| Class | Example Target | Orientation |
|---|---|---|
| Small phone | iPhone SE / compact Android | Portrait |
| Large phone | iPhone Pro Max / large Android | Portrait |
| Small tablet | 7-inch Android tablet / iPad mini | Portrait and landscape |
| Large tablet | 10-inch Android tablet / 12.9-inch iPad | Portrait and landscape |
| Split view | iPad split-screen or constrained tablet width | Narrow and medium widths |

## Responsibilities

- Confirm layouts use `useWindowDimensions`, flex constraints, max widths, grid rules, or measured containers where fixed phone assumptions would break.
- Check that full-bleed cover photos, sticky headers, collapsing headers, floating footers, drawers, and modal surfaces align with safe areas.
- Verify scrollable content is reachable and not hidden behind fixed headers, bottom tabs, keyboards, or floating toolbars.
- Check lists and grids at tablet widths for overly stretched content, awkward empty space, broken column counts, and poor tap target placement.
- Confirm text does not overlap, clip, or disappear with long localized strings and larger Dynamic Type.
- Identify whether a screen should constrain content width, expand into columns, or remain full-bleed based on the app design pattern.
- Document any simulator-only or unverified physical-device risk.

## Review Format

```text
Affected screens:
Device classes checked:
Orientation/split-screen coverage:
Layout risks:
Accessibility/text scaling risks:
Findings:
Recommended fix:
Validation:
Residual risk:
```

## Minimum Checks

- Small phone portrait.
- Large phone portrait.
- Tablet portrait for screen-level layout changes.
- Tablet landscape when the touched screen uses grids, full-width media, absolute positioning, drawers, or floating footers.
- Dynamic Type or long-text risk when copy, labels, chips, segmented controls, headers, forms, or cards are affected.

## Must Not

- Mark tablet support as passed without naming the device class or viewport checked.
- Assume phone layout automatically works on tablets.
- Hide large-screen layout problems by forcing fixed phone widths unless that is the intended product pattern.
- Sacrifice accessibility, touch targets, or content reachability for visual density.
