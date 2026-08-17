import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { stripHtml } from '@shared/utils/html';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { diaryEntryListTitle } from './diaryEntryTypography';

interface CalendarEntryViewProps {
  readonly entry: DiaryEntry;
  readonly position: number;
  readonly onPress: () => void | Promise<void>;
}

function formatEntryTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function CalendarEntryView({ entry, position, onPress }: CalendarEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const entryTime = formatEntryTime(entry.createdAt);

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
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </View>
        <Text preset="caption" color="textSecondary" numberOfLines={2} style={styles.preview}>
          {stripHtml(entry.content)}
        </Text>
        <View style={styles.metaRow}>
          {entryTime ? <Text preset="caption" color="textTertiary">{entryTime}</Text> : null}
          {entry.tags.length > 0 ? <Text preset="caption" color="textTertiary" numberOfLines={1}>{entry.tags.map((tag) => `#${tag}`).join(' ')}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  entry: { flexDirection: 'row', minHeight: 92, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  markerColumn: { width: 42, alignItems: 'center', position: 'relative' },
  marker: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  markerNumber: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  rail: { position: 'absolute', top: 38, bottom: -14, width: 1 },
  contentColumn: { flex: 1, paddingLeft: 8, paddingRight: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, ...diaryEntryListTitle },
  preview: { lineHeight: 18, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
});
