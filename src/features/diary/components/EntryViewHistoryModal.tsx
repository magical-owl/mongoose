import { StyleSheet, View } from 'react-native';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import {
  getDiaryEntryLegacyViewCount,
  getDiaryEntryViewCount,
  getDiaryEntryViewDateStats,
} from '@/features/diary/domain/DiaryEntryViewHistory';
import { useTranslation } from '@/localization/i18n';
import { useTheme } from '@/providers/ThemeProvider';

interface EntryViewHistoryModalProps {
  readonly visible: boolean;
  readonly entry: DiaryEntry | null;
  readonly onDismiss: () => void;
}

function formatDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function EntryViewHistoryModal({
  visible,
  entry,
  onDismiss,
}: EntryViewHistoryModalProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const dateStats = entry ? getDiaryEntryViewDateStats(entry) : [];
  const totalViews = entry ? getDiaryEntryViewCount(entry) : 0;
  const legacyViews = entry ? getDiaryEntryLegacyViewCount(entry) : 0;
  const totalViewsLabel = t(totalViews === 1 ? 'entryViewHistoryTotalOne' : 'entryViewHistoryTotalMany')
    .replace('{count}', String(totalViews));
  const legacyViewsLabel = t(legacyViews === 1 ? 'entryViewHistoryLegacyNoteOne' : 'entryViewHistoryLegacyNoteMany')
    .replace('{count}', String(legacyViews));

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={t('entryViewHistoryTitle')}
      accessibilityLabel={t('entryViewHistoryA11y')}
    >
      <View style={styles.body}>
        <Text preset="h3" color="text" numberOfLines={2}>
          {entry?.title ?? t('entryViewHistoryTitle')}
        </Text>
        <Text preset="bodySmall" color="textSecondary">
          {totalViewsLabel}
        </Text>

        {dateStats.length > 0 ? (
          <View style={styles.statsList}>
            {dateStats.map((stat) => (
              <View
                key={stat.date}
                style={[styles.statRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                testID="entry-view-history-date-row"
              >
                <Text preset="body" color="text" style={styles.statDate}>
                  {formatDateLabel(stat.date)}
                </Text>
                <Text preset="label" style={[styles.statCount, { color: theme.colors.tint }]}>
                  {stat.count}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text preset="bodySmall" color="textSecondary" style={styles.empty}>
            {t('entryViewHistoryEmpty')}
          </Text>
        )}

        {legacyViews > 0 ? (
          <Text preset="caption" color="textTertiary" style={styles.legacyNote}>
            {legacyViewsLabel}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 10,
    paddingBottom: 12,
  },
  statsList: {
    gap: 8,
    marginTop: 4,
  },
  statRow: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statDate: {
    flex: 1,
    minWidth: 0,
    fontWeight: '700',
  },
  statCount: {
    minWidth: 32,
    textAlign: 'right',
  },
  empty: {
    marginTop: 6,
  },
  legacyNote: {
    marginTop: 2,
    lineHeight: 18,
  },
});
