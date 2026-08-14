/**
 * Insights & Analytics Screen
 *
 * 1:1 Layout matched to original reference app screens:
 * - Heading: 💡 Analytics & Insights (24px bold)
 * - Uppercase Section Labels
 * - Card styling matching original (12px radius, 15px padding, subtle shadow)
 */

import { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { getMoodLabel } from '@/ai/Mood';

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, streakStats } = useDiary();

  const stats = useMemo(() => {
    const total = entries.length;
    const totalWords = entries.reduce(
      (acc, entry) => acc + entry.content.trim().split(/\s+/).filter(Boolean).length,
      0
    );
    const avgWords = total ? Math.round(totalWords / total) : 0;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = Array(7).fill(0);
    entries.forEach((entry) => {
      const dayIndex = new Date(entry.date).getDay();
      if (!isNaN(dayIndex) && dayCounts[dayIndex] !== undefined) {
        dayCounts[dayIndex]++;
      }
    });

    const maxCount = Math.max(...dayCounts);
    const maxDayIndex = dayCounts.indexOf(maxCount);
    const mostActiveDay = total > 0 && maxCount > 0 ? days[maxDayIndex] || 'None' : 'None';

    const today = new Date();
    const getMoodDistribution = (days: number) => {
      const moodCounts = new Map<string, number>();
      entries.forEach((entry) => {
        const date = new Date(`${entry.date}T12:00:00`);
        const mood = entry.sentiment?.mood;
        if (mood && today.getTime() - date.getTime() <= days * 86400000) {
          const label = getMoodLabel(mood);
          moodCounts.set(label, (moodCounts.get(label) ?? 0) + 1);
        }
      });
      return Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1]);
    };
    const moodDistribution = getMoodDistribution(3650);
    const weeklyMoodDistribution = getMoodDistribution(7);
    const monthlyMoodDistribution = getMoodDistribution(30);
    const recentDates = new Set(entries.filter((entry) => {
      const date = new Date(`${entry.date}T12:00:00`);
      return today.getTime() - date.getTime() <= 30 * 86400000;
    }).map((entry) => entry.date));
    const consistency = Math.round((recentDates.size / 30) * 100);
    const calendarDays = Array.from({ length: 30 }, (_, index) => {
      return new Date(today.getTime() - (29 - index) * 86400000).toISOString().slice(0, 10);
    });

    return {
      totalEntries: total,
      totalWords,
      avgWords,
      mostActiveDay,
      moodDistribution,
      weeklyMoodDistribution,
      monthlyMoodDistribution,
      consistency,
      calendarDays,
    };
  }, [entries]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          💡 Analytics & Insights
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          WRITING METRICS
        </Text>

        <View style={styles.grid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={styles.icon}>📝</Text>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.totalEntries}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Entries</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={styles.icon}>🔥</Text>
            <Text style={[styles.statNumber, { color: theme.colors.tint }]}>{streakStats.currentStreak} Days</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Writing Streak</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={styles.icon}>✍️</Text>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.avgWords}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Words/Entry</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={styles.icon}>📚</Text>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.totalWords}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Words</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, width: '100%' },
            ]}
          >
            <Text style={styles.icon}>📅</Text>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.mostActiveDay}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Most Active Journaling Day</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>MOOD TRENDS</Text>
        <View style={[styles.trendCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {stats.moodDistribution.length === 0 ? (
            <Text preset="caption" color="textSecondary">Mood trends appear after entries are analyzed.</Text>
          ) : (
            <>
              <Text preset="caption" color="textSecondary" style={styles.periodLabel}>LAST 7 DAYS</Text>
              {stats.weeklyMoodDistribution.length === 0 ? <Text preset="caption" color="textSecondary">No analyzed moods.</Text> : stats.weeklyMoodDistribution.map(([mood, count]) => <View key={`week-${mood}`} style={styles.trendRow}><Text preset="bodySmall" color="text">{mood}</Text><Text preset="bodySmall" color="tint">{count}</Text></View>)}
              <Text preset="caption" color="textSecondary" style={styles.periodLabel}>LAST 30 DAYS</Text>
              {stats.monthlyMoodDistribution.length === 0 ? <Text preset="caption" color="textSecondary">No analyzed moods.</Text> : stats.monthlyMoodDistribution.map(([mood, count]) => <View key={`month-${mood}`} style={styles.trendRow}><Text preset="bodySmall" color="text">{mood}</Text><Text preset="bodySmall" color="tint">{count}</Text></View>)}
            </>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>WRITING CONSISTENCY</Text>
        <View style={[styles.trendCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text preset="body" color="text">{stats.consistency}% active days in the last 30 days</Text>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 6 }}>
            {streakStats.currentStreak} day current streak · {streakStats.longestStreak} day longest streak
          </Text>
          <View style={styles.calendarGrid}>
            {stats.calendarDays.map((day) => {
              const active = entries.some((entry) => entry.date === day);
              return <View key={day} style={[styles.calendarDot, { backgroundColor: active ? theme.colors.tint : theme.colors.border }]} />;
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  trendCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  periodLabel: { fontWeight: '700', marginTop: 8, marginBottom: 2 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  calendarDot: { width: 14, height: 14, borderRadius: 3 },
});
