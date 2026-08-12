/**
 * Divider Component
 *
 * A themed horizontal or vertical divider with optional centered label.
 */

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface DividerProps {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly thickness?: number;
  readonly color?: string;
  readonly label?: string;
  readonly labelStyle?: React.ComponentProps<typeof Text>;
}

export function Divider({
  orientation = 'horizontal',
  thickness = 1,
  color,
  label,
  labelStyle,
}: DividerProps): React.JSX.Element {
  const theme = useTheme();
  const dividerColor = color ?? theme.colors.border;

  if (orientation === 'vertical') {
    return (
      <View
        style={{
          width: thickness,
          height: '100%',
          backgroundColor: dividerColor,
          marginHorizontal: theme.spacing.sm,
        }}
        accessibilityRole="none"
      />
    );
  }

  if (label) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: theme.spacing.md,
        }}
        accessibilityRole="none"
      >
        <View style={{ flex: 1, height: thickness, backgroundColor: dividerColor }} />
        <Text
          preset="caption"
          color="textTertiary"
          style={{ marginHorizontal: theme.spacing.md }}
          {...labelStyle}
        >
          {label}
        </Text>
        <View style={{ flex: 1, height: thickness, backgroundColor: dividerColor }} />
      </View>
    );
  }

  return (
    <View
      style={{
        height: thickness,
        backgroundColor: dividerColor,
        marginVertical: theme.spacing.md,
      }}
      accessibilityRole="none"
    />
  );
}
