/**
 * Toast Component
 *
 * A toast/snackbar notification component with slide-in/out animation,
 * auto-dismiss timer, and semantic color-coded left border accent.
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme, type ThemeColors } from '@providers/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /** Whether the toast is visible */
  readonly visible: boolean;
  /** Message to display */
  readonly message: string;
  /** Visual variant that determines the accent color */
  readonly variant?: ToastVariant;
  /** Auto-dismiss duration in milliseconds (default 3000) */
  readonly duration?: number;
  /** Called when the toast is dismissed (after animation or timer) */
  readonly onDismiss?: () => void;
  /** Optional label for an action button */
  readonly actionLabel?: string;
  /** Called when the action button is pressed */
  readonly onAction?: () => void;
  /** Accessibility label (defaults to message) */
  readonly accessibilityLabel?: string;
  /** Additional styles for the toast container */
  readonly style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const SLIDE_DURATION = 250;

// ---------------------------------------------------------------------------
// Variant accent colors
// ---------------------------------------------------------------------------

const variantAccentMap: Record<ToastVariant, keyof ThemeColors> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Toast({
  visible,
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
  actionLabel,
  onAction,
  accessibilityLabel,
  style,
}: ToastProps): React.JSX.Element | null {
  const theme = useTheme();

  // TranslateY animation: -100 (hidden above) -> 0 (visible)
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentColor = theme.colors[variantAccentMap[variant]];

  // ---------------------------------------------------------------------------
  // Animations
  // ---------------------------------------------------------------------------

  const animateIn = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const animateOut = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  }, [translateY, onDismiss]);

  // ---------------------------------------------------------------------------
  // Auto-dismiss timer & visibility changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (visible) {
      // Clear any pending dismiss
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Reset position and animate in
      translateY.setValue(-100);
      animateIn();

      // Schedule auto-dismiss
      timerRef.current = setTimeout(() => {
        animateOut();
      }, duration);
    } else {
      // If hidden while still visible, animate out
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      translateY.setValue(-100);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, duration, animateIn, animateOut, translateY]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAction = useCallback(() => {
    onAction?.();
    animateOut();
  }, [onAction, animateOut]);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.xl, // Account for safe area roughly
        },
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.md,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          minHeight: 48,
          // Shadow for elevation
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 6,
        },
        messageText: {
          flex: 1,
          color: theme.colors.text,
          fontSize: theme.fontSizes.base,
          lineHeight: theme.fontSizes.base + 4,
          marginRight: theme.spacing.sm,
        },
        actionButton: {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.borderRadius.sm,
        },
        actionLabel: {
          color: theme.colors.tint,
          fontSize: theme.fontSizes.sm,
          fontWeight: '600',
        },
      }),
    [theme, accentColor],
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY }] }, style]}
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityRole="alert"
      accessible
    >
      <View style={styles.container}>
        <Text style={styles.messageText} numberOfLines={2}>
          {message}
        </Text>
        {actionLabel !== undefined && actionLabel.length > 0 && (
          <TouchableOpacity
            onPress={handleAction}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <View style={styles.actionButton}>
              <Text style={styles.actionLabel}>{actionLabel}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
