/**
 * SegmentedControl Component
 *
 * A themed segmented control for switching between options.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface SegmentedControlProps {
  readonly segments: string[];
  readonly selectedIndex: number;
  readonly onSelect: (index: number) => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onSelect,
  disabled = false,
  accessibilityLabel,
}: SegmentedControlProps): React.JSX.Element {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedIndex,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [selectedIndex, slideAnim]);

  const segmentWidth = useMemo(() => {
    const totalPadding = theme.spacing.xs * 2; // container padding
    const availableWidth = 100 - (theme.spacing.xs * 4) / 3; // approximate
    return `${availableWidth / segments.length}%`;
  }, [segments.length, theme.spacing.xs]);

  const translateX = slideAnim.interpolate({
    inputRange: segments.map((_, i) => i),
    outputRange: segments.map((_, i) => i * (280 / segments.length)),
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.xs,
        opacity: disabled ? 0.5 : 1,
      }}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel ?? 'Segmented control'}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: theme.spacing.xs,
          left: theme.spacing.xs,
          height: '100%',
          width: `${100 / segments.length}%`,
          backgroundColor: theme.colors.tint,
          borderRadius: theme.borderRadius.sm,
          transform: [{ translateX: translateX ?? 0 }],
        }}
      />
      {segments.map((segment, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={segment}
            onPress={() => onSelect(index)}
            disabled={disabled}
            activeOpacity={0.7}
            style={{ flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', zIndex: 1 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={`${segment}${isSelected ? ', selected' : ''}`}
          >
            <Text
              preset="button"
              color={isSelected ? 'background' : 'text'}
              style={{ fontSize: theme.fontSizes.sm }}
            >
              {segment}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}