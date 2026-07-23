/**
 * Button Component
 *
 * A themed button component with variants, sizes, loading state,
 * disabled state, and accessibility label support.
 */

import React, { useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button label text */
  readonly label: string;
  /** Visual variant of the button */
  readonly variant?: ButtonVariant;
  /** Size preset */
  readonly size?: ButtonSize;
  /** Show loading spinner and disable interaction */
  readonly loading?: boolean;
  /** Disable button interaction */
  readonly disabled?: boolean;
  /** Optional press handler */
  readonly onPress?: (event: GestureResponderEvent) => void;
  /** Accessibility label (defaults to label) */
  readonly accessibilityLabel?: string;
  /** Additional styles for the container */
  readonly style?: StyleProp<ViewStyle>;
  /** Optional test ID */
  readonly testID?: string;
}

// ---------------------------------------------------------------------------
// Size configurations
// ---------------------------------------------------------------------------

const sizeConfigs = {
  sm: {
    paddingVertical: 'xs' as const,
    paddingHorizontal: 'md' as const,
    borderRadius: 'sm' as const,
    textPreset: 'bodySmall' as const,
    indicatorSize: 'small' as const,
  },
  md: {
    paddingVertical: 'sm' as const,
    paddingHorizontal: 'lg' as const,
    borderRadius: 'md' as const,
    textPreset: 'button' as const,
    indicatorSize: 'small' as const,
  },
  lg: {
    paddingVertical: 'md' as const,
    paddingHorizontal: 'xl' as const,
    borderRadius: 'md' as const,
    textPreset: 'body' as const,
    indicatorSize: 'large' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const sizeConfig = sizeConfigs[size];

  const isDisabled = disabled || loading;

  // Compute dynamic styles based on variant and state
  const containerStyle = useMemo<ViewStyle>(() => {
    const cfg = sizeConfigs[size];
    const base: ViewStyle = {
      paddingVertical: theme.spacing[cfg.paddingVertical],
      paddingHorizontal: theme.spacing[cfg.paddingHorizontal],
      borderRadius: theme.borderRadius[cfg.borderRadius],
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    };

    switch (variant) {
      case 'primary': {
        base.backgroundColor = isDisabled
          ? theme.colors.disabled
          : theme.colors.tint;
        break;
      }
      case 'secondary': {
        base.backgroundColor = isDisabled
          ? theme.colors.disabled
          : theme.colors.surface;
        break;
      }
      case 'outline': {
        base.backgroundColor = 'transparent';
        base.borderWidth = 1;
        base.borderColor = isDisabled
          ? theme.colors.disabled
          : theme.colors.tint;
        break;
      }
      case 'ghost': {
        base.backgroundColor = 'transparent';
        break;
      }
    }

    if (isDisabled && variant === 'outline') {
      base.borderColor = theme.colors.disabled;
    }

    return base;
  }, [theme, variant, size, isDisabled]);

  const textColor = useMemo(() => {
    if (isDisabled) {
      return theme.colors.disabledText;
    }
    switch (variant) {
      case 'primary':
        return theme.colors.background;
      case 'secondary':
        return theme.colors.text;
      case 'outline':
      case 'ghost':
        return theme.colors.tint;
    }
  }, [theme, variant, isDisabled]);

  const indicatorColor = isDisabled
    ? theme.colors.disabledText
    : variant === 'primary'
      ? theme.colors.background
      : theme.colors.tint;

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!isDisabled && onPress) {
        onPress(event);
      }
    },
    [isDisabled, onPress]
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
      style={[containerStyle, style]}
    >
      {loading && (
        <ActivityIndicator
          size={sizeConfig.indicatorSize}
          color={indicatorColor}
        />
      )}
      <Text
        preset={sizeConfig.textPreset}
        color={textColor}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
