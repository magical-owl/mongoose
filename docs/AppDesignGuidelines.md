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

## Current Art Direction

Current theme: soft low-poly journal style.

This section is intentionally isolated so the app can change visual direction later without rewriting the full asset policy. If the art direction changes, update this section first, then regenerate or review affected assets against the new direction.

Use soft low-poly journal art direction for new or regenerated bundled illustration assets:

- Stickers, memory reaction icons, journal cover images, pattern backgrounds, diary paper art, app icon drafts, and splash drafts should use simplified geometric planes, faceted forms, and soft polygonal color blocks.
- Low-poly construction controls the structure: bold silhouettes, readable shapes, angular light planes, and simple faceted shadows.
- Analog journal finishing controls the surface: warm soft-charcoal outlines where needed, gentle line-weight variation, dusty desaturated pastels, subtle paper or colored-pencil grain, and tiny imperfect highlights.
- Use one dominant pastel, one supporting pastel, one darker earthy accent, and neutral cream where useful.
- Avoid glossy gradients, noisy crayon strokes, visible repeated bands, heavy sketch outlines, and thin icon-like line art.
- Keep details sparse enough to remain readable at small mobile sizes.
- Generate bundled assets at the smallest source size that stays crisp at their intended in-app scale. Stickers and reaction icons should not be full-screen sized assets; reserve large exports for journal covers, splash, and platform-required icon files.
- A subtle storybook tilt and one tiny imperfect four-point spark may be used when compositionally appropriate.
- Do not use named artist, studio, franchise, brand, sticker-pack, or game references to define the style. Describe medium and structure instead: faceted, geometric, soft matte color, charcoal outline, dusty pastel palette, subtle paper grain, cozy diary tone.

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
- Keep the journal banner immersive. Do not collapse or hide the journal cover on scroll unless a later design decision explicitly changes that behavior.
- Collapsible calendar chrome should reset to visible when the calendar tab regains focus.
- Calendar content should keep rendering during background refreshes; avoid returning an empty screen while stored entries reload.
- Journal detail/list screens should render from cached entries and route-provided journal metadata while repositories refresh in the background.
- Screen headers should keep primary navigation and one primary screen action visible, while secondary controls live in that screen's burger menu with Settings available from the same menu.
- Burger-menu surfaces should use the shared `SlidingDrawer` component so drawer animation, overlay dismissal, and swipe-to-close behavior stay consistent across screens.
- Feed cover title overlays should use the lightest scrim that keeps text readable, and author name/time should live with the diary body rather than as a separate card between cover and content.
- Multiple entry moods should render as individual color-coded chips, not a single combined text badge. Tight rows should cap visible chips and use a compact `+n` overflow indicator so the UI stays scannable while each visible mood keeps its own color.
- When entries are grouped under visible date headers, card rows should not repeat the same date rail.
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
- Date, title, and body use an editorial writing hierarchy: compact accent date row, italic serif-like title treatment, subtle divider, and a body editor area that leaves mood, journal, and tag controls reachable in the first compose view.
- Mood, journal, and tag controls sit below the body as compact horizontal sections with uppercase labels, rounded surface chips, and warning-accent selected states.
- Selected moods can contain more than one value. Each selected mood should remain visually distinct through its own mood color, with neutral treated as an exclusive state.
- The editor footer is an inset rounded toolbar above the safe area or keyboard. Footer icons use one neutral inactive treatment; active formatting is the only accent-highlighted state. Related inactive icon pairs may sit together for spacing, but should not use colored group wells.
- Expanded formatting controls should collapse when the user taps the writing surface, starts scrolling, or dismisses the keyboard.
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

### Pattern Backgrounds

- Decorative wallpaper backgrounds should use `src/shared/components/PatternBackground.tsx` so opacity, tiling, accessibility hiding, and theme behavior stay consistent.
- Pattern variants should use generated transparent PNG tiles under `assets/patterns/` with provenance recorded in `assets/patterns/README.md`. Do not copy reference wallpaper art into the app.
- Always keep a `none` option available so users can disable decorative backgrounds.
- Keep motifs subtle enough for light and dark mode content to remain readable, and keep meaningful images in the foreground rather than relying on background decoration.

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
