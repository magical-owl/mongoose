/**
 * Text Component
 *
 * A themed text component supporting typography presets, color variants,
 * and Dynamic Type on iOS.
 */

import React, { useMemo } from 'react';
import {
  Text as RNText,
  Platform,
  type TextProps as RNTextProps,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import type { FontSizeToken } from '@theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextPreset =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'label';

export type TextColorVariant =
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'tint'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'background';

export interface TextProps extends Omit<RNTextProps, 'style' | 'children'> {
  /** Text content */
  readonly children: React.ReactNode;
  /** Typography preset */
  readonly preset?: TextPreset;
  /** Color variant from theme (defaults to text) */
  readonly color?: TextColorVariant | string;
  /** Whether to use Dynamic Type scaling on iOS */
  readonly dynamicType?: boolean;
  /** Additional text styles */
  readonly style?: StyleProp<TextStyle>;
  /** Accessibility label (defaults to children if string) */
  readonly accessibilityLabel?: string;
  /** Optional max number of lines */
  readonly numberOfLines?: number;
}

// ---------------------------------------------------------------------------
// Preset to Dynamic Type mapping (iOS)
// ---------------------------------------------------------------------------

const presetToDynamicType: Record<TextPreset, string> = {
  h1: 'largeTitle',
  h2: 'title1',
  h3: 'title2',
  body: 'body',
  bodySmall: 'callout',
  caption: 'caption1',
  button: 'headline',
  label: 'subheadline',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Text({
  children,
  preset = 'body',
  color,
  dynamicType = true,
  style,
  accessibilityLabel,
  numberOfLines,
  ...rest
}: TextProps): React.JSX.Element {
  const theme = useTheme();

  const resolvedColor = useMemo(() => {
    // If a theme color key is provided, resolve it
    if (color && color in theme.colors) {
      return theme.colors[color as keyof typeof theme.colors];
    }
    // If a raw color string is provided, use it directly
    if (color) {
      return color;
    }
    // Default to text color
    return theme.colors.text;
  }, [color, theme.colors]);

  const textStyle = useMemo<TextStyle>(() => {
    const typographyPreset = theme.typography[preset];
    if (!typographyPreset) {
      return { color: resolvedColor };
    }

    const base: TextStyle = {
      ...typographyPreset,
      color: resolvedColor,
    };

    // iOS Dynamic Type support
    if (Platform.OS === 'ios' && dynamicType) {
      const dynamicTypeKey = presetToDynamicType[preset];
      if (dynamicTypeKey) {
        base.fontSize = undefined; // Let iOS handle sizing
      }
    }

    return base;
  }, [theme, preset, resolvedColor, dynamicType]);

  const defaultAccessibilityLabel =
    accessibilityLabel ??
    (typeof children === 'string' ? children : undefined);

  return (
    <RNText
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityRole={
        preset === 'h1' || preset === 'h2' || preset === 'h3'
          ? 'header'
          : 'text'
      }
      numberOfLines={numberOfLines}
      style={[textStyle, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
