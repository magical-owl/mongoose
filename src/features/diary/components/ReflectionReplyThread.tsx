import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { formatFriendlyTimestamp } from '@/shared/utils/timeFormat';
import { Text } from '@shared/components/Text';
import type { TimeFormat } from '@/stores/useAppStore';
import type { DiaryReflectionReply } from '@/features/diary/domain/DiaryEntry';
import { ReflectionComposer } from './ReflectionComposer';

interface ReflectionReplyThreadProps {
  readonly entryId: string;
  readonly reflectionId: string;
  readonly replies: readonly DiaryReflectionReply[];
  readonly timeFormat: TimeFormat;
  readonly onAddReply?: (entryId: string, reflectionId: string, text: string) => Promise<boolean>;
  readonly onDeleteReply?: (entryId: string, reflectionId: string, replyId: string) => void;
  readonly testID?: string;
}

export function ReflectionReplyThread({
  entryId,
  reflectionId,
  replies,
  timeFormat,
  onAddReply,
  onDeleteReply,
  testID,
}: ReflectionReplyThreadProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const canReply = typeof onAddReply === 'function';
  const addReply = onAddReply;

  if (replies.length === 0 && !canReply) return null;

  const friendlyTimestampLabels = {
    today: t('timeToday'),
    yesterday: t('timeYesterday'),
    todayAt: t('timeTodayAt'),
    yesterdayAt: t('timeYesterdayAt'),
    justNow: t('timeJustNow'),
    minutesAgo: t('timeMinutesAgoShort'),
    hoursAgo: t('timeHoursAgoShort'),
  };

  return (
    <View style={styles.container} testID={testID}>
      {replies.length > 0 ? (
        <View style={[styles.replyList, { borderLeftColor: theme.colors.border }]} testID={testID ? `${testID}-list` : undefined}>
          {replies.map((reply) => (
            <View
              key={reply.id}
              style={[styles.replyItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              testID={testID ? `${testID}-item-${reply.id}` : undefined}
            >
              <View style={styles.replyHeader}>
                <Text preset="caption" color="textTertiary" numberOfLines={1}>
                  {formatFriendlyTimestamp(reply.createdAt, timeFormat, friendlyTimestampLabels)}
                </Text>
                {onDeleteReply ? (
                  <TouchableOpacity
                    onPress={() => onDeleteReply(entryId, reflectionId, reply.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('reflectionReplyDeleteA11y')}
                  >
                    <Text preset="caption" color="textSecondary">{t('entryDelete')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text preset="bodySmall" color="text" style={styles.replyText}>
                {reply.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {canReply && addReply ? (
        isComposerVisible ? (
          <ReflectionComposer
            allowPhoto={false}
            onSubmit={async (text) => {
              const saved = await addReply(entryId, reflectionId, text);
              if (saved) setIsComposerVisible(false);
              return saved;
            }}
            inputBoxStyle={styles.replyComposer}
            inputBoxTestID={testID ? `${testID}-composer` : undefined}
            submitButtonTestID={testID ? `${testID}-submit` : undefined}
            placeholder={t('addReflectionReplyPlaceholder')}
            accessibilityLabel={t('reflectionReplyTextA11y')}
            submitAccessibilityLabel={t('reflectionReplySaveA11y')}
            submitSurface="subtle"
            minHeight={38}
            inputHeight={34}
            backgroundColor={theme.colors.card}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setIsComposerVisible(true)}
            style={[styles.replyButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            accessibilityRole="button"
            accessibilityLabel={t('reflectionReplyAddA11y')}
            testID={testID ? `${testID}-add-button` : undefined}
          >
            <Text preset="caption" color="textSecondary">{t('reflectionReplyAction')}</Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 7,
  },
  replyList: {
    gap: 6,
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
  },
  replyItem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  replyText: {
    lineHeight: 19,
    marginTop: 2,
  },
  replyButton: {
    alignSelf: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  replyComposer: {
    borderRadius: 10,
    marginTop: 0,
  },
});
