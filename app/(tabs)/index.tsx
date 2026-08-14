import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { stripHtml } from '@shared/utils/html';
import { getMoodEmoji, normalizeMoodKey } from '@/ai/Mood';
import { isDiaryEntryVisible } from '@/features/diary/services/DiaryEntryVisibility';
import { appLockService } from '@/services/AppLockService';

export default function TimelineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refresh } = useDiary();
  const [viewModeIndex, setViewModeIndex] = useState(0); // 0: Detailed, 1: Simple
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterCompanion, setFilterCompanion] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const viewMode = viewModeIndex === 0 ? 'detailed' : 'simple';

  const filteredEntries = useMemo(() => {
    if (!search.trim() && !filterDate && !filterTag && !filterMood && !filterCompanion && !favoritesOnly) return entries.filter((entry) => isDiaryEntryVisible(entry));
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        isDiaryEntryVisible(e)
        &&
        (!q || e.title.toLowerCase().includes(q) || stripHtml(e.content).toLowerCase().includes(q))
        && (!filterDate || e.date.includes(filterDate))
        && (!filterTag || e.tags.some((tag) => tag.toLowerCase().includes(filterTag.toLowerCase())))
        && (!filterMood || (e.sentiment?.mood ? normalizeMoodKey(e.sentiment.mood) === filterMood.toLowerCase() : false))
        && (!filterCompanion || e.companion === filterCompanion.toLowerCase())
        && (!favoritesOnly || e.isFavorite)
    );
  }, [entries, search, filterDate, filterTag, filterMood, filterCompanion, favoritesOnly]);

  const onThisDay = useMemo(() => {
    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return entries.filter((entry) => isDiaryEntryVisible(entry) && entry.date.slice(5) === monthDay && entry.date !== today.toISOString().slice(0, 10));
  }, [entries]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading ? null : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>
              📔 My Diary
            </Text>

            {/* Detailed / Simple Switcher */}
            <View
              style={[
                styles.switcherWrap,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              {(['Detailed', 'Simple'] as const).map((label, idx) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => setViewModeIndex(idx)}
                  style={[
                    styles.switcherBtn,
                    {
                      backgroundColor:
                        viewModeIndex === idx ? theme.colors.tint : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.switcherText,
                      {
                        color:
                          viewModeIndex === idx
                            ? '#fff'
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search Bar */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title or content..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TextInput value={filterDate} onChangeText={setFilterDate} placeholder="Date" placeholderTextColor={theme.colors.textSecondary} style={[styles.filterInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TextInput value={filterTag} onChangeText={setFilterTag} placeholder="Tag" placeholderTextColor={theme.colors.textSecondary} style={[styles.filterInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TextInput value={filterMood} onChangeText={setFilterMood} placeholder="Mood" placeholderTextColor={theme.colors.textSecondary} style={[styles.filterInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TextInput value={filterCompanion} onChangeText={setFilterCompanion} placeholder="Companion" placeholderTextColor={theme.colors.textSecondary} style={[styles.filterInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TouchableOpacity onPress={() => setFavoritesOnly((value) => !value)} style={[styles.favoriteFilter, { borderColor: theme.colors.border, backgroundColor: favoritesOnly ? theme.colors.tint : theme.colors.surface }]}><Text preset="caption" style={{ color: favoritesOnly ? '#fff' : theme.colors.text }}>★</Text></TouchableOpacity>
          </ScrollView>

          {onThisDay.length > 0 && (
            <View style={[styles.memoryBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text preset="label" color="text">On this day</Text>
              <Text preset="caption" color="textSecondary">You have {onThisDay.length} memor{onThisDay.length === 1 ? 'y' : 'ies'} from this date in previous years.</Text>
            </View>
          )}

          {/* Entries List */}
          {filteredEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {search.trim() ? 'No matching entries.' : 'No entries yet.'}
            </Text>
          ) : (
            filteredEntries.map((entry) => {
              const hasSentiment = !!entry.sentiment?.mood;
              const moodEmoji = hasSentiment ? getMoodEmoji(entry.sentiment!.mood) : null;

              if (viewMode === 'simple') {
                {/* Simple Mode Row */ }
                return (
                  <TouchableOpacity
                    key={entry.id}
                    activeOpacity={0.8}
                    onPress={async () => { if (entry.isLockbox && !(await appLockService.authenticate())) return; router.push(`/entry/${entry.id}`); }}
                    style={[
                      styles.simpleRow,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderLeftWidth: hasSentiment ? 4 : 1,
                        borderLeftColor: hasSentiment ? '#ff6b6b' : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.date, { color: theme.colors.textSecondary, minWidth: 75 }]}>
                      {entry.date}
                    </Text>
                    <Text
                      style={[styles.title, { color: theme.colors.text, flex: 1, marginRight: 8 }]}
                      numberOfLines={1}
                    >
                      {entry.title}
                    </Text>
                    {hasSentiment && (
                      <View style={styles.sentimentIndicator}>
                        <Text style={styles.sentimentEmoji}>{moodEmoji}</Text>
                      </View>
                    )}
                    <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                );
              }

              {/* Detailed Mode Card (Matches original reference layout 1:1) */ }
              return (
                <TouchableOpacity
                  key={entry.id}
                  activeOpacity={0.8}
                  onPress={async () => { if (entry.isLockbox && !(await appLockService.authenticate())) return; router.push(`/entry/${entry.id}`); }}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderLeftWidth: hasSentiment ? 4 : 1,
                      borderLeftColor: hasSentiment ? '#ff6b6b' : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.title, { color: theme.colors.text }]}>
                        {entry.title.substring(0, 30)}
                        {entry.title.length > 30 ? '...' : ''}
                      </Text>
                      {hasSentiment && (
                        <View style={styles.sentimentIndicator}>
                          <Text style={styles.sentimentEmoji}>{moodEmoji}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                      {entry.date}
                    </Text>
                  </View>
                  <Text
                    style={[styles.content, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {stripHtml(entry.content)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  switcherWrap: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
  },
  switcherBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  switcherText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterInput: { width: 92, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  favoriteFilter: { width: 40, height: 40, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  memoryBanner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, gap: 4 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  sentimentIndicator: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
  },
  sentimentEmoji: {
    fontSize: 13,
    color: '#fff',
  },
  arrow: {
    fontSize: 18,
    marginLeft: 6,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
  },
});
