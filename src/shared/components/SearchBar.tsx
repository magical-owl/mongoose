/**
 * SearchBar Component
 *
 * A themed search bar with search icon, clear button, and text input.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';

export interface SearchBarProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onSubmitEditing?: () => void;
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = 'Search...',
  autoFocus = false,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: SearchBarProps): React.JSX.Element {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleSubmit = useCallback(() => {
    onSubmitEditing?.();
  }, [onSubmitEditing]);

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: disabled ? theme.colors.disabled : theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    opacity: disabled ? 0.6 : 1,
  }), [theme, disabled]);

  return (
    <View style={[containerStyle, style]} testID={testID}>
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.textTertiary}
        style={{ marginRight: theme.spacing.sm }}
      />
      <TextInput
        ref={inputRef}
        style={{
          flex: 1,
          color: disabled ? theme.colors.disabledText : theme.colors.text,
          fontSize: theme.fontSizes.base,
          paddingVertical: 0,
        }}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        editable={!disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="search"
      />
      {value.length > 0 && !disabled && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Clear search"
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
  );
}