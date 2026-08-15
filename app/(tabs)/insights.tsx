/**
 * Insights & Analytics Screen
 *
 * 1:1 Layout matched to original reference app screens:
 * - Heading: 💡 Analytics & Insights (24px bold)
 * - Uppercase Section Labels
 * - Card styling matching original (12px radius, 15px padding, subtle shadow)
 */

import { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { Icon } from "@shared/components/Icon";
import { useDiary } from "@/features/diary/hooks/useDiary";

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, streakStats } = useDiary();

  const stats = useMemo(() => {
    const total = entries.length;
    const totalWords = entries.reduce(
      (acc, entry) =>
        acc + entry.content.trim().split(/\s+/).filter(Boolean).length,
      0,
    );
    const avgWords = total ? Math.round(totalWords / total) : 0;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = Array(7).fill(0);
    entries.forEach((entry) => {
      const dayIndex = new Date(entry.date).getDay();
      if (!isNaN(dayIndex) && dayCounts[dayIndex] !== undefined) {
        dayCounts[dayIndex]++;
      }
    });

    const maxCount = Math.max(...dayCounts);
    const maxDayIndex = dayCounts.indexOf(maxCount);
    const mostActiveDay =
      total > 0 && maxCount > 0 ? days[maxDayIndex] || "None" : "None";

    const today = new Date();
    const recentDates = new Set(
      entries
        .filter((entry) => {
          const date = new Date(`${entry.date}T12:00:00`);
          return today.getTime() - date.getTime() <= 30 * 86400000;
        })
        .map((entry) => entry.date),
    );
    const consistency = Math.round((recentDates.size / 30) * 100);
    const calendarDays = Array.from({ length: 30 }, (_, index) => {
      return new Date(today.getTime() - (29 - index) * 86400000)
        .toISOString()
        .slice(0, 10);
    });
    const activityDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getTime() - (6 - index) * 86400000);
      const key = date.toISOString().slice(0, 10);
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
        count: entries.filter((entry) => entry.date === key).length,
      };
    });

    return {
      totalEntries: total,
      totalWords,
      avgWords,
      mostActiveDay,
      consistency,
      calendarDays,
      activityDays,
    };
  }, [entries]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* <View style={[styles.hero, { backgroundColor: theme.colors.tint }]}><Text style={styles.heroLabel}>YOUR WRITING RHYTHM</Text><Text style={styles.heroNumber}>{streakStats.currentStreak} days</Text><Text style={styles.heroCopy}>{stats.consistency}% of the last 30 days had a little room for reflection.</Text></View> */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Analytics & Insights
        </Text>

        <Text
          style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
        >
          WRITING METRICS
        </Text>

        <View style={styles.grid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.tint,
              },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.tint + "18" }]}><Icon name="document-text-outline" size={20} color="tint" /></View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {stats.totalEntries}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Total Entries
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.tint,
              },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.tint + "18" }]}><Icon name="flame-outline" size={20} color="tint" /></View>
            <Text style={[styles.statNumber, { color: theme.colors.tint }]}>
              {streakStats.currentStreak} Days
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Writing Streak
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.tint,
              },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.tint + "18" }]}><Icon name="create-outline" size={20} color="tint" /></View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {stats.avgWords}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Avg Words/Entry
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.tint,
              },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.tint + "18" }]}><Icon name="book-outline" size={20} color="tint" /></View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {stats.totalWords}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Total Words
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.tint,
                width: "100%",
              },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.tint + "18" }]}><Icon name="calendar-outline" size={20} color="tint" /></View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {stats.mostActiveDay}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Most Active Journaling Day
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>WRITING PULSE</Text>
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.chartHeader}>
            <View><Text preset="label" color="text">Your last 7 days</Text><Text preset="caption" color="textSecondary">Entries by day</Text></View>
            <Text style={[styles.chartTotal, { color: theme.colors.tint }]}>{stats.activityDays.reduce((sum, day) => sum + day.count, 0)}</Text>
          </View>
          <View style={styles.barChart}>
            {stats.activityDays.map((day) => {
              const max = Math.max(...stats.activityDays.map((item) => item.count), 1);
              const height = day.count ? Math.max(18, (day.count / max) * 104) : 8;
              return <View key={day.label} style={styles.barColumn}><View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}><View style={[styles.bar, { height, backgroundColor: day.count ? theme.colors.tint : theme.colors.border }]} /></View><Text preset="caption" color="textSecondary" style={styles.barLabel}>{day.label}</Text></View>;
            })}
          </View>
        </View>

        <Text
          style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
        >
          WRITING CONSISTENCY
        </Text>
        <View
          style={[
            styles.trendCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text preset="body" color="text">
            {stats.consistency}% active days in the last 30 days
          </Text>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 6 }}>
            {streakStats.currentStreak} day current streak ·{" "}
            {streakStats.longestStreak} day longest streak
          </Text>
          <View style={styles.calendarGrid}>
            {stats.calendarDays.map((day) => {
              const active = entries.some((entry) => entry.date === day);
              return (
                <View
                  key={day}
                  style={[
                    styles.calendarDot,
                    {
                      backgroundColor: active
                        ? theme.colors.tint
                        : theme.colors.border,
                    },
                  ]}
                />
              );
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
    fontWeight: "700",
    marginBottom: 16,
  },
  hero: { borderRadius: 12, padding: 18, marginBottom: 20 },
  heroLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroNumber: { color: "#fff", fontSize: 30, fontWeight: "700", marginTop: 8 },
  heroCopy: { color: "#fff", opacity: 0.9, marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    alignItems: "flex-start",
    minHeight: 104,
    justifyContent: "space-between",
    borderTopWidth: 3,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    fontSize: 22,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  trendCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  chartCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTotal: { fontSize: 26, fontWeight: "700" },
  barChart: { height: 140, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", marginTop: 14 },
  barColumn: { height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 6, flex: 1 },
  barTrack: { width: 18, height: 108, borderRadius: 9, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: 9 },
  barLabel: { fontSize: 11 },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  calendarDot: { width: 14, height: 14, borderRadius: 3 },
});
