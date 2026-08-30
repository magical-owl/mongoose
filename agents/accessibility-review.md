# Accessibility Review Reference

Use this reference when [`compliance-gates.md`](compliance-gates.md) requires design/accessibility review or when a change affects navigation, touch targets, inputs, modals, dynamic content, animations, or text layout.

## Required Context

- `agents/02-design-agent.md`
- `agents/workflows/ui-change.md`
- `docs/Accessibility.md`
- `docs/AppDesignGuidelines.md`

## Checklist

- Icon-only controls have `accessibilityLabel` and `accessibilityRole="button"`.
- Toggle, selected, expanded, disabled, busy, and destructive states use `accessibilityState` where applicable.
- Inputs have labels or clear hints beyond placeholder-only context.
- Modal and drawer content has an obvious close path.
- Text fits small screens and Dynamic Type without overlapping or clipping.
- Selection, mood, warning, and destructive state do not rely on color alone.
- Touch targets are large enough for iOS and Android.
- Motion-heavy UI has a reduced-motion path when relevant.

## Output

```text
Affected screens:
Controls reviewed:
Large text risk:
Screen reader risk:
Color/contrast risk:
Required fixes:
Residual risk:
```
