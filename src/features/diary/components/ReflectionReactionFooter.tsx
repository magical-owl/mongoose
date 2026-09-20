import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@shared/components/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { MemoryReactionButton } from './MemoryReactionButton';

interface ReflectionReactionFooterProps {
  readonly entryId: string;
  readonly reflectionId: string;
  readonly reactions: readonly MemoryReaction[];
  readonly isPickerVisible?: boolean;
  readonly onOpenPicker?: () => void;
  readonly onDismissPicker?: () => void;
  readonly onToggleReaction?: (entryId: string, reflectionId: string, reaction: MemoryReaction) => void;
  readonly onPressReply?: () => void;
  readonly isReplyActive?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function ReflectionReactionFooter({
  entryId,
  reflectionId,
  reactions,
  isPickerVisible,
  onOpenPicker,
  onDismissPicker,
  onToggleReaction,
  onPressReply,
  isReplyActive = false,
  style,
  testID,
}: ReflectionReactionFooterProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const canReact = Boolean(onToggleReaction && onOpenPicker && onDismissPicker);

  return (
    <View style={[styles.footer, style]} testID={testID}>
      {canReact ? (
        <MemoryReactionButton
          reactions={reactions}
          visible={Boolean(isPickerVisible)}
          onOpen={onOpenPicker!}
          onDismiss={onDismissPicker!}
          onToggleReaction={(reaction) => onToggleReaction!(entryId, reflectionId, reaction)}
          compact
          buttonStyle={styles.button}
          trayAlignment="center"
          testID={testID ? `${testID}-button` : undefined}
        />
      ) : null}
      {onPressReply ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('reflectionReplyAddA11y')}
          onPress={onPressReply}
          style={[
            styles.replyButton,
            {
              backgroundColor: isReplyActive ? theme.colors.tint + '20' : theme.colors.card,
              borderColor: isReplyActive ? theme.colors.tint : theme.colors.border,
            },
          ]}
          testID={testID ? `${testID}-reply-button` : undefined}
        >
          <Text preset="caption" color={isReplyActive ? 'tint' : 'textSecondary'} style={styles.replyButtonText}>
            {t('reflectionReplyAction')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  button: {
    minHeight: 28,
  },
  replyButton: {
    minHeight: 28,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontWeight: '800',
  },
});
