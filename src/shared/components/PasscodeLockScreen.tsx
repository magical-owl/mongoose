import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from './Text';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;
const PASSCODE_LENGTH = 4;

interface PasscodeLockScreenProps {
  readonly title: string;
  readonly message?: string;
  readonly error?: string;
  readonly onSubmit: (passcode: string) => void;
  readonly submitLabel: string;
  readonly onCancel?: () => void;
  readonly cancelLabel?: string;
  readonly testID?: string;
}

export function PasscodeLockScreen({
  title,
  message,
  error,
  onSubmit,
  submitLabel,
  onCancel,
  cancelLabel,
  testID,
}: PasscodeLockScreenProps): React.JSX.Element {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const canSubmit = value.length === PASSCODE_LENGTH;

  const pressDigit = (digit: string) => {
    setValue((current) => {
      if (current.length >= PASSCODE_LENGTH) return current;
      return `${current}${digit}`;
    });
  };

  const deleteDigit = () => {
    setValue((current) => current.slice(0, -1));
  };

  const submit = () => {
    if (!canSubmit) return;
    const submittedValue = value;
    setValue('');
    onSubmit(submittedValue);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]} testID={testID}>
      <View style={styles.header}>
        <View style={[styles.lockHalo, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Ionicons name="lock-closed-outline" size={36} color={theme.colors.tint} />
        </View>
        <Text preset="h2" color="text" style={styles.title}>
          {title}
        </Text>
        {message ? (
          <Text preset="bodySmall" color="textSecondary" style={styles.message}>
            {message}
          </Text>
        ) : null}
        <View style={styles.dots} accessibilityLabel={`${value.length} of ${PASSCODE_LENGTH} digits entered`}>
          {Array.from({ length: PASSCODE_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: theme.colors.tint,
                  backgroundColor: index < value.length ? theme.colors.tint : 'transparent',
                },
              ]}
            />
          ))}
        </View>
        {error ? (
          <Text preset="caption" style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.keypad}>
        {DIGITS.slice(0, 9).map((digit) => (
          <PasscodeDigitButton key={digit} digit={digit} onPress={() => pressDigit(digit)} />
        ))}
        <View style={styles.keypadCell} />
        <PasscodeDigitButton digit="0" onPress={() => pressDigit('0')} />
        <Pressable
          onPress={deleteDigit}
          disabled={value.length === 0}
          style={({ pressed }) => [
            styles.keypadCell,
            styles.iconButton,
            pressed && styles.pressed,
            value.length === 0 && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete digit"
        >
          <Ionicons name="backspace-outline" size={28} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            {
              borderColor: canSubmit ? theme.colors.tint : theme.colors.border,
              backgroundColor: canSubmit ? theme.colors.tint + '22' : theme.colors.surface,
            },
            pressed && canSubmit && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
        >
          <Text preset="label" style={{ color: canSubmit ? theme.colors.tint : theme.colors.textTertiary }}>
            {submitLabel}
          </Text>
        </Pressable>
        {onCancel && cancelLabel ? (
          <Pressable onPress={onCancel} accessibilityRole="button" style={styles.cancelButton}>
            <Text preset="bodySmall" color="textSecondary" style={styles.cancelText}>
              {cancelLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PasscodeDigitButton({
  digit,
  onPress,
}: {
  readonly digit: string;
  readonly onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.keypadCell, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Enter ${digit}`}
    >
      <Text style={[styles.digit, { color: theme.colors.text }]}>{digit}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 38,
  },
  lockHalo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
  },
  error: {
    marginTop: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  keypad: {
    alignSelf: 'center',
    width: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 18,
  },
  keypadCell: {
    width: 92,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  iconButton: {
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.55,
  },
  disabled: {
    opacity: 0.24,
  },
  footer: {
    alignItems: 'center',
    gap: 18,
    marginTop: 28,
  },
  submitButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    minHeight: 38,
    justifyContent: 'center',
  },
  cancelText: {
    textDecorationLine: 'underline',
  },
});
