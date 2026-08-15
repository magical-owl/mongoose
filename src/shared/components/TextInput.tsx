/**
 * TextInput Component
 *
 * A themed text input with label, helper text, error state,
 * leading icon support, and clear button.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface TextInputProps {
  readonly label?: string;
  readonly placeholder?: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly error?: string;
  readonly helperText?: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly disabled?: boolean;
  readonly multiline?: boolean;
  readonly secureTextEntry?: boolean;
  readonly autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  readonly keyboardType?: KeyboardTypeOptions;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function TextInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  icon,
  disabled = false,
  multiline = false,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  accessibilityLabel,
  style,
  testID,
}: TextInputProps): React.JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const containerStyle = useMemo<ViewStyle>(() => ({
    marginBottom: theme.spacing.md,
  }), [theme.spacing.md]);

  const inputContainerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: disabled ? theme.colors.disabled : theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: error
      ? theme.colors.error
      : focused
        ? theme.colors.tint
        : theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: multiline ? theme.spacing.sm : 0,
    minHeight: multiline ? 100 : 48,
    opacity: disabled ? 0.6 : 1,
  }), [theme, error, focused, disabled, multiline]);

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {label && (
        <Text
          preset="label"
          color={error ? 'error' : 'textSecondary'}
          style={{ marginBottom: theme.spacing.xs }}
        >
          {label}
        </Text>
      )}

      <View style={inputContainerStyle}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? theme.colors.error : theme.colors.textTertiary}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}

        <RNTextInput
          style={{
            flex: 1,
            color: disabled ? theme.colors.disabledText : theme.colors.text,
            fontSize: theme.fontSizes.base,
            fontFamily: theme.fontFamily,
            paddingVertical: theme.spacing.sm,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityState={{ disabled }}
        />

        {value.length > 0 && !disabled && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Clear input"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          preset="caption"
          color="error"
          style={{ marginTop: theme.spacing.xs }}
        >
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text
          preset="caption"
          color="textTertiary"
          style={{ marginTop: theme.spacing.xs }}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}
