import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { memoryReactionLabel, useTranslation } from '@/localization/i18n';

import { MemoryReactionIcon } from './MemoryReactionIcon';

interface MemoryReactionBadgeProps {
  readonly reactions: readonly MemoryReaction[];
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MemoryReactionBadge({
  reactions,
  compact = false,
  style,
  testID,
}: MemoryReactionBadgeProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const reaction = reactions[0];
  if (!reaction) return null;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.compactBadge,
        {
          backgroundColor: theme.colors.tint + '22',
          borderColor: theme.colors.tint,
        },
        style,
      ]}
      accessibilityLabel={memoryReactionLabel(reaction, t)}
      testID={testID}
    >
      <MemoryReactionIcon
        reaction={reaction}
        size={compact ? 24 : 26}
        testID={testID ? `${testID}-icon` : undefined}
      />
      <Text
        preset="caption"
        numberOfLines={1}
        style={[
          styles.label,
          compact && styles.compactLabel,
          { color: theme.colors.tint },
        ]}
      >
        {memoryReactionLabel(reaction, t)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 30,
    maxWidth: 136,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactBadge: {
    minHeight: 28,
    maxWidth: 112,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  label: {
    flexShrink: 1,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
