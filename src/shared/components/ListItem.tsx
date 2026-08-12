/**
 * ListItem Component
 *
 * A list row with leading icon, title, subtitle, trailing icon, press handler.
 */

import React from 'react';
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

export type ListItemSize = 'sm' | 'md' | 'lg';

export interface ListItemProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly leadingIcon?: keyof typeof Ionicons.glyphMap;
  readonly trailingIcon?: keyof typeof Ionicons.glyphMap;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly disabled?: boolean;
  readonly size?: ListItemSize;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const sizeValues: Record<ListItemSize, { py: number; titleSize: 'body' | 'bodySmall'; subtitleSize: 'bodySmall' | 'caption' }> = {
  sm: { py: 8, titleSize: 'bodySmall', subtitleSize: 'caption' },
  md: { py: 12, titleSize: 'body', subtitleSize: 'bodySmall' },
  lg: { py: 16, titleSize: 'body', subtitleSize: 'bodySmall' },
};

export function ListItem({
  title,
  subtitle,
  leadingIcon,
  trailingIcon = 'chevron-forward',
  onPress,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  style,
  testID,
}: ListItemProps): React.JSX.Element {
  const theme = useTheme();
  const cfg = sizeValues[size];

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: cfg.py, paddingHorizontal: theme.spacing.lg, opacity: disabled ? 0.5 : 1 }}>
      {leadingIcon && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.md,
          }}
        >
          <Ionicons
            name={leadingIcon}
            size={20}
            color={theme.colors.tint}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text preset={cfg.titleSize} color={disabled ? 'textTertiary' : 'text'}>
          {title}
        </Text>
        {subtitle && (
          <Text
            preset={cfg.subtitleSize}
            color="textSecondary"
            style={{ marginTop: 2 }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {onPress && (
        <Ionicons
          name={trailingIcon}
          size={18}
          color={theme.colors.textTertiary}
          style={{ marginLeft: theme.spacing.sm }}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled }}
        testID={testID}
        style={style}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      style={style}
    >
      {content}
    </View>
  );
}
