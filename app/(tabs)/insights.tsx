/**
 * Insights & Analytics Screen
 *
 * 1:1 Layout matched to original reference app screens:
 * - Heading: 💡 Analytics & Insights (24px bold)
 * - Uppercase Section Labels
 * - Card styling matching original (12px radius, 15px padding, subtle shadow)
 */

import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, streakStats } = useDiary();

  const [stats, setStats] = useState({
    totalEntries: 0,
    totalWords: 0,
    avgWords: 0,
    mostActiveDay: 'None',
  });

  const computeStats = useCallback(() => {
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

    setStats({
      totalEntries: total,
      totalWords,
      avgWords,
      mostActiveDay,
    });
  }, [entries]);

  useEffect(() => {
    computeStats();
  }, [computeStats]);

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
});
