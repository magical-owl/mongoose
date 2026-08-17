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

interface CalendarEntryViewProps {
  readonly entry: DiaryEntry;
  readonly position: number;
  readonly onPress: () => void | Promise<void>;
}

export function CalendarEntryView({ entry, position, onPress }: CalendarEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const entryTime = formatDisplayTime(entry.createdAt, timeFormat);
  const moodColor = getManualMoodColor(entry.manualMood, theme.colors);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.entry, { borderBottomColor: theme.colors.border }]}
    >
      <View style={styles.markerColumn}>
        <View style={[styles.marker, { backgroundColor: theme.colors.tint }]}>
          <Text style={[styles.markerNumber, { color: theme.colors.background }]}>
            {String(position + 1).padStart(2, '0')}
          </Text>
        </View>
        <View style={[styles.rail, { backgroundColor: theme.colors.border }]} />
      </View>
      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <Text preset="body" color="text" style={styles.title} numberOfLines={1}>{entry.title}</Text>
          {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.entryTime}>{entryTime}</Text> : null}
          {entry.manualMood ? <Text preset="caption" numberOfLines={1} style={[styles.mood, { color: moodColor }]}>{entry.manualMood.charAt(0).toUpperCase() + entry.manualMood.slice(1)}</Text> : null}
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
  entry: { flexDirection: 'row', minHeight: 92, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  markerColumn: { width: 42, alignItems: 'center', position: 'relative' },
  marker: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  markerNumber: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  entryTime: { flexShrink: 0 },
  mood: { flexShrink: 1, fontWeight: '600' },
  rail: { position: 'absolute', top: 38, bottom: -14, width: 1 },
  contentColumn: { flex: 1, paddingLeft: 8, paddingRight: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, ...diaryEntryListTitle },
  preview: { lineHeight: 18, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
});
