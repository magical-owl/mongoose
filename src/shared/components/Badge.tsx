/**
 * Badge Component
 *
 * A notification badge/count with color variants.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';
import { palette } from '@/theme/colors';

export type BadgeVariant = 'primary' | 'error' | 'success' | 'warning' | 'info';

export interface BadgeProps {
  readonly count: number;
  readonly variant?: BadgeVariant;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly maxCount?: number;
  readonly accessibilityLabel?: string;
}

const variantColors: Record<BadgeVariant, string> = {
  primary: palette.primary500,
  error: palette.error500,
  success: palette.success500,
  warning: palette.warning500,
  info: palette.info500,
};

const sizeMap = {
  sm: { diameter: 16, fontSize: 9 },
  md: { diameter: 20, fontSize: 11 },
  lg: { diameter: 24, fontSize: 13 },
} as const;

export function Badge({
  count,
  variant = 'primary',
  size = 'md',
  maxCount = 99,
  accessibilityLabel,
}: BadgeProps): React.JSX.Element {
  const theme = useTheme();
  const dims = sizeMap[size];
  const display = count > maxCount ? `${maxCount}+` : String(count);

  const style = useMemo(() => ({
    minWidth: dims.diameter,
    height: dims.diameter,
    borderRadius: dims.diameter / 2,
    backgroundColor: variantColors[variant],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: dims.diameter * 0.3,
  }), [dims, variant]);

  return (
    <View
      style={style}
      accessibilityLabel={accessibilityLabel ?? `${count} notifications`}
      accessibilityRole="text"
    >
      <Text
        preset="caption"
        color="background"
        style={{ fontSize: dims.fontSize, fontWeight: '700', lineHeight: dims.fontSize + 1 }}
        accessibilityLabel={undefined}
      >
        {display}
      </Text>
    </View>
  );
}