# App Design Guidelines

## Purpose

This document is the practical design brief for Mongoose. Use it when designing or reviewing screens, components, and interaction patterns before implementation.

Current audit report: [`docs/DesignAudit.md`](./DesignAudit.md).

Mongoose is a private diary app. The UI should feel calm, personal, native, and writing-first. It should never feel like a marketing page, a social feed, or a decorative dashboard.

## Source References

Use these sources when a design decision needs platform or framework grounding:

| Area | Source |
| --- | --- |
| iOS and Apple platforms | [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) |
| Apple UI kits, templates, icons, color guides | [Apple Design Resources](https://developer.apple.com/design/resources/) |
| Android direction | [Material Design 3](https://m3.material.io/) |
| Expo SDK 57 APIs | [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) |
| File-based navigation | [Expo Router introduction](https://docs.expo.dev/router/introduction/) |
| Native UI primitives from Expo | [Expo UI SwiftUI guide](https://docs.expo.dev/guides/expo-ui-swift-ui/) |
| React Native accessibility | [React Native Accessibility](https://reactnative.dev/docs/accessibility) |
| Optional utility styling reference | [NativeWind documentation](https://www.nativewind.dev/docs/getting-started/installation) |

NativeWind is a reference only. This app currently uses React Native `StyleSheet` and theme tokens, not NativeWind.

## Design Principles

- Writing is the primary task. Controls should support composition, browsing, and recovery without competing with diary content.
- Privacy is visible and understandable. Lock, recovery bin, export, deletion, and AI controls must be clear.
- Prefer native platform patterns over custom novelty. Use familiar headers, sheets, segmented controls, pickers, switches, icon buttons, and tab behavior.
- Keep layouts dense enough for repeated use. Avoid large decorative cards, nested cards, oversized hero sections, and explanatory in-app text.
- Use stable dimensions for icon buttons, chips, segmented controls, date cells, cards, stickers, and toolbars so state changes do not shift layout.
- Use visual hierarchy through spacing, weight, contrast, and grouping. Do not rely only on color.

## Current Styling Stack

- Theme source: `src/providers/ThemeProvider.tsx`
- Theme primitives: `src/theme/`
- Shared UI: `src/shared/components/`
- Feature UI: `src/features/<feature>/components/`
- Screen composition: `app/`

Implementation rules:

- Use theme tokens for colors, spacing, typography, border radius, and semantic state.
- Do not hardcode colors in app or feature components unless the value is an external asset color or a temporary migration value with a clear reason.
- Do not introduce NativeWind without an explicit architecture decision. If adopted later, define token mapping, migration scope, lint rules, and coexistence rules first.

## Screen-Level Patterns

### Headers

- Use icon buttons for back, close, save, edit, delete, menu, options, and create actions.
- Keep left and right header clusters stable across related screens.
- When profile access sits beside menu access, place the profile avatar first and the menu button second so identity and navigation remain separate.
- Avoid text buttons when a familiar icon exists and the accessible label can describe the action.
- Header bottom spacing should be compact; use a hairline divider only when it improves orientation.

### Lists and Feeds

- Card view can use compact bordered cards.
- Timeline view should be unframed and scannable.
- Feed view can show richer content and sticker previews.
- User identity should be compact and contextual: 32 px avatar rows for feed authorship, 24 px avatars for reflection threads, and 20-24 px avatars in dense card/timeline rows.
- Empty states should be short and action-oriented.
- Filters should use current diary data, not only free-text inputs.

### Composer

- Title, content, mood, tags, journal selection, photos, favorite, stickers, and entry details must feel like one writing surface.
- Secondary details belong in compact rows, sheets, or modals.
- The formatting toolbar should stay reachable above the keyboard.
- Sticker drag, selection, layering, and scrolling must not fight each other.

#### Diary Composer Pattern

- Create and edit entry forms share the same visual chrome through `src/features/diary/components/DiaryEntryEditorChrome.tsx`.
- The composer header uses a compact safe-area-aware row: circular close/back control on the left, centered route title, favorite and save controls on the right, with stable dimensions so the title does not jump.
- The cover image is a rounded landscape block below the header with an explicit gap. Empty cover state uses a centered camera action and label; selected covers keep the same rounded frame.
- Date, title, and body use an editorial writing hierarchy: compact accent date row, italic serif-like title treatment, subtle divider, and a generous body editor area.
- Mood, journal, and tag controls sit below the body as compact horizontal sections with uppercase labels, rounded surface chips, and warning-accent selected states.
- The editor footer is an inset rounded toolbar above the safe area or keyboard. Footer icons use one neutral inactive treatment; active formatting is the only accent-highlighted state.
- Composer scroll content must reserve the footer height, footer bottom offset, safe-area inset, and a trailing gap so mood, journal, and tag controls are fully visible at the bottom of the scroll.
- Keep new composer controls token-driven and componentized. Use `IconCircleButton`, `AccentPillButton`, `InsetFloatingToolbar`, and `SectionLabel` for matching controls elsewhere in the app. Do not reintroduce separate create/edit styling for header, cover sizing, body sizing, or footer layout.

### Settings

- Settings should be grouped by user intent: Display, Writing, Privacy and Security, Data, Subscription, About.
- Use rows, switches, segmented controls, and sheets. Avoid turning settings into a grid of large cards.
- Destructive controls must be visually distinct and require confirmation.

## Component Guidelines

- Extract reusable UI when the same behavior appears on two screens or the screen is carrying a complete reusable workflow.
- Screen files own navigation, hooks, services, and route params.
- Components own layout, visual states, accessibility labels, and typed callbacks.
- Prefer Ionicons or Material Community Icons already used in the app.
- Keep card radius at 8 px or less unless a platform-native sheet/modal requires otherwise.
- Use `ProfileAvatar` for profile pictures and initials fallback instead of duplicating avatar sizing, border, or fallback logic.

## Accessibility Checklist

- Every touch target should be roughly 44 px where practical.
- Every icon-only button needs `accessibilityLabel` and `accessibilityRole`.
- Selected, disabled, checked, expanded, and busy controls need `accessibilityState`.
- Text must support the app font-size preference and should not truncate important diary actions.
- Do not use color alone to communicate mood, error, selection, lock state, or destructive actions.
- Modals and sheets must have clear close behavior and focus-safe content order.

## Design Review Checklist

- [ ] The screen uses existing theme tokens and component patterns.
- [ ] Primary action placement matches related screens.
- [ ] Controls are familiar native patterns.
- [ ] Text fits at small, default, and large font scales.
- [ ] Empty, loading, selected, disabled, and error states are represented.
- [ ] Privacy and destructive actions are explicit.
- [ ] The design can be implemented in React Native without fragile absolute positioning, except for intentional canvases such as stickers.
- [ ] The design has a clear test or screenshot verification plan.
