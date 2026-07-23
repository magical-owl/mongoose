/**
 * Avatar Component
 *
 * An avatar with image or initials fallback, configurable size.
 */

import React, { useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
  type ImageSourcePropType,
  type GestureResponderEvent,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  readonly source?: ImageSourcePropType | null;
  readonly name?: string;
  readonly size?: AvatarSize;
  readonly border?: boolean;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  source,
  name,
  size = 'md',
  border = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: AvatarProps): React.JSX.Element {
  const theme = useTheme();
  const dimension = sizeMap[size];

  const containerStyle = useMemo<ViewStyle>(() => ({
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: source ? undefined : theme.colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: border ? 2 : 0,
    borderColor: theme.colors.border,
  }), [dimension, source, theme.colors.tint, theme.colors.border, border]);

  const content = source ? (
    <Image
      source={source}
      style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <Text
      preset="body"
      color="background"
      style={{ fontSize: dimension * 0.4, fontWeight: '600' }}
      accessibilityLabel={undefined}
    >
      {getInitials(name)}
    </Text>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? name ?? 'Avatar'}
        testID={testID}
        style={[containerStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? name ?? 'Avatar'}
      testID={testID}
      style={[containerStyle, style]}
    >
      {content}
    </View>
  );
}