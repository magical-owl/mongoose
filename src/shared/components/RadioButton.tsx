/**
 * RadioButton Component
 *
 * A themed radio button with circular indicator and optional label.
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface RadioButtonProps {
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly value?: string;
  readonly accessibilityLabel?: string;
}

export function RadioButton({
  selected,
  onPress,
  label,
  disabled = false,
  accessibilityLabel,
}: RadioButtonProps): React.JSX.Element {
  const theme = useTheme();

  const outerStyle = useMemo(() => ({
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: disabled
      ? theme.colors.disabled
      : selected
        ? theme.colors.tint
        : theme.colors.inputBorder,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }), [theme, selected, disabled]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label ?? 'Radio option'}
      accessibilityState={{ selected, disabled }}
      style={{ flexDirection: 'row', alignItems: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <View style={outerStyle}>
        {selected && (
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.colors.tint,
            }}
          />
        )}
      </View>
      {label && (
        <Text
          preset="body"
          color={disabled ? 'textTertiary' : 'text'}
          style={{ marginLeft: theme.spacing.sm }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}