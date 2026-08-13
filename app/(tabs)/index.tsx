import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { stripHtml } from '@shared/utils/html';

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', excited: '🤩', anxious: '😰',
  calm: '😌', angry: '😠', neutral: '😐', tired: '😴',
  confused: '😕', grateful: '🙏',
};

export default function TimelineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { entries, isLoading, refresh } = useDiary();
  const [viewModeIndex, setViewModeIndex] = useState(0); // 0: Detailed, 1: Simple
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const viewMode = viewModeIndex === 0 ? 'detailed' : 'simple';

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        stripHtml(e.content).toLowerCase().includes(q)
    );
  }, [entries, search]);

  return (
    <ScreenContainer loading={isLoading} loadingMessage="Loading your diary..." safeArea scrollable={false}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: theme.spacing.massive + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>
            📔 My dAIry
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

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {search.trim() ? 'No matching entries.' : 'No entries yet.'}
          </Text>
        ) : (
          filteredEntries.map((entry) => {
            const hasSentiment = !!entry.sentiment?.mood;
            const moodEmoji = hasSentiment ? MOOD_EMOJI[entry.sentiment!.mood] ?? '💭' : null;

            if (viewMode === 'simple') {
              {/* Simple Mode Row */}
              return (
                <TouchableOpacity
                  key={entry.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/entry/${entry.id}`)}
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

            {/* Detailed Mode Card (Matches original reference layout 1:1) */}
            return (
              <TouchableOpacity
                key={entry.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/entry/${entry.id}`)}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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