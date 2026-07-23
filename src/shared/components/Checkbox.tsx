/**
 * Checkbox Component
 *
 * A themed checkbox with checkmark and optional label.
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface CheckboxProps {
  readonly checked: boolean;
  readonly onPress: () => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
}

export function Checkbox({
  checked,
  onPress,
  label,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps): React.JSX.Element {
  const theme = useTheme();

  const boxStyle = useMemo(() => ({
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: disabled
      ? theme.colors.disabled
      : checked
        ? theme.colors.tint
        : theme.colors.inputBorder,
    backgroundColor: checked ? theme.colors.tint : 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }), [theme, checked, disabled]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label ?? 'Checkbox'}
      accessibilityState={{ checked, disabled }}
      style={{ flexDirection: 'row', alignItems: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <View style={boxStyle}>
        {checked && (
          <Ionicons name="checkmark" size={16} color={theme.colors.background} />
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