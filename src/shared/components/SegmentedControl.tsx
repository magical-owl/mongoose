/**
 * SegmentedControl Component
 *
 * A themed segmented control for switching between options.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
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
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedIndex,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [selectedIndex, slideAnim]);

  // Segment width in pixels = container minus 2× padding, divided by count
  const padding = theme.spacing.xs;
  const segmentWidth = containerWidth > 0
    ? (containerWidth - padding * 2) / segments.length
    : 0;

  const translateX = slideAnim.interpolate({
    inputRange: segments.map((_, i) => i),
    outputRange: segments.map((_, i) => i * segmentWidth),
  });

  return (
    <View
      onLayout={handleLayout}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding,
        opacity: disabled ? 0.5 : 1,
      }}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel ?? 'Segmented control'}
    >
      {/* Only render the indicator once we have a real measurement */}
      {containerWidth > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: padding,
            left: padding,
            height: '100%',
            width: segmentWidth,
            backgroundColor: theme.colors.tint,
            borderRadius: theme.borderRadius.sm,
            transform: [{ translateX }],
          }}
        />
      )}
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
