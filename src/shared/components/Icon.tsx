/**
 * Icon Component
 *
 * An icon wrapper around @expo/vector-icons Ionicons with
 * theme color resolution.
 */

import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Theme color keys that can be used as the `color` prop.
 */
export type ThemeColorVariant =
  | 'background'
  | 'surface'
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'tint'
  | 'tabIconDefault'
  | 'tabIconSelected'
  | 'border'
  | 'borderLight'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'card'
  | 'overlay'
  | 'disabled'
  | 'disabledText'
  | 'inputBackground'
  | 'inputBorder';

export interface IconProps {
  /** Ionicons icon name */
  readonly name: keyof typeof Ionicons.glyphMap;
  /** Icon size in density-independent pixels (default 24) */
  readonly size?: number;
  /**
   * Icon color. Can be a theme color key (e.g. 'tint', 'text', 'error')
   * or a raw hex color string. Defaults to 'text'.
   */
  readonly color?: ThemeColorVariant | string;
  /** Additional styles for the container view */
  readonly style?: StyleProp<TextStyle>;
  /** Accessibility label describing the icon */
  readonly accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Icon({
  name,
  size = 24,
  color,
  style,
  accessibilityLabel,
}: IconProps): React.JSX.Element {
  const theme = useTheme();

  const resolvedColor = useMemo(() => {
    // If the color is a known theme key, resolve it
    if (color && color in theme.colors) {
      return theme.colors[color as keyof typeof theme.colors];
    }
    // If a raw color string is provided, use it directly
    if (color) {
      return color;
    }
    // Default to text color
    return theme.colors.text;
  }, [color, theme]);

  return (
    <Ionicons
      name={name}
      size={size}
      color={resolvedColor}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );
}
