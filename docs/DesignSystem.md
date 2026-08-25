# Design System

## Overview

The Meadow Design System provides a unified visual language and component library that ensures consistency across iOS and Android platforms. It is organized into theme tokens, a component catalog, usage guidelines, and platform-specific adaptations.

For app-specific screen and interaction guidance, see [`docs/AppDesignGuidelines.md`](./AppDesignGuidelines.md). For agent UI workflow rules, see [`agents/design.md`](../agents/design.md).

---

## Theme Tokens

### Colors

#### Primary Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `color.primary` | `#5B67CA` | `#7C85D6` | Primary actions, key UI elements |
| `color.primaryContainer` | `#E0E2F8` | `#3A3F7A` | Surfaces using primary tint |
| `color.onPrimary` | `#FFFFFF` | `#FFFFFF` | Text/icons on primary backgrounds |
| `color.secondary` | `#43A47C` | `#5EBC92` | Secondary actions, success states |
| `color.secondaryContainer` | `#D8F0E4` | `#2A5E48` | Surfaces using secondary tint |
| `color.onSecondary` | `#FFFFFF` | `#FFFFFF` | Text/icons on secondary backgrounds |

#### Neutral Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `color.background` | `#F8F9FA` | `#121212` | App background |
| `color.surface` | `#FFFFFF` | `#1E1E1E` | Card and sheet backgrounds |
| `color.surfaceVariant` | `#F0F0F3` | `#2C2C2E` | Subtle surface differentiation |
| `color.outline` | `#C6C6C8` | `#48484A` | Borders, dividers, disabled states |
| `color.text.primary` | `#1C1C1E` | `#F2F2F7` | Primary body text |
| `color.text.secondary` | `#6B7280` | `#A1A1A6` | Secondary/caption text |
| `color.text.inverse` | `#FFFFFF` | `#1C1C1E` | Text on dark backgrounds |

#### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `color.error` | `#D32F2F` | `#EF5350` | Error states, destructive actions |
| `color.warning` | `#F59E0B` | `#FBBF24` | Warning states |
| `color.success` | `#10B981` | `#34D399` | Success confirmations |
| `color.info` | `#3B82F6` | `#60A5FA` | Informational banners |

---

### Spacing

| Token | Value (pt) | Usage |
|---|---|---|
| `spacing.xs` | 4 | Minimal gap, inner padding |
| `spacing.sm` | 8 | Tight spacing between related elements |
| `spacing.md` | 16 | Default spacing between components |
| `spacing.lg` | 24 | Section spacing |
| `spacing.xl` | 32 | Large section separation |
| `spacing.xxl` | 48 | Screen-level margins |
| `spacing.xxxl` | 64 | Hero/spash spacing |

### Layout Grid

```swift
enum LayoutGrid {
    static let columns: Int = 4  // compact width
    static let columnsWide: Int = 8  // regular width
    static let gutter: CGFloat = 16
    static let margin: CGFloat = 16
}
```

---

### Typography

#### Font Family

- **Primary**: Inter (iOS/macOS), system default (Android fallback)
- **Monospace**: JetBrains Mono (iOS/macOS), system monospace (Android fallback)

#### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `typography.display` | 34pt | Bold (700) | 41pt | Large hero titles |
| `typography.h1` | 28pt | Bold (700) | 34pt | Primary headings |
| `typography.h2` | 22pt | SemiBold (600) | 28pt | Section headings |
| `typography.h3` | 20pt | SemiBold (600) | 25pt | Card/group headings |
| `typography.body` | 16pt | Regular (400) | 24pt | Body text |
| `typography.bodySmall` | 14pt | Regular (400) | 20pt | Secondary text |
| `typography.caption` | 12pt | Regular (400) | 16pt | Labels, timestamps |
| `typography.button` | 16pt | Medium (500) | 20pt | Button labels |
| `typography.overline` | 11pt | Medium (500) | 16pt | Section overlines, badges |

---

### Shadows

| Token | Offset | Radius | Opacity | Usage |
|---|---|---|---|---|
| `shadow.sm` | (0, 1) | 2 | 0.05 | Subtle elevation, cards |
| `shadow.md` | (0, 2) | 6 | 0.08 | Raised elements, menus |
| `shadow.lg` | (0, 4) | 12 | 0.10 | Modals, sheets |
| `shadow.xl` | (0, 8) | 24 | 0.12 | Full-screen overlays |

---

## Component Catalog

### Buttons

| Component | Variants | States |
|---|---|---|
| `PrimaryButton` | Default, Destructive | Normal, Pressed, Disabled, Loading |
| `SecondaryButton` | Default, Destructive | Normal, Pressed, Disabled |
| `TextButton` | Default, Destructive | Normal, Pressed, Disabled |
| `IconButton` | Size (sm, md, lg) | Normal, Pressed, Disabled |

### Inputs

| Component | Variants | States |
|---|---|---|
| `TextField` | Outlined, Filled | Normal, Focused, Error, Disabled |
| `SearchBar` | — | Normal, Focused, Active |
| `Picker` | Menu, Wheel | Normal, Disabled |
| `DatePicker` | Date, Time, DateTime | Normal, Disabled |

### Feedback

| Component | Variants |
|---|---|
| `Toast` | Success, Error, Warning, Info |
| `Alert` | Confirmation, Destructive, Informational |
| `Progress` | Linear, Circular, Indeterminate |
| `Skeleton` | Text, Avatar, Card, List |

### Navigation

| Component | Variants |
|---|---|
| `TabBar` | Top, Bottom |
| `NavigationBar` | Large, Inline |
| `BottomSheet` | Peek, Half, Full |
| `SegmentedControl` | Text, Icon |

### Containers

| Component | Variants |
|---|---|
| `Card` | Elevated, Outlined, Filled |
| `ListRow` | Default, Swipeable, Reorderable |
| `Divider` | Full, Inset, Vertical |
| `Badge` | Dot, Number, Label |

---

## Usage Guidelines

### Naming Conventions

- Components use PascalCase: `PrimaryButton`, `TextField`.
- Modifiers use snake_case: `button.primary()`, `text_field.error()`.
- Theme tokens use dot notation: `color.primary`, `spacing.md`, `typography.body`.

### Composition Rules

1. **Preference for composition over inheritance** — Build complex UI by composing smaller components.
2. **Use semantic tokens, not raw values** — Never hardcode colors, spacing, or font sizes.
3. **Components own their layout** — Each component manages its internal padding; containers manage external spacing.
4. **Accessibility is non-negotiable** — Every component must support Dynamic Type, VoiceOver/TalkBack, and minimum contrast ratios.

### Code Example

```swift
struct ProfileCard: View {
    var body: some View {
        Card(elevation: .sm) {
            VStack(spacing: .md) {
                Avatar(size: .lg)
                Text("Jane Doe")
                    .font(.theme(.h3))
                    .foregroundColor(.theme(.textPrimary))
                Text("Designer")
                    .font(.theme(.bodySmall))
                    .foregroundColor(.theme(.textSecondary))
            }
            .padding(.md)
        }
    }
}
```

---

## Customization Approach

### Theming Engine

The design system uses a `Theme` protocol that defines all token values. Applications can provide custom theme instances:

```swift
protocol Theme {
    var colors: ColorPalette { get }
    var spacing: SpacingScale { get }
    var typography: TypographyScale { get }
    var shadows: ShadowScale { get }
}

struct DefaultTheme: Theme { ... }
struct CustomBrandTheme: Theme { ... }
```

### Override Mechanism

Individual tokens can be overridden at the view level:

```swift
struct ContentView: View {
    var body: some View {
        VStack {
            Text("Custom Section")
                .foregroundColor(Color.theme(.primary))
        }
        .themeOverride(\.colorPrimary, Color.red)
    }
}
```

### Runtime Switching

Themes can be switched at runtime (e.g., white-label support):

```swift
ThemeManager.shared.current = CustomBrandTheme()
```

---

## Platform-Specific Adaptations

### iOS (SwiftUI / UIKit)

- Use `.font(.theme(...))` modifier backed by `UIFontMetrics` for Dynamic Type.
- Shadows mapped to `CALayer.shadow*` properties.
- Navigation components use `UINavigationController` / `NavigationStack`.
- Haptics via `UIImpactFeedbackGenerator` for button presses.

### Android (Jetpack Compose)

- Use `MaterialTheme.typography` with custom `Typography` object.
- Shadows mapped to `elevation` parameter.
- Navigation components use `NavigationBar` / `BottomSheetScaffold`.
- Haptics via `HapticFeedback` in Compose.

### Web (React)

- CSS custom properties for tokens: `--color-primary`, `--spacing-md`.
- Shadows mapped to `box-shadow` values.
- Navigation components use React Router integration.

---

## Accessibility Integration

### Minimum Requirements

- **Contrast Ratio**: 4.5:1 for normal text, 3:1 for large text (18pt+).
- **Touch Targets**: Minimum 44x44pt tappable area.
- **Dynamic Type**: All text scales up to XXXL size without truncation or overlap.
- **Screen Reader Labels**: Every interactive element must have an accessible label.
- **Focus Indicators**: Visible keyboard focus state on all interactive elements.

### Implementation

```swift
struct AccessibleButton: View {
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.theme(.button))
        }
        .frame(minWidth: 44, minHeight: 44)
        .accessibilityLabel(label)
        .accessibilityAddTraits(.isButton)
    }
}
```

### Testing

- Use SwiftUI Preview variants for Dynamic Type sizes.
- Run VoiceOver/TalkBack walkthroughs for every new screen.
- Verify color contrast with Xcode Accessibility Inspector or Android Accessibility Scanner.
