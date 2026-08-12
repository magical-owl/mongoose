/**
 * LoadingOverlay Component
 *
 * A full-screen semi-transparent loading overlay with a centered
 * ActivityIndicator and optional message text.
 */

import React, { useMemo } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  readonly visible: boolean;
  /** Optional descriptive message shown below the spinner */
  readonly message?: string;
  /** Size of the ActivityIndicator (default 'large') */
  readonly size?: 'small' | 'large';
  /** Accessibility label for the overlay (defaults to "Loading") */
  readonly accessibilityLabel?: string;
  /** Additional styles for the overlay container */
  readonly style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoadingOverlay({
  visible,
  message,
  size = 'large',
  accessibilityLabel,
  style,
}: LoadingOverlayProps): React.JSX.Element | null {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFill,
          zIndex: 9999,
          backgroundColor: theme.colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.xl,
        },
        messageText: {
          marginTop: theme.spacing.md,
          color: theme.colors.text,
          fontSize: theme.fontSizes.base,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[styles.overlay, style]}
      accessibilityLabel={accessibilityLabel ?? 'Loading'}
      accessibilityRole="alert"
      accessible
    >
      <View style={styles.content}>
        <ActivityIndicator size={size} color={theme.colors.tint} />
        {message !== undefined && message.length > 0 && (
          <Text style={styles.messageText}>{message}</Text>
        )}
      </View>
    </View>
  );
}
