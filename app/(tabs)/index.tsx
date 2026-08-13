import { useState, useCallback } from 'react';

import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Text } from '@shared/components/Text';
import { Card } from '@shared/components/Card';
import { FAB } from '@shared/components/FAB';
import { EmptyState } from '@shared/components/EmptyState';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';

export default function TimelineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { entries, isLoading, streakStats, selectedCompanion, refresh } = useDiary();
  const [viewModeIndex, setViewModeIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const activeCompanion =
    COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const viewMode = viewModeIndex === 0 ? 'feed' : 'calendar';

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
        <View>
          <Text preset="h3">Mongoose</Text>
          <Text preset="caption" color="tint">AI Diary Companion</Text>
        </View>

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

      {/* Streak & Companion Banner */}
      <Card
        shadow={false}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text style={{ fontSize: 32, marginRight: theme.spacing.md }}>{activeCompanion.avatar}</Text>
        <View style={{ flex: 1 }}>
          <Text preset="label" color="text">{activeCompanion.name}</Text>
          <Text preset="caption" color="tint">🔥 {streakStats.currentStreak} Day Writing Streak</Text>
        </View>
      </Card>

      {/* Content Feed / Calendar */}
      {viewMode === 'feed' ? (
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.massive + theme.spacing.lg,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {entries.length === 0 ? (
            <EmptyState
              icon="journal-outline"
              title="No entries yet"
              message={`Tap "+" below to write your first entry with ${activeCompanion.name}!`}
              actionLabel="Write First Entry"
              onAction={() => router.push('/entry/new')}
            />
          ) : (
            entries.map((entry) => (
              <Card
                key={entry.id}
                onPress={() => router.push(`/entry/${entry.id}`)}
                style={{ marginBottom: theme.spacing.md }}
                accessibilityLabel={`Diary entry: ${entry.title}`}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <Text preset="caption" color="textSecondary">{entry.date}</Text>
                  {entry.sentiment && (
                    <Text preset="caption" color="tint">{entry.sentiment.mood}</Text>
                  )}
                </View>
                <Text preset="h3" style={{ marginBottom: theme.spacing.xs }}>{entry.title}</Text>
                <Text preset="bodySmall" color="textSecondary" numberOfLines={2}>
                  {entry.content}
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
            ))
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

      {/* FAB */}
      <FAB
        icon="add"
        onPress={() => router.push('/entry/new')}
        size="lg"
        accessibilityLabel="Write new diary entry"
        style={{ position: 'absolute', bottom: theme.spacing.xxl, right: theme.spacing.xxl }}
      />
    </ScreenContainer>
  );
}