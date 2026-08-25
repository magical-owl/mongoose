import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { stripHtml } from '@shared/utils/html';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { diaryEntryListTitle } from './diaryEntryTypography';
import { formatDisplayTime } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, useTranslation } from '@/localization/i18n';

interface CalendarEntryViewProps {
  readonly entry: DiaryEntry;
  readonly onPress: () => void | Promise<void>;
}

export function CalendarEntryView({ entry, onPress }: CalendarEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const entryTime = formatDisplayTime(entry.createdAt, timeFormat);
  const moodColor = getManualMoodColor(entry.manualMood, theme.colors);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.entry, { borderBottomColor: theme.colors.border }]}
    >
      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <Text preset="body" color="text" style={styles.title} numberOfLines={1}>{entry.title}</Text>
          {entry.manualMood ? (
            <View style={[styles.moodBadge, { backgroundColor: moodColor + '18', borderColor: moodColor }]}>
              <Text preset="caption" numberOfLines={1} style={[styles.moodBadgeText, { color: moodColor }]}>{manualMoodLabel(entry.manualMood, t)}</Text>
            </View>
          ) : null}
          {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.entryTime}>{entryTime}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </View>
        <Text preset="caption" color="textSecondary" numberOfLines={2} style={styles.preview}>
          {stripHtml(entry.content)}
        </Text>
        {entry.tags.length > 0 ? <View style={styles.metaRow}><Text preset="caption" color="textTertiary" numberOfLines={1}>{entry.tags.map((tag) => `#${tag}`).join(' ')}</Text></View> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  entry: { minHeight: 92, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  entryTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  moodBadge: { maxWidth: 86, minHeight: 16, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  moodBadgeText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  contentColumn: { flex: 1, paddingRight: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, ...diaryEntryListTitle },
  preview: { lineHeight: 18, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
});
