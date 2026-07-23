/**
 * EmptyState Component
 *
 * An empty state placeholder with icon, title, message, and action button.
 */

import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly message?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly accessibilityLabel?: string;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  accessibilityLabel,
}: EmptyStateProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
      }}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="text"
    >
      <Ionicons
        name={icon}
        size={64}
        color={theme.colors.textTertiary}
        style={{ marginBottom: theme.spacing.lg, opacity: 0.5 }}
      />
      <Text
        preset="h3"
        color="text"
        style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}
      >
        {title}
      </Text>
      {message && (
        <Text
          preset="body"
          color="textSecondary"
          style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant="primary"
          size="md"
          onPress={onAction}
        />
      )}
    </View>
  );
}