/**
 * Chip Component
 *
 * A chip/tag with variants, sizes, optional delete icon.
 */

import React, { useMemo, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export type ChipVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  readonly label: string;
  readonly variant?: ChipVariant;
  readonly size?: ChipSize;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly onDelete?: () => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const sizeConfig = {
  sm: { py: 2, px: 8, fontSize: 11, iconSize: 14 },
  md: { py: 4, px: 12, fontSize: 13, iconSize: 16 },
} as const;

export function Chip({
  label,
  variant = 'primary',
  size = 'md',
  onPress,
  onDelete,
  disabled = false,
  accessibilityLabel,
  style,
}: ChipProps): React.JSX.Element {
  const theme = useTheme();
  const cfg = sizeConfig[size];

  const chipStyle = useMemo<ViewStyle>(() => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: cfg.py,
      paddingHorizontal: cfg.px,
      borderRadius: theme.borderRadius.full,
      gap: theme.spacing.xs,
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'primary':
        base.backgroundColor = theme.colors.tint;
        break;
      case 'secondary':
        base.backgroundColor = theme.colors.surface;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1;
        base.borderColor = theme.colors.tint;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
    }
    return base;
  }, [theme, variant, cfg, disabled]);

  const textColor = useMemo(() => {
    if (disabled) return theme.colors.disabledText;
    switch (variant) {
      case 'primary': return theme.colors.background;
      case 'secondary': return theme.colors.text;
      case 'outline':
      case 'ghost': return theme.colors.tint;
    }
  }, [theme, variant, disabled]);

  const content = (
    <>
      <Text
        preset="caption"
        color={textColor}
        style={{ fontSize: cfg.fontSize }}
        accessibilityLabel={undefined}
      >
        {label}
      </Text>
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
        >
          <Ionicons
            name="close-circle"
            size={cfg.iconSize}
            color={textColor}
          />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={[chipStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[chipStyle, style]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="text"
    >
      {content}
    </View>
  );
}