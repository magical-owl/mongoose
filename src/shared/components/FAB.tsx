/**
 * FAB Component
 *
 * A floating action button with icon, shadow, and press handler.
 */

import React from 'react';
import { TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';

export type FABSize = 'md' | 'lg';

export interface FABProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly onPress: () => void;
  readonly size?: FABSize;
  readonly backgroundColor?: string;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const sizeMap: Record<FABSize, number> = { md: 56, lg: 64 };
const iconSizeMap: Record<FABSize, number> = { md: 24, lg: 28 };

export function FAB({
  icon,
  onPress,
  size = 'md',
  backgroundColor,
  accessibilityLabel,
  style,
  testID,
}: FABProps): React.JSX.Element {
  const theme = useTheme();
  const dimension = sizeMap[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Action'}
      testID={testID}
      style={[{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: backgroundColor ?? theme.colors.tint,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
      }, style]}
    >
      <Ionicons name={icon} size={iconSizeMap[size]} color={theme.colors.background} />
    </TouchableOpacity>
  );
}