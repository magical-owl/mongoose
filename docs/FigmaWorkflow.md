# Meadow Figma Workflow & Screen Specification

## Purpose

This document is the source brief for recreating and improving Meadow in Figma. It describes the current product workflow, screen responsibilities, visual hierarchy, interaction states, and reusable UI patterns. Preserve the information architecture and privacy behavior while improving spacing, typography, clarity, and visual polish.

For implementation-facing design rules and official reference links, see [`docs/AppDesignGuidelines.md`](./AppDesignGuidelines.md). For AI agent UI workflow rules, see [`agents/design.md`](../agents/design.md).

Meadow is a private diary app. The primary user loop is:

1. Open the protected diary.
2. Browse, filter, or search entries from Home.
3. Create or edit an entry with a date, title, rich body, stickers, favorite state, companion, and optional details.
4. Review writing activity in Calendar and Insights.
5. Configure appearance, accessibility, security, privacy, and backups in Settings.

## Product Principles

- Calm, private, personal, and editorial rather than social or gamified.
- The diary entry is the primary object. Controls should support writing, not compete with it.
- Repeated workflows should feel consistent across Home, Calendar, and entry detail.
- Privacy controls must be visible, understandable, and never hidden behind decorative UI.
- Use compact, predictable controls for repeated actions. Avoid oversized cards and excessive rounded containers.
- Every interactive icon needs a familiar icon, accessible label, and visible selected/disabled state.

## Navigation Map

The visible bottom tab bar has five destinations:

| Tab | Icon concept | Function |
| --- | --- | --- |
| Home | Journal/book | Browse diary entries, search, filter, change entry presentation |
| Calendar | Calendar | Browse writing days by month and inspect entries for a selected date |
| Create | Centered plus action | Open the Create Entry composer at `entry/new` |
| Insights | Chart | Review writing metrics, activity, streaks, and trends |
| Settings | Sliders/settings | Configure theme, display, accessibility, security, privacy, profile, and data |

The Create tab is a prominent centered accent action. It is visually distinct from ordinary tabs but must not obscure the tab bar or safe-area inset.

Hidden or shelved routes:

- Archive is not exposed in the tab bar and should not be presented as a primary workflow.
- Profile is not exposed in the tab bar.
- The generic modal route is infrastructure, not a product destination.

## Global Design System

### Layout

- Mobile-first portrait layout with safe-area padding.
- Screen horizontal content inset: use the existing spacing scale, generally 20 px on primary screens.
- Bottom tab bar is persistent on tab screens.
- Keep primary content visually unframed where possible. Use cards for repeated entry items, metrics, and genuinely framed tools.
- Current card radius target: 4 px for diary cards; use 8 px or less for most compact controls.
- Use consistent vertical rhythm. Prefer 8, 12, 16, 20, and 24 px spacing increments.
- Avoid nested cards. A panel may contain rows, but do not put a complete card inside another card unless it is a modal/tool surface.

### Color and Theme

The default theme is dark with an accent color. Light and system modes are supported. Appearance has three independent controls:

- **Theme mode:** Light, Dark, or System controls contrast and operating-system preference.
- **Color theme:** Default, Amber Night, Sage, or Rosewood changes the background, surface, border, and text palette while preserving contrast in both light and dark modes.
- **Accent color:** The existing accent choices control active navigation, buttons, highlights, selected calendar dates, and mood accents.

The warm reference design shown in the Home, Calendar, and Insights screenshots is represented by **Amber Night** in dark mode, paired with a gold/orange accent.

Use semantic tokens rather than hardcoded colors:

- Background: deepest app canvas
- Surface: elevated panel and card surface
- Text: primary readable text
- Text secondary: supporting copy and metadata
- Text tertiary: low-emphasis labels
- Border: dividers and control outlines
- Tint: selected controls, links, active navigation, and highlights
- Success, warning, error, and info: semantic feedback only

Accent choices currently include red, orange, yellow, green, blue, indigo, violet, teal, coral, rose, plum, mint, and slate. Accent selection changes active navigation, buttons, highlights, selected calendar dates, and mood accents.

### Typography and Accessibility

Typography presets are h1, h2, h3, body, bodySmall, caption, button, and label. The user can select Small, Default, or Large global font size and System, Serif, or Monospace font style in Display settings.

Figma designs must show all three font-size states for text-heavy screens. Large text must reflow instead of truncating or overlapping. Do not rely on font size alone to communicate hierarchy; use weight, spacing, and color contrast too.

### Iconography

Use the existing Ionicons and Material Community Icons style: simple outline icons by default, filled state for selected/favorite controls. Keep icon buttons at a stable touch target, approximately 44 px where practical. Do not use decorative emoji as navigation icons.

## Screen Specifications

### 1. App Lock Gate

**Entry condition:** Shown before the app when biometric lock is enabled.

**Purpose:** Protect diary access with Face ID, Touch ID, or device biometrics.

**Layout:**

- Quiet full-screen background.
- Centered lock illustration/icon.
- Short privacy-first heading.
- One primary Authenticate button.
- Clear unavailable/failed biometric state with a recovery explanation.

**States:** loading authentication, authenticated, failed, unavailable, retry.

**Do not show:** diary titles, entry previews, notification content, or private text before authentication.

### 2. Home / Diary Feed

**Purpose:** Primary browse and discovery screen for diary entries.

**Top layout:**

- Left: hamburger/menu icon opens the filter drawer.
- Center/right: segmented Home view switcher with enabled options only: Card, Timeline, Feed.
- Search field below the header: “Search by title or content...”.
- Hierarchy toggle below search: Year / Month / Date, Month / Date, Date only, or No dates.

**Entry grouping:**

- Entries are sorted newest first.
- Optional collapsible year, month, and date groups.
- Date labels use the Display date-format preference.
- Empty state says no entries yet or no matching entries, depending on search/filter state.

**Home view modes:**

- Card: bordered compact diary cards with title, two-line content preview, mood accent when relevant, and chevron.
- Timeline: vertical rail and dot, title, three-line preview, tags, and chevron. No enclosing card treatment.
- Feed: canvas-like read-only entry preview with title, tags, Markdown body, and positioned stickers. The full feed item is tappable; do not add a redundant chevron.

**Filter drawer:**

- Opens from the left and overlays the Home screen.
- Drawer shell has a distinct panel surface, rounded outer right corners, safe-area top/bottom padding, and a dimmed scrim.
- Filter contents: Date, Tag, Mood, Companion, Favorites only, Clear all filters.
- Tapping a filter expands its options in place; do not close the drawer to show a second modal.
- Available options come from existing diary data, not free-text-only controls.
- Selected values use accent color and a clear selected state.

**Home interaction states:** default, searching, active filters, empty results, drawer open, expanded filter, collapsed hierarchy group, locked entry, selected view mode, unavailable view mode.

### 3. Calendar

**Purpose:** Browse writing activity by month and inspect entries for a selected date.

**Layout:**

- Heading “Calendar” with a Today action.
- Month header with previous/next controls and tappable month/year picker.
- Summary row: entries, writing days, favorites.
- Seven-column calendar grid.
- Weekday order follows Display setting: Sunday or Monday.
- Days with entries show accent markers, mood markers, entry count, and favorite indicator.
- Selected date has a strong accent state with readable contrast.
- Entry list below the grid is grouped under the selected date.

**Entry presentation:** The selected-date entry list uses a Calendar-specific compact activity row: accent activity rail, title, two-line preview, diary-entry metadata, optional tags, and chevron. It intentionally has a separate visual language from Home Card, Timeline, and Feed modes.

**States:** no entries on selected date, month with no writing days, selected day with entries, month picker open, today selected, swipe month navigation.

### 4. Create Entry

**Purpose:** Create a diary entry with minimal writing friction.

**Header:**

- Cancel/back on the left.
- Centered “Create Entry”.
- Save on the right.
- If stickers are behind text, show an unstack action before Save.

**Writing surface order:**

1. Centered favorite and three-dot Entry Details controls.
2. Date picker.
3. Title field.
4. Body editor with placeholder “What’s on your mind today? Write freely...”.

**Bottom toolbar:**

- Formatting actions: bold, italic, heading, bullets, quote, code.
- Writing template picker.
- Sticker picker.
- Word count.
- Companion selector.

**Entry Details modal:** Optional structured metadata and personal context. Mood uses manual mood selection, with Neutral first. Mood Weather is a separate personal weather selector. Avoid presenting automated sentiment analysis.

**States:** empty, typing, autosaved draft, saving, saved, validation error, keyboard open, template picker, sticker picker, companion picker, details modal, favorite active, sticker selected, sticker behind text.

### 5. Edit Entry / View Diary

The route uses the same screen for read mode and edit mode.

**View mode:**

- Back on the left.
- Edit and Delete actions on the right.
- Date displayed above the title using the global Display date format.
- Title, tags when present, and full Markdown body.
- Saved stickers are visible and non-editable.
- Locked/time-capsule entries require authentication before private content is shown.

**Edit mode:**

- Cancel on the left.
- Centered “Edit Entry”.
- Save on the right.
- Same writing surface order and toolbar as Create Entry.
- Saved stickers become interactive: drag, resize, rotate, delete, and move behind/in front of text.

**Delete flow:** Destructive confirmation with explicit irreversible-action copy.

### 6. Insights

**Purpose:** Help the user understand writing consistency without pressure or automated mood interpretation.

**Layout:**

- Screen heading “Insights”.
- Compact metric grid: total entries, current streak, average words, writing days, and similar existing metrics.
- Writing Pulse chart for recent activity, currently a seven-day bar chart.
- Consistency/trend section with calendar-style activity markers.
- Future mood trends should use manually selected mood or mood weather only.

**Visual direction:** Insights should feel data-rich but calm. Use compact metric tiles, restrained accent color, readable labels, and clear empty states. Avoid decorative dashboard clutter.

**States:** no entries, sparse history, normal history, long history, streak active, streak empty.

### 7. Settings

**Purpose:** Central configuration and data governance surface.

**List rows:**

- Appearance: dark/light/system, color theme, and accent color.
- Display: date format, first day of week, global font size, font style, and Home view availability toggles.
- AI Companion: choose companion.
- Profile Details: name, email, bio.
- Security & Privacy: biometric lock and remote AI consent.
- Data & Storage: JSON export, encrypted backup, encrypted restore.
- Reset App: destructive full data deletion.

**Display modal:** Scrollable bottom sheet. Use compact sections and accessible radio/toggle controls. Home Views are independent availability toggles; they do not select the active Home view. At least one view must remain enabled.

**Sensitive states:** biometric unavailable, backup password invalid, restore invalid, remote AI consent disabled, reset confirmation.

## Reusable Figma Components

Create these as Figma components with variants rather than redrawing them per screen:

- `AppTabBar`: active/inactive tab, create action, light/dark.
- `IconButton`: default, pressed, selected, disabled, destructive.
- `SegmentedViewSwitcher`: Card, Timeline, Feed; enabled/disabled/selected.
- `DiaryEntryView`: Card, Timeline, Feed; locked, favorite, tags, stickers.
- `DateHierarchy`: year/month/date visibility and collapsed/expanded states.
- `FilterDrawer`: closed/open, filter row collapsed/expanded, active/inactive, empty options.
- `CalendarGrid`: selected day, today, writing day, favorite day, mood markers, empty month.
- `BottomSheetModal`: open/closed, scrollable content, destructive action, error state.
- `DiaryComposer`: create/edit, empty/typing/saving, keyboard states, toolbar states.
- `StickerControls`: selected, dragging, rotating, behind text, locked/non-editable.
- `MetricTile` and `Chart`: empty, loading, populated, selected data point.
- `SettingsRow`: default, selected, toggle, destructive, disabled.

## Prototype Flows to Build in Figma

### Browse and Filter

Home → open drawer → expand Tag → choose a tag → drawer remains open → close drawer → filtered results → clear filters.

### Change Home Presentation

Home → tap view switcher → Card/Timeline/Feed changes in place → navigate to Calendar → selected-date entries use the same presentation.

### Create Entry

Home → Create tab → Create Entry → choose date → enter title/body → open template or sticker picker → toggle favorite → Save → return to Home with the new entry grouped by date.

### Edit and Protect Entry

Home → tap entry → View Diary → Edit → edit body/stickers → Save. For a lockbox entry, show authentication before content and editing.

### Accessibility

Settings → Display → choose Large font → verify Home, Calendar, Insights, Settings, View Diary, and Create Entry reflow without clipping. Choose Serif or Monospace → verify readable text surfaces update consistently.

### Data and Privacy

Settings → Security & Privacy → enable biometric lock or opt into remote AI summaries. Settings → Data & Storage → create encrypted backup or restore. Settings → Reset App → confirm destructive deletion.

## Figma Handoff Requirements

- Name frames by route and state, for example `Home / Card / Active Filter`.
- Keep interactive states as variants, not separate unlinked drawings.
- Annotate scrolling regions, safe areas, keyboard behavior, and bottom-sheet boundaries.
- Annotate every tap target with action and destination.
- Include light, dark, and at least one alternate color theme and accent theme.
- Include Small, Default, and Large font-size examples for text-heavy screens.
- Include empty, loading, error, locked, selected, and destructive states.
- Do not invent automated mood analysis, social sharing, archive navigation, or subscription purchase behavior that is not part of the current workflow.
