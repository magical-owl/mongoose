import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Text } from '@shared/components/Text';
import { Card } from '@shared/components/Card';
import { EmptyState } from '@shared/components/EmptyState';
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
  const [viewModeIndex, setViewModeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const viewMode = viewModeIndex === 0 ? 'feed' : 'calendar';

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        stripHtml(e.content).toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  return (
    <ScreenContainer loading={isLoading} loadingMessage="Loading your diary..." safeArea scrollable={false}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Text preset="h3">Mongoose</Text>

        {/* Compact pill switcher */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.full,
            padding: 3,
          }}
          accessibilityRole="tablist"
          accessibilityLabel="View mode switcher"
        >
          {(['Feed', 'Calendar'] as const).map((label, idx) => (
            <TouchableOpacity
              key={label}
              onPress={() => setViewModeIndex(idx)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 5,
                borderRadius: theme.borderRadius.full,
                backgroundColor:
                  viewModeIndex === idx ? theme.colors.tint : 'transparent',
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewModeIndex === idx }}
              accessibilityLabel={`${label}${viewModeIndex === idx ? ', selected' : ''}`}
            >
              <Text
                preset="caption"
                style={{
                  fontWeight: '600',
                  color:
                    viewModeIndex === idx
                      ? theme.colors.background
                      : theme.colors.textSecondary,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Bar (Feed View) */}
      {viewMode === 'feed' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.borderRadius.md,
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search entries by title or content…"
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 14,
              padding: 0,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content Feed / Calendar */}
      {viewMode === 'feed' ? (
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.massive + theme.spacing.lg,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon="journal-outline"
              title={searchQuery.trim() ? 'No matching entries' : 'No entries yet'}
              message={
                searchQuery.trim()
                  ? `No entries found for "${searchQuery}". Try a different keyword.`
                  : 'Tap "+" below to write your first diary entry!'
              }
              actionLabel={searchQuery.trim() ? undefined : 'Write First Entry'}
              onAction={searchQuery.trim() ? undefined : () => router.push('/entry/new')}
            />
          ) : (
            filteredEntries.map((entry) => {
              const hasSentiment = !!entry.sentiment?.mood;
              const moodEmoji = hasSentiment ? MOOD_EMOJI[entry.sentiment!.mood] ?? '💭' : null;
              return (
                <Card
                  key={entry.id}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                  style={{
                    marginBottom: theme.spacing.md,
                    borderLeftWidth: hasSentiment ? 4 : 1,
                    borderLeftColor: hasSentiment ? '#FF6B6B' : theme.colors.border,
                  }}
                  accessibilityLabel={`Diary entry: ${entry.title}`}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    <Text preset="caption" color="textSecondary">{entry.date}</Text>
                    {hasSentiment && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14 }}>{moodEmoji}</Text>
                        <Text preset="caption" color="tint" style={{ textTransform: 'capitalize' }}>
                          {entry.sentiment!.mood}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text preset="h3" style={{ marginBottom: theme.spacing.xs }}>{entry.title}</Text>
                  <Text preset="bodySmall" color="textSecondary" numberOfLines={2}>
                    {stripHtml(entry.content)}
                  </Text>
                  {entry.stickers.length > 0 && (
                    <Text
                      preset="caption"
                      color="textTertiary"
                      style={{ marginTop: theme.spacing.xs }}
                    >
                      🏷️ {entry.stickers.length} Stickers Placed
                    </Text>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.massive + theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Text preset="h3" style={{ marginBottom: theme.spacing.xs }}>📅 Calendar View</Text>
            <Text preset="bodySmall" color="textSecondary" style={{ marginBottom: theme.spacing.lg }}>
              Select any day below to view or write entries:
            </Text>

            {/* Day header row */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text
                  key={d}
                  preset="caption"
                  color="textTertiary"
                  style={{ width: '13%', textAlign: 'center', marginBottom: theme.spacing.sm, fontWeight: '700' }}
                >
                  {d}
                </Text>
              ))}

              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dayStr = `2026-08-${day < 10 ? '0' + day : day}`;
                const hasEntry = entries.some((e) => e.date === dayStr);
                return (
                  <TouchableOpacity
                    key={day}
                    style={{
                      width: '13%',
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: theme.spacing.sm,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: hasEntry
                        ? `${theme.colors.tint}33`
                        : theme.colors.surface,
                      borderWidth: hasEntry ? 1 : 0,
                      borderColor: hasEntry ? theme.colors.tint : 'transparent',
                    }}
                    onPress={() => {
                      const found = entries.find((e) => e.date === dayStr);
                      if (found) {
                        router.push(`/entry/${found.id}`);
                      } else {
                        router.push('/entry/new');
                      }
                    }}
                    accessibilityLabel={`${day} August${hasEntry ? ', has entry' : ''}`}
                    accessibilityRole="button"
                  >
                    <Text
                      preset="caption"
                      color={hasEntry ? 'tint' : 'textSecondary'}
                      style={{ fontWeight: hasEntry ? '700' : '400' }}
                    >
                      {day}
                    </Text>
                    {hasEntry && (
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: theme.colors.tint,
                          marginTop: 2,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}