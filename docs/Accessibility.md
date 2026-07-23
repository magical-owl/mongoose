# Accessibility Guidelines

## VoiceOver / TalkBack Support

### Principles

All interactive elements must be accessible via screen readers. Users should be able to navigate the entire app using VoiceOver (iOS) or TalkBack (Android) without encountering unlabeled or inaccessible elements.

### Implementation

```tsx
// src/components/AccessibleButton.tsx
import React from 'react';
import { TouchableOpacity, Text, AccessibilityProps, ViewStyle } from 'react-native';

interface AccessibleButtonProps extends AccessibilityProps {
  onPress: () => void;
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onPress,
  label,
  hint,
  children,
  style,
  ...accessibilityProps
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hint}
    accessibilityState={accessibilityProps.accessibilityState}
    style={style}
    {...accessibilityProps}
  >
    {children}
  </TouchableOpacity>
);
```

### Screen Reader Rules

| Rule | Rationale |
|------|-----------|
| Every interactive element must have `accessibilityLabel` | Screen readers announce the label when the element is focused |
| Provide `accessibilityHint` for non-obvious actions | Describes the result of performing the action |
| Group related elements with `accessibilityRole="header"` or `accessibilityRole="summary"` | Helps screen reader users navigate by regions |
| Use `accessibilityLiveRegion` for dynamic content updates | Announces changes without refocusing |
| Set `accessibilityElementsHidden` for decorative/animated elements | Prevents clutter and confusion |
| Use `importantForAccessibility` to control focus order | Ensures logical navigation flow |

### Testing with Screen Readers

```bash
# iOS: Enable VoiceOver
# Settings > Accessibility > VoiceOver > Toggle On

# Android: Enable TalkBack
# Settings > Accessibility > TalkBack > Toggle On

# Common VoiceOver gestures
# - Swipe right: Next element
# - Swipe left: Previous element
# - Double tap: Activate element
# - Two-finger swipe down: Read all from top
```

## Accessibility Labels and Hints

### Labeling Conventions

```tsx
// Good: Clear, descriptive label
<AccessibleButton
  label="Add new task"
  hint="Opens a form to create a new to-do item"
  onPress={handleAddTask}
>
  <PlusIcon />
</AccessibleButton>

// Good: Dynamic labels with context
<Text
  accessible={true}
  accessibilityLabel={`Task ${taskTitle}, due ${dueDate}, priority ${priority}`}
>
  {taskTitle}
</Text>

// Bad: Label derived from icon name or generic text
<AccessibleButton
  label="Star"  // Ambiguous: star what?
  onPress={handleFavorite}
>
  <StarIcon />
</AccessibleButton>

// Bad: Redundant "button" suffix
<AccessibleButton
  label="Submit button"  // Role already announced as "button"
  onPress={handleSubmit}
>
  <Text>Submit</Text>
</AccessibleButton>
```

### Label Guidelines

- Start with the most important information (e.g., action or name).
- Include context: state, position, or relationship to other elements.
- Do not include the element type (e.g., "button", "link") — the accessibility role handles this.
- Keep labels concise but descriptive (aim for 3-5 words).
- Update labels dynamically when content changes.

## Dynamic Type Support

### Using System Font Scaling

```tsx
// src/styles/typography.ts
import { DynamicTypeIOS, Platform } from 'react-native';

// iOS: Use Dynamic Type text styles
export const Typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.37,
    ...Platform.select({
      ios: DynamicTypeIOS('largeTitle') as any,
      android: {},
    }),
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.34,
    ...Platform.select({
      ios: DynamicTypeIOS('title1') as any,
      android: {},
    }),
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.26,
    ...Platform.select({
      ios: DynamicTypeIOS('title2') as any,
      android: {},
    }),
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    ...Platform.select({
      ios: DynamicTypeIOS('body') as any,
      android: {},
    }),
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    ...Platform.select({
      ios: DynamicTypeIOS('callout') as any,
      android: {},
    }),
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    ...Platform.select({
      ios: DynamicTypeIOS('caption1') as any,
      android: {},
    }),
  },
};

// Use allowFontScaling for custom components
<Text allowFontScaling={true} style={Typography.body}>
  This text respects Dynamic Type settings.
</Text>
```

### Responsive Layout Adjustments

```tsx
// src/hooks/useContentSizeCategory.ts
import { useWindowDimensions, PixelRatio, Platform } from 'react-native';

export function useScaledSize(baseSize: number, scaleFactor: number = 0.5): number {
  const { fontScale } = useWindowDimensions();
  
  if (Platform.OS === 'ios') {
    // iOS handles scaling via Dynamic Type
    return baseSize;
  }
  
  // Android: manually scale
  return PixelRatio.roundToNearestPixel(baseSize * (1 + (fontScale - 1) * scaleFactor));
}

// Usage
const scaledPadding = useScaledSize(16, 0.3);
```

### Dynamic Type Testing

- Test with all accessibility text sizes in system settings.
- Ensure no text truncation or overlap at the largest accessibility size.
- Ensure no layout breakage at the smallest text size.
- Verify touch targets remain at least 44x44 points at all text sizes.

## Color Contrast Ratios (WCAG AA Minimum)

### Contrast Requirements

| Text Type | Minimum Contrast Ratio | Example |
|-----------|----------------------|---------|
| Normal text (< 18px / < 14pt bold) | 4.5:1 | Body text, labels |
| Large text (>= 18px / >= 14pt bold) | 3:1 | Headlines, titles |
| UI components and graphical objects | 3:1 | Icons, charts, borders |
| Disabled text | No minimum requirement | Must still be perceivable |

### Color Palette with Contrast Validation

```tsx
// src/styles/colors.ts
export const Colors = {
  // Primary palette
  primary: '#4A90D9',       // Blue main
  primaryText: '#1A1A1A',   // On primary: 6.5:1 ratio
  primaryLight: '#B3D4F9',  // Blue light (for backgrounds only, not text)

  // Text colors
  textPrimary: '#1A1A1A',   // Black text: 19.6:1 on white
  textSecondary: '#595959',  // Gray text: 6.2:1 on white (passes AA)
  textTertiary: '#8C8C8C',  // Light gray: 3.0:1 on white (use for large text only)
  textDisabled: '#BFBFBF',  // Disabled: 1.8:1 (no minimum required)

  // Background colors
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundDark: '#1A1A1A',
  backgroundDarkSecondary: '#2C2C2C',

  // Semantic colors
  success: '#52C41A',       // Green
  successText: '#1A1A1A',   // On green: 5.0:1 ratio
  warning: '#FAAD14',       // Yellow/amber
  warningText: '#1A1A1A',   // On amber: 11.2:1 ratio
  error: '#F5222D',         // Red
  errorText: '#FFFFFF',     // On red: 4.8:1 ratio

  // Contrast validation notes (against white background)
  // primary (#4A90D9) on white: 2.9:1 - use for large UI only
  // primaryText (#1A1A1A) on white: 19.6:1 - passes AA
  // textSecondary (#595959) on white: 6.2:1 - passes AA
  // textTertiary (#8C8C8C) on white: 3.0:1 - large text only
};

/**
 * WCAG contrast ratio calculator
 * @see https://www.w3.org/TR/WCAG21/#contrast-minimum
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const luminance1 = getRelativeLuminance(hexToRgb(hex1));
  const luminance2 = getRelativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
```

### Dark Mode Considerations

- Test all color pairs in both light and dark modes.
- Re-validate contrast ratios for dark mode color overrides.
- Avoid relying solely on color to convey information (add icons, text, or patterns).

## Reduce Motion Support

### Accessibility Motion Preference

```tsx
// src/hooks/useReducedMotion.ts
import { AccessibilityInfo, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );
    return () => subscription.remove();
  }, []);

  return reduceMotionEnabled;
}
```

### Conditional Animation

```tsx
// src/components/AnimatedView.tsx
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface AnimatedViewProps {
  children: React.ReactNode;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({ children }) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <View>{children}</View>;
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
      {children}
    </Animated.View>
  );
};
```

### Animation Guidelines

| Animation Type | Standard Behavior | Reduced Motion Behavior |
|---------------|------------------|------------------------|
| Screen transitions | Slide/fade | Instant (no animation) |
| Loading indicators | Spinner/pulse | Static spinner |
| Pull-to-refresh | Spring animation | Instant refresh |
| Gesture feedback | Scale/opacity | Instant state change |
| Parallax scrolling | Movement parallax | Disabled |
| Particle effects | Full animation | Disabled entirely |

## Focus Management

### Logical Focus Order

```tsx
// src/components/Form.tsx
import React, { useRef } from 'react';
import { TextInput, View, Button } from 'react-native';

export const LoginForm = () => {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleEmailSubmit = () => {
    passwordRef.current?.focus();
  };

  const handlePasswordSubmit = () => {
    // Submit form
  };

  return (
    <View>
      <TextInput
        ref={emailRef}
        placeholder="Email"
        returnKeyType="next"
        onSubmitEditing={handleEmailSubmit}
        accessibilityLabel="Email address"
        accessibilityHint="Enter your registered email address"
      />
      <TextInput
        ref={passwordRef}
        placeholder="Password"
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={handlePasswordSubmit}
        accessibilityLabel="Password"
        accessibilityHint="Enter your password"
      />
      <Button
        title="Sign In"
        onPress={handlePasswordSubmit}
        accessibilityLabel="Sign in"
        accessibilityHint="Submits your credentials"
      />
    </View>
  );
};
```

### Focus Management Rules

- Focus should follow a logical order: top-to-bottom, left-to-right (for LTR languages).
- Use `ref` to programmatically move focus when appropriate (e.g., after form submission).
- After a modal opens, focus the first interactive element inside the modal.
- After a modal closes, return focus to the element that triggered the modal.
- Do not trap focus unless within a modal or bottom sheet (and provide a clear dismiss action).
- Announce focus changes with `accessibilityLiveRegion`.

## Accessibility Testing Procedures

### Manual Testing Checklist

Run before every release:

- [ ] **Screen Reader Navigation**: Navigate every screen using VoiceOver/TalkBack only.
- [ ] **All Interactive Elements**: Verify every button, link, input, and control has a proper `accessibilityLabel`.
- [ ] **Screen Reader Hints**: Verify `accessibilityHint` is provided for non-obvious actions.
- [ ] **Focus Order**: Verify logical focus traversal on every screen.
- [ ] **Dynamic Type**: Test at all accessibility text sizes (iOS: Settings > Accessibility > Display & Text Size > Larger Text; Android: Settings > Accessibility > Font Size).
- [ ] **Color Contrast**: Verify all text/UI contrast meets WCAG AA minimums.
- [ ] **Color Blindness**: Test using grayscale mode or color blindness simulators to ensure no information is conveyed solely by color.
- [ ] **Reduce Motion**: Verify animations are disabled or reduced with `Reduce Motion` enabled.
- [ ] **Touch Targets**: Verify all touch targets are at least 44x44 points.
- [ ] **Form Validation**: Verify error messages are announced by screen readers.
- [ ] **Modal/Dialog Focus**: Verify focus traps and return focus correctly.
- [ ] **Orientation**: Test in both portrait and landscape.
- [ ] **Dark Mode**: Test all screens and components in dark mode.

### Automated Testing

```bash
# React Native Accessibility API testing with Jest
npx jest --testPathPattern="accessibility"

# Example test
describe('AccessibleButton', () => {
  it('should have correct accessibility label', () => {
    const { getByA11yLabel } = render(
      <AccessibleButton label="Save changes" hint="Saves the current form data" onPress={jest.fn()}>
        <Text>Save</Text>
      </AccessibleButton>
    );

    const button = getByA11yLabel('Save changes');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityHint).toBe('Saves the current form data');
  });
});
```

### Tools

- **Xcode Accessibility Inspector**: Inspect and test accessibility on iOS simulator.
- **Android Accessibility Scanner**: Automated scans for accessibility issues on Android.
- **axe DevTools** (Web): For web-based components in Expo (if using `@expo/web`).
- **Color Contrast Analyzers**: WebAIM Contrast Checker, Stark plugin (Figma).
- **Simulators**: iOS Simulator VoiceOver, Android Emulator TalkBack.

## Component Accessibility Checklist

| Component | Required Props | Notes |
|-----------|---------------|-------|
| `Button` | `accessibilityLabel`, `accessibilityHint` | Role is auto-detected |
| `TouchableOpacity` | `accessible={true}`, `accessibilityRole`, `accessibilityLabel` | Must set `accessible` manually |
| `TextInput` | `accessibilityLabel`, `accessibilityHint` | Use `placeholder` as fallback label |
| `Image` | `accessibilityLabel` (if informative) | Use `aria-hidden` for decorative images |
| `ImageBackground` | `accessibilityLabel` | Describe the content, not the container |
| `FlatList` | `accessibilityLabel` for list header/footer | Ensure `accessible={true}` on list items |
| `Modal` | `accessibilityViewIsModal={true}` | Trap focus inside modal |
| `Switch` | `accessibilityLabel`, `accessibilityState={{ checked }}` | Announce checked/unchecked state |
| `Slider` | `accessibilityLabel`, `accessibilityValue={{ min, max, now }}` | Announce current value |
| `ProgressBar` | `accessibilityRole="progressbar"`, `accessibilityValue` | Announce progress percentage |
| `ScrollView` | `accessibilityRole="scroll"` | Verify scroll target focus |
| `WebView` | Use native accessibility props | Ensure web content is accessible |
| Custom gesture handler | `accessibilityActions` + `onAccessibilityAction` | Provide custom action support |
| Tab bar | `accessibilityRole="tab"` on tabs, `accessibilityState={{ selected }}` | Announce selected state |
| Navigation header | `accessibilityRole="header"` | Used for region navigation |

### Accessibility Audit Script

```bash
# Run accessibility audit before each release
npx react-native-accessibility-checker --platform ios --path ./src
npx react-native-accessibility-checker --platform android --path ./src
```
