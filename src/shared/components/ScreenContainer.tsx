/**
 * ScreenContainer Component
 *
 * A themed safe area container that handles safe area insets,
 * scrolling, keyboard avoidance, and loading/error states.
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenContainerProps {
  /** Screen content */
  readonly children?: React.ReactNode;
  /** Whether content should be scrollable */
  readonly scrollable?: boolean;
  /** Whether to enable keyboard avoidance */
  readonly keyboardAvoiding?: boolean;
  /** Whether to apply safe area insets */
  readonly safeArea?: boolean;
  /** Whether the screen is in a loading state */
  readonly loading?: boolean;
  /** Loading state message */
  readonly loadingMessage?: string;
  /** Error state configuration */
  readonly error?: ErrorDisplay | null;
  /** Additional container styles */
  readonly style?: StyleProp<ViewStyle>;
  /** Content container style (when scrollable) */
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  /** Accessibility label for the screen */
  readonly accessibilityLabel?: string;
  /** Optional test ID */
  readonly testID?: string;
}

export interface ErrorDisplay {
  /** Error title */
  readonly title: string;
  /** Error message */
  readonly message: string;
  /** Optional retry handler */
  readonly onRetry?: () => void;
  /** Retry button label */
  readonly retryLabel?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LOADING_MESSAGE = 'Loading...';
const DEFAULT_RETRY_LABEL = 'Retry';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingView({
  message,
  theme,
}: {
  readonly message: string;
  readonly theme: ReturnType<typeof useTheme>;
}): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
        gap: theme.spacing.lg,
      }}
      accessibilityLabel={message}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color={theme.colors.tint} />
      <Text
        preset="body"
        color="textSecondary"
        accessibilityLabel={undefined}
      >
        {message}
      </Text>
    </View>
  );
}

function ErrorView({
  error,
  theme,
}: {
  readonly error: ErrorDisplay;
  readonly theme: ReturnType<typeof useTheme>;
}): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
        gap: theme.spacing.lg,
      }}
      accessibilityLabel={`Error: ${error.title}`}
      accessibilityRole="alert"
    >
      <Text
        preset="h2"
        color="error"
        accessibilityLabel={undefined}
      >
        {error.title}
      </Text>
      <Text
        preset="body"
        color="textSecondary"
        style={{ textAlign: 'center' }}
        accessibilityLabel={undefined}
      >
        {error.message}
      </Text>
      {error.onRetry && (
        <TouchableOpacity
          onPress={error.onRetry}
          accessibilityRole="button"
          accessibilityLabel={error.retryLabel ?? DEFAULT_RETRY_LABEL}
          style={{
            marginTop: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            backgroundColor: theme.colors.tint,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <Text
            preset="button"
            color="background"
            accessibilityLabel={undefined}
          >
            {error.retryLabel ?? DEFAULT_RETRY_LABEL}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ScreenContainer({
  children,
  scrollable = false,
  keyboardAvoiding = true,
  safeArea = true,
  loading = false,
  loadingMessage = DEFAULT_LOADING_MESSAGE,
  error = null,
  style,
  contentContainerStyle,
  accessibilityLabel,
  testID,
}: ScreenContainerProps): React.JSX.Element {
  const theme = useTheme();

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flex: 1,
      backgroundColor: theme.colors.background,
    }),
    [theme.colors.background]
  );

  // Determine content to render
  const content = useMemo<React.ReactNode>(() => {
    if (error) {
      return <ErrorView error={error} theme={theme} />;
    }
    if (loading) {
      return <LoadingView message={loadingMessage} theme={theme} />;
    }
    return children;
  }, [error, loading, loadingMessage, children, theme]);

  // Wrap content in ScrollView if needed
  const wrappedContent = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        {
          flexGrow: 1,
          padding: theme.spacing.lg,
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          padding: theme.spacing.lg,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </View>
  );

  // Wrap in KeyboardAvoidingView if enabled
  const avoidWrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {wrappedContent}
    </KeyboardAvoidingView>
  ) : (
    wrappedContent
  );

  // Wrap in SafeAreaView if enabled
  if (safeArea) {
    return (
      <SafeAreaView style={[containerStyle, style]} testID={testID}>
        {avoidWrappedContent}
      </SafeAreaView>
    );
  }

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {avoidWrappedContent}
    </View>
  );
}
