/**
 * Card Component
 *
 * A themed card container with shadow, border radius, padding,
 * and optional press handler.
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps {
  /** Card content */
  readonly children: React.ReactNode;
  /** Padding preset (defaults to md) */
  readonly padding?: CardPadding;
  /** Border radius preset (defaults to lg) */
  readonly borderRadius?: keyof typeof borderRadiusValues;
  /** Whether to show shadow */
  readonly shadow?: boolean;
  /** Optional press handler — makes card tappable */
  readonly onPress?: (event: GestureResponderEvent) => void;
  /** Additional container styles */
  readonly style?: StyleProp<ViewStyle>;
  /** Accessibility label */
  readonly accessibilityLabel?: string;
  /** Optional test ID */
  readonly testID?: string;
}

const borderRadiusValues = {
  none: 'none' as const,
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
  xl: 'xl' as const,
  full: 'full' as const,
} as const;

const paddingValues: Record<CardPadding, string> = {
  none: 'none',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Card({
  children,
  padding = 'md',
  borderRadius = 'lg',
  shadow = true,
  onPress,
  style,
  accessibilityLabel,
  testID,
}: CardProps): React.JSX.Element {
  const theme = useTheme();
  const paddingToken = paddingValues[padding] as keyof typeof theme.spacing;
  const borderRadiusToken = borderRadiusValues[borderRadius] as keyof typeof theme.borderRadius;

  const cardStyle = useMemo<ViewStyle>(() => {
    const base: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius[borderRadiusToken],
      padding: padding === 'none' ? 0 : theme.spacing[paddingToken],
      overflow: 'hidden',
    };

    if (shadow) {
      base.shadowColor = theme.colors.text;
      base.shadowOffset = { width: 0, height: 2 };
      base.shadowOpacity = 0.1;
      base.shadowRadius = 4;
      base.elevation = 3;
    }

    return base;
  }, [theme, padding, paddingToken, borderRadiusToken, shadow]);

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[cardStyle, style]}
    >
      {children}
    </View>
  );
}
