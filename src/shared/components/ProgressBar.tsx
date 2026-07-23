/**
 * ProgressBar Component
 *
 * A themed progress bar with animated fill, variants, and optional label.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';
import { palette } from '@/theme/colors';

export type ProgressVariant = 'primary' | 'success' | 'error' | 'warning' | 'info';

export interface ProgressBarProps {
  readonly progress: number;
  readonly variant?: ProgressVariant;
  readonly height?: number;
  readonly showLabel?: boolean;
  readonly animated?: boolean;
  readonly accessibilityLabel?: string;
}

const variantColors: Record<ProgressVariant, string> = {
  primary: palette.primary500,
  success: palette.success500,
  error: palette.error500,
  warning: palette.warning500,
  info: palette.info500,
};

export function ProgressBar({
  progress,
  variant = 'primary',
  height = 8,
  showLabel = false,
  animated = true,
  accessibilityLabel,
}: ProgressBarProps): React.JSX.Element {
  const theme = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const animatedValue = useRef(new Animated.Value(animated ? 0 : clampedProgress / 100)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: clampedProgress / 100,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(clampedProgress / 100);
    }
  }, [clampedProgress, animated, animatedValue]);

  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ marginVertical: theme.spacing.xs }}>
      {showLabel && (
        <Text
          preset="caption"
          color="textSecondary"
          style={{ marginBottom: theme.spacing.xs }}
        >
          {Math.round(clampedProgress)}%
        </Text>
      )}
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.borderLight,
          overflow: 'hidden',
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel ?? `Progress: ${Math.round(clampedProgress)}%`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress) }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: height / 2,
            backgroundColor: variantColors[variant],
            width: widthInterpolated,
          }}
        />
      </View>
    </View>
  );
}