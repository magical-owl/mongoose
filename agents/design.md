# Design Reference

Start with [`agents/02-design-agent.md`](02-design-agent.md), [`agents/compliance-gates.md`](compliance-gates.md), and the relevant workflow before using this file. This document is the detailed UI implementation reference.

Use this skill when creating, redesigning, or reviewing app UI in Mongoose.

Portable Codex-style skill file: `agents/skills/mongoose-design/SKILL.md`.

## Required Context

Before changing UI, read the relevant local docs:

- `docs/AppDesignGuidelines.md`
- `docs/DesignSystem.md`
- `docs/FigmaWorkflow.md` for screen-level product requirements
- `agents/componentization.md` when extracting or reorganizing UI components
- `agents/accessibility.md` if it exists; otherwise use `docs/Accessibility.md`

When a decision depends on platform guidance, verify against the official source:

- Apple Human Interface Guidelines: `https://developer.apple.com/design/human-interface-guidelines/`
- Apple Design Resources: `https://developer.apple.com/design/resources/`
- Material Design 3: `https://m3.material.io/`
- Expo SDK 57 docs: `https://docs.expo.dev/versions/v57.0.0/`
- Expo Router: `https://docs.expo.dev/router/introduction/`
- Expo UI SwiftUI guide: `https://docs.expo.dev/guides/expo-ui-swift-ui/`
- React Native Accessibility: `https://reactnative.dev/docs/accessibility`
- NativeWind docs: `https://www.nativewind.dev/docs/getting-started/installation`

NativeWind is reference material only unless the user explicitly asks to adopt it.

## Design Workflow

1. Identify the user workflow and primary object on the screen.
2. Inspect the existing screen and nearby screens for header, toolbar, list, modal, and control patterns.
3. Choose the smallest design change that improves the workflow while preserving existing app behavior.
4. Use existing theme tokens from `ThemeProvider` and `src/theme`.
5. Use existing shared and feature components before adding new components.
6. If adding a component, place it according to `agents/componentization.md`.
7. Verify accessibility labels, roles, states, touch targets, and large-font behavior.
8. Run `npm run typecheck`, `npm run lint`, and relevant tests.

## Visual Standards

- Build the actual app surface, not a landing page or explanatory design.
- Prefer compact native controls: icon buttons, segmented controls, chips, switches, sliders, menus, sheets, and rows.
- Keep writing screens quiet and content-first.
- Do not use nested cards.
- Do not add decorative gradient blobs, bokeh, or ornamental backgrounds.
- Do not use visible instructional text to explain obvious controls.
- Use stable dimensions for headers, toolbars, icon buttons, chips, date cells, and sticker canvases.
- Use icons from `@expo/vector-icons` already present in the app.

## React Native Implementation Rules

- Use `StyleSheet.create` and theme tokens.
- Avoid `className` and NativeWind utilities unless NativeWind has been intentionally installed and configured.
- Keep screen files focused on composition, hooks, navigation, and service orchestration.
- Keep business logic out of UI.
- Do not bypass services or repositories.
- Do not hardcode user-facing strings; use localization keys when needed.

## Accessibility Rules

- Icon-only buttons must include `accessibilityLabel` and `accessibilityRole="button"`.
- Toggle, checkbox, radio, expanded, selected, disabled, and busy states must use `accessibilityState`.
- Inputs need labels or hints when placeholder text is not enough.
- Modal content must have an obvious close route.
- Do not rely on color alone for selection, mood, error, or destructive state.
- Ensure large text reflows instead of overlapping.

## Review Output

When presenting a design implementation, summarize:

- Files changed.
- Primary UI behavior changed.
- Any platform or accessibility considerations.
- Commands run.
