import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournalExtras } from '@/features/journal/hooks/useJournalExtras';
import { annualMemoryBookService } from '@/services/AnnualMemoryBookService';
import { getEntryManualMoods, getPrimaryManualMood, type DiaryEntry, type ManualMood } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, manualMoodWeatherLabel, useTranslation } from '@/localization/i18n';

type ArchiveSection = 'chapters' | 'rituals' | 'collections' | 'replay' | 'garden' | 'bin';
type ReplayMode = 'same-date' | 'same-month' | 'one-year';

export default function ArchiveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, deletedEntries, restoreDeletedEntry, permanentlyDeleteEntry } = useDiary();
  const extras = useJournalExtras();
  const [section, setSection] = useState<ArchiveSection>('chapters');
  const [newTitle, setNewTitle] = useState('');
  const [bookYear, setBookYear] = useState(String(new Date().getFullYear()));
  const [replayMode, setReplayMode] = useState<ReplayMode>('same-date');
  const moodColor = (mood: string) => getManualMoodColor(mood as ManualMood, theme.colors);
  const entryMoodSummary = (entry: DiaryEntry) => getEntryManualMoods(entry).map((mood) => manualMoodLabel(mood, t)).join(' · ');
  const entryMoodTone = (entry: DiaryEntry) => moodColor(getPrimaryManualMood(getEntryManualMoods(entry)) ?? 'neutral');

  const replay = useMemo(() => {
    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayString = today.toISOString().slice(0, 10);
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
    return entries.filter((entry) => replayMode === 'same-date' ? entry.date.slice(5) === monthDay && entry.date !== todayString : replayMode === 'same-month' ? entry.date.slice(5, 7) === monthDay.slice(0, 2) && entry.date !== todayString : entry.date === oneYearAgo);
  }, [entries, replayMode]);

  const add = async () => {
    const title = newTitle.trim();
    if (!title) return;
    if (section === 'chapters') await extras.addChapter(title);
    if (section === 'rituals') await extras.addRitual(title);
    if (section === 'collections') await extras.addCollection(title);
    if (section === 'garden') await extras.addMilestone(title);
    setNewTitle('');
  };

  const handleRestoreEntry = async (id: string) => {
    const result = await restoreDeletedEntry(id);
    if (!result.success) Alert.alert('Restore failed', result.error.message);
  };

  const handlePermanentlyDeleteEntry = (id: string) => {
    Alert.alert('Delete forever?', 'This permanently removes the diary entry from the recovery bin. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete forever',
        style: 'destructive',
        onPress: async () => {
          const result = await permanentlyDeleteEntry(id);
          if (!result.success) Alert.alert('Delete failed', result.error.message);
        },
      },
    ]);
  };

  const sectionItems: { id: ArchiveSection; label: string }[] = [
    { id: 'chapters', label: 'Chapters' }, { id: 'rituals', label: 'Rituals' }, { id: 'collections', label: 'Collections' }, { id: 'replay', label: 'Replay' }, { id: 'garden', label: 'Garden' }, { id: 'bin', label: 'Bin' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('archiveTitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text preset="caption" color="tint" style={styles.eyebrow}>YOUR PRIVATE INDEX</Text><Text preset="bodySmall" color="textSecondary">A quieter view of the stories, rituals, and memories you choose to keep.</Text><View style={styles.stats}><Text preset="caption" color="textSecondary">{entries.length} entries</Text><Text preset="caption" color="textSecondary">{extras.chapters.length} chapters</Text><Text preset="caption" color="textSecondary">{extras.rituals.length} rituals</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {sectionItems.map((item) => <TouchableOpacity key={item.id} onPress={() => setSection(item.id)} style={[styles.tab, { borderColor: section === item.id ? theme.colors.tint : theme.colors.border, backgroundColor: section === item.id ? theme.colors.tint : theme.colors.surface }]}><Text preset="caption" style={{ color: section === item.id ? '#fff' : theme.colors.text }}>{item.label}</Text></TouchableOpacity>)}
        </ScrollView>

        {section !== 'replay' && section !== 'bin' && (
          <View style={styles.addRow}>
            <TextInput value={newTitle} onChangeText={setNewTitle} onSubmitEditing={() => { void add(); }} placeholder={section === 'garden' ? 'Milestone title' : `New ${section.slice(0, -1)}`} placeholderTextColor={theme.colors.textSecondary} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]} returnKeyType="done" />
            <TouchableOpacity onPress={() => { void add(); }} style={[styles.addButton, { backgroundColor: theme.colors.tint }]}><Text preset="label" style={{ color: '#fff' }}>Add</Text></TouchableOpacity>
          </View>
        )}

        {section === 'chapters' && extras.chapters.map((chapter) => <View key={chapter.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={styles.cardIcon}>{chapter.cover}</Text><View style={{ flex: 1 }}><Text preset="label" color="text">{chapter.title}</Text><Text preset="caption" color="textSecondary">Since {chapter.startDate} · {entries.filter((entry) => entry.chapterId === chapter.id).length} entries</Text></View></View>)}
        {section === 'rituals' && extras.rituals.map((ritual) => { const today = new Date().toISOString().slice(0, 10); const complete = ritual.completedDates.includes(today); return <View key={ritual.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><View style={{ flex: 1 }}><Text preset="label" color="text">{ritual.title}</Text><Text preset="caption" color="textSecondary">{ritual.frequency} · {ritual.completedDates.length} completions</Text></View><TouchableOpacity onPress={() => { void extras.completeRitual(ritual.id); }} style={[styles.completeButton, { backgroundColor: complete ? theme.colors.tint : theme.colors.border }]}><Text preset="caption" style={{ color: complete ? '#fff' : theme.colors.text }}>{complete ? 'Done' : 'Complete'}</Text></TouchableOpacity></View>; })}
        {section === 'collections' && extras.collections.map((collection) => <View key={collection.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={styles.cardIcon}>▣</Text><View style={{ flex: 1 }}><Text preset="label" color="text">{collection.title}</Text><Text preset="caption" color="textSecondary">{entries.filter((entry) => entry.collectionIds.includes(collection.id)).length} saved entries</Text></View></View>)}
        {section === 'replay' && <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{(['same-date', 'same-month', 'one-year'] as ReplayMode[]).map((mode) => <TouchableOpacity key={mode} onPress={() => setReplayMode(mode)} style={[styles.tab, { borderColor: replayMode === mode ? theme.colors.tint : theme.colors.border, backgroundColor: replayMode === mode ? theme.colors.tint : theme.colors.surface }]}><Text preset="caption" style={{ color: replayMode === mode ? '#fff' : theme.colors.text }}>{mode === 'same-date' ? 'Same date' : mode === 'same-month' ? 'Same month' : 'One year ago'}</Text></TouchableOpacity>)}</ScrollView>{replay.length === 0 ? <Text preset="body" color="textSecondary">No memories match this replay yet.</Text> : replay.map((entry) => <TouchableOpacity key={entry.id} onPress={() => router.push(`/entry/${entry.id}`)} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{getEntryManualMoods(entry).length > 0 ? <View style={[styles.moodBadge, { backgroundColor: entryMoodTone(entry) + '18', borderColor: entryMoodTone(entry) }]}><Text preset="caption" numberOfLines={1} style={[styles.moodBadgeText, { color: entryMoodTone(entry) }]}>{entryMoodSummary(entry)}</Text></View> : <Text style={styles.cardIcon}>📜</Text>}<View style={{ flex: 1 }}><Text preset="label" color="text">{entry.title}</Text><Text preset="caption" color="textSecondary">{entry.date} · {manualMoodWeatherLabel(entry.manualMoodWeather, t)}</Text></View><Text color="textSecondary">›</Text></TouchableOpacity>)}</>}
        {section === 'bin' && <View>{deletedEntries.length === 0 ? <Text preset="body" color="textSecondary">Recovery bin is empty.</Text> : deletedEntries.map((entry) => <View key={entry.id} style={[styles.card, styles.binCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><View style={{ flex: 1 }}><Text preset="label" color="text">{entry.title}</Text><Text preset="caption" color="textSecondary">{entry.date}{entry.deletedAt ? ` · Deleted ${entry.deletedAt.slice(0, 10)}` : ''}</Text></View><View style={styles.binActions}><TouchableOpacity onPress={() => { void handleRestoreEntry(entry.id); }} style={[styles.binButton, { borderColor: theme.colors.tint }]} accessibilityRole="button" accessibilityLabel={`Restore ${entry.title}`}><Text preset="caption" style={[styles.binButtonText, { color: theme.colors.tint }]}>Restore</Text></TouchableOpacity><TouchableOpacity onPress={() => handlePermanentlyDeleteEntry(entry.id)} style={[styles.binButton, { borderColor: theme.colors.error }]} accessibilityRole="button" accessibilityLabel={`Delete ${entry.title} forever`}><Text preset="caption" style={[styles.binButtonText, { color: theme.colors.error }]}>Delete</Text></TouchableOpacity></View></View>)}</View>}
        {section === 'garden' && <View style={[styles.garden, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={styles.gardenIcon}>🌱</Text><Text preset="h2" color="text">Your memory garden</Text><Text preset="bodySmall" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>Every entry, favorite, ritual, and milestone adds something to this private place.</Text><Text style={styles.gardenStats}>{entries.length > 20 ? '🌳' : entries.length > 5 ? '🌿' : '🌱'} {entries.length} entries · {extras.rituals.reduce((sum, ritual) => sum + ritual.completedDates.length, 0)} rituals completed</Text>{extras.milestones.map((milestone) => <Text key={milestone.id} preset="caption" color="textSecondary" style={{ marginTop: 6 }}>• {milestone.title} · {milestone.date}</Text>)}</View>}
        {section === 'garden' && <View style={[styles.bookCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text preset="label" color="text">Annual Memory Book</Text><TextInput value={bookYear} onChangeText={setBookYear} keyboardType="number-pad" style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, marginTop: 8 }]} /><TouchableOpacity onPress={() => { void annualMemoryBookService.create(Number(bookYear), entries, extras.state); }} style={[styles.addButton, { backgroundColor: theme.colors.tint, marginTop: 8 }]}><Text preset="label" style={{ color: '#fff' }}>Create printable book</Text></TouchableOpacity></View>}
        {section !== 'replay' && section !== 'garden' && section !== 'bin' && ((section === 'chapters' && extras.chapters.length === 0) || (section === 'rituals' && extras.rituals.length === 0) || (section === 'collections' && extras.collections.length === 0)) && <Text preset="body" color="textSecondary">Nothing here yet. Add your first one above.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, fixedHeader: { zIndex: 30, elevation: 30, paddingHorizontal: 20 }, hero: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 }, eyebrow: { fontWeight: '700', letterSpacing: 1, marginBottom: 6 }, title: { fontSize: 24, fontWeight: '700', marginBottom: 16 }, stats: { flexDirection: 'row', gap: 18, marginTop: 16 }, tabs: { gap: 8, paddingBottom: 16 }, tab: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }, addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 }, input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }, addButton: { borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' }, card: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, cardIcon: { fontSize: 28 }, moodBadge: { minHeight: 30, borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, moodBadgeText: { fontWeight: '700' }, completeButton: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }, binCard: { alignItems: 'flex-start' }, binActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, binButton: { minHeight: 32, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, binButtonText: { fontWeight: '800' }, garden: { borderWidth: 1, borderRadius: 12, padding: 24, alignItems: 'center' }, bookCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 12 }, gardenIcon: { fontSize: 58 }, gardenStats: { fontSize: 18, fontWeight: '700', marginTop: 24 }, });
