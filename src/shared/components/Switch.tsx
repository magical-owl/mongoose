/**
 * Switch Component
 *
 * A themed toggle switch with animated track/thumb.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface SwitchProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;
const THUMB_MARGIN = 2;
const TRACK_PADDED = TRACK_HEIGHT - THUMB_MARGIN * 2;

export function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: SwitchProps): React.JSX.Element {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.disabled, theme.colors.tint],
  });

  const thumbTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH - TRACK_HEIGHT + THUMB_MARGIN * 2],
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label ?? 'Toggle'}
      accessibilityState={{ checked: value, disabled }}
      style={[{ flexDirection: 'row', alignItems: 'center', opacity: disabled ? 0.5 : 1 }, style]}
      testID={testID}
    >
      {label && (
        <Text
          preset="body"
          color={disabled ? 'textTertiary' : 'text'}
          style={{ flex: 1, marginRight: theme.spacing.md }}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: trackColor,
          justifyContent: 'center',
          paddingHorizontal: THUMB_MARGIN,
        }}
      >
        <Animated.View
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: theme.colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
            transform: [{ translateX: thumbTranslate }],
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}