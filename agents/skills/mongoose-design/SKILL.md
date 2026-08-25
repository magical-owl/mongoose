---
name: mongoose-design
description: Use when designing, redesigning, reviewing, or implementing Mongoose app UI, including diary screens, composer flows, journal lists, calendar, insights, settings, stickers, themes, accessibility, native platform patterns, Expo Router navigation surfaces, and React Native styling decisions.
---

# Mongoose Design

Use this skill for Mongoose UI work.

## First Reads

Read these local files before making UI changes:

- `docs/AppDesignGuidelines.md`
- `docs/DesignSystem.md`
- `docs/FigmaWorkflow.md`
- `agents/componentization.md`
- `docs/Accessibility.md`

If the change touches Expo APIs, also read `agents/expo.md` and the Expo SDK 57 docs.

## External References

Use official references when platform details matter:

- Apple HIG: `https://developer.apple.com/design/human-interface-guidelines/`
- Apple Design Resources: `https://developer.apple.com/design/resources/`
- Material Design 3: `https://m3.material.io/`
- Expo SDK 57: `https://docs.expo.dev/versions/v57.0.0/`
- Expo Router: `https://docs.expo.dev/router/introduction/`
- Expo UI SwiftUI: `https://docs.expo.dev/guides/expo-ui-swift-ui/`
- React Native Accessibility: `https://reactnative.dev/docs/accessibility`
- NativeWind: `https://www.nativewind.dev/docs/getting-started/installation`

NativeWind is reference-only unless the user explicitly asks to adopt it. The current app uses `StyleSheet` and theme tokens.

## Workflow

1. Identify the screen's primary workflow and primary object.
2. Inspect adjacent screens for existing header, toolbar, modal, list, and picker patterns.
3. Reuse shared or feature components before adding new ones.
4. Keep screen files responsible for route composition, hooks, navigation, and service orchestration.
5. Use `StyleSheet.create` and theme values from `useTheme`.
6. Add localization keys for new user-facing text.
7. Validate accessibility roles, labels, states, touch target size, and large-text behavior.
8. Run `npm run typecheck`, `npm run lint`, and relevant tests.

## Visual Rules

- Writing screens must be quiet, content-first, and compact.
- Use familiar native controls: icon buttons, segmented controls, chips, switches, sliders, menus, sheets, and rows.
- Use existing Ionicons or Material Community Icons.
- Avoid nested cards, decorative gradients, bokeh, and unnecessary explanatory text.
- Keep dimensions stable for headers, buttons, chips, date cells, cards, toolbars, and sticker canvases.
- Do not rely on color alone for state or meaning.
