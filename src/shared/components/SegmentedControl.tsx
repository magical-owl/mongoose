/**
 * SegmentedControl Component
 *
 * A themed segmented control for switching between options.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface SegmentedControlProps {
  readonly segments: readonly string[];
  readonly selectedIndex: number;
  readonly onSelect: (index: number) => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly selectedTextColor?: string;
  readonly unselectedTextColor?: string;
  readonly indicatorColor?: string;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly segmentStyle?: StyleProp<ViewStyle>;
  readonly textStyle?: StyleProp<TextStyle>;
  readonly testID?: string;
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onSelect,
  disabled = false,
  accessibilityLabel,
  selectedTextColor,
  unselectedTextColor,
  indicatorColor,
  containerStyle,
  segmentStyle,
  textStyle,
  testID,
}: SegmentedControlProps): React.JSX.Element {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(selectedIndex)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const resolvedContainerStyle = StyleSheet.flatten(containerStyle);

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

  // Segment width in pixels = measured container minus the actual rendered padding.
  const padding = typeof resolvedContainerStyle?.padding === 'number'
    ? resolvedContainerStyle.padding
    : theme.spacing.xs;
  const segmentWidth = containerWidth > 0 && segments.length > 0
    ? (containerWidth - padding * 2) / segments.length
    : 0;
  const textSelectedColor = selectedTextColor ?? theme.colors.background;
  const textDefaultColor = unselectedTextColor ?? theme.colors.text;

  const translateX = slideAnim.interpolate({
    inputRange: segments.map((_, i) => i),
    outputRange: segments.map((_, i) => i * segmentWidth),
  });

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          opacity: disabled ? 0.5 : 1,
          padding,
        },
        containerStyle,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel ?? 'Segmented control'}
      testID={testID}
    >
      {/* Only render the indicator once we have a real measurement */}
      {containerWidth > 0 && (
        <Animated.View
          testID={testID ? `${testID}-indicator` : undefined}
          style={{
            position: 'absolute',
            top: padding,
            left: padding,
            bottom: padding,
            width: segmentWidth,
            backgroundColor: indicatorColor ?? theme.colors.tint,
            borderRadius: 999,
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
            style={[styles.segment, { paddingVertical: theme.spacing.sm }, segmentStyle]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={segment}
          >
            <Text
              preset="button"
              style={[
                styles.segmentText,
                { color: isSelected ? textSelectedColor : textDefaultColor, fontSize: theme.fontSizes.sm },
                textStyle,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {segment}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    zIndex: 1,
  },
  segmentText: {
    fontWeight: '700',
  },
});
