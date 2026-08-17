import { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { useDiary } from "@/features/diary/hooks/useDiary";
import type { ManualMood } from "@/features/diary/domain/DiaryEntry";
import { getManualMoodColor } from "@/features/diary/domain/moodColors";

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries } = useDiary();

  const stats = useMemo(() => {
    const today = new Date();
    const recentEntries = entries.filter((entry) => {
      const date = new Date(`${entry.date}T12:00:00`);
      const age = today.getTime() - date.getTime();
      return age >= 0 && age < 30 * 86400000;
    });
    const moodCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    recentEntries.forEach((entry) => {
      if (entry.manualMood) moodCounts.set(entry.manualMood, (moodCounts.get(entry.manualMood) ?? 0) + 1);
      entry.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
    });

    const activityDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getTime() - (6 - index) * 86400000);
      const key = date.toISOString().slice(0, 10);
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        count: entries.filter((entry) => entry.date === key).length,
      };
    });

    return {
      moodCounts: [...moodCounts.entries()].sort((a, b) => b[1] - a[1]),
      tagCounts: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      activityDays,
      weekTotal: activityDays.reduce((sum, day) => sum + day.count, 0),
    };
  }, [entries]);

  const moodTotal = stats.moodCounts.reduce((sum, [, count]) => sum + count, 0);
  const maxWeekCount = Math.max(...stats.activityDays.map((day) => day.count), 1);
  const moodColor = (mood: string) => getManualMoodColor(mood as ManualMood, theme.colors);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 20, backgroundColor: theme.colors.background }]}>
        <Text color="text" style={styles.title}>Insights</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>MOOD — LAST 30 DAYS</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {moodTotal > 0 ? (
            <>
              <View style={[styles.moodBar, { backgroundColor: theme.colors.border }]}>
                {stats.moodCounts.map(([mood, count]) => (
                  <View key={mood} style={{ flex: count / moodTotal, backgroundColor: moodColor(mood) }} />
                ))}
              </View>
              <View style={styles.moodLegend}>
                {stats.moodCounts.map(([mood, count]) => (
                  <View key={mood} style={[styles.moodBadge, { backgroundColor: moodColor(mood) + "18", borderColor: moodColor(mood) }]}>
                    <Text preset="caption" style={[styles.moodBadgeText, { color: moodColor(mood) }]}>{label(mood)} <Text preset="caption" style={[styles.moodBadgeText, { color: moodColor(mood) }]}>{count}</Text></Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text preset="bodySmall" color="textSecondary">Choose a mood while writing to see your emotional patterns here.</Text>
          )}
        </View>

        <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.chart}>
            {stats.activityDays.map((day, index) => (
              <View key={`${day.label}-${index}`} style={styles.barColumn}>
                <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
                  <View style={[styles.bar, { height: day.count ? (day.count / maxWeekCount) * 112 : 6, backgroundColor: day.count ? theme.colors.text : theme.colors.border }]} />
                </View>
                <Text preset="caption" color="textSecondary">{day.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
            <Text preset="caption" color="textSecondary">Total written this week</Text>
            <Text preset="caption" color="text" style={styles.footerValue}>{stats.weekTotal} {stats.weekTotal === 1 ? "entry" : "entries"}</Text>
          </View>
        </View>

        <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>TOP TAGS & MOODS</Text>
        <View style={styles.chips}>
          {stats.tagCounts.map(([tag, count]) => (
            <View key={tag} style={[styles.chip, { backgroundColor: theme.colors.tint + "20" }]}>
              <Text preset="caption" color="text" style={styles.chipText}>{label(tag)} ({count})</Text>
            </View>
          ))}
          {stats.moodCounts.slice(0, 3).map(([mood, count]) => (
            <View key={`mood-${mood}`} style={[styles.moodBadge, { backgroundColor: moodColor(mood) + "18", borderColor: moodColor(mood) }]}>
              <Text preset="caption" style={[styles.moodBadgeText, { color: moodColor(mood) }]}>{label(mood)} ({count})</Text>
            </View>
          ))}
          {stats.tagCounts.length === 0 && stats.moodCounts.length === 0 ? <Text preset="caption" color="textSecondary">Your most-used tags and moods will appear here.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: { zIndex: 30, elevation: 30, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  sectionLabel: { fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 24 },
  moodBar: { height: 18, flexDirection: "row", borderRadius: 9, overflow: "hidden", marginBottom: 16 },
  moodLegend: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodBadge: { minHeight: 30, borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  moodBadgeText: { fontWeight: "700" },
  chart: { height: 154, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" },
  barColumn: { height: "100%", flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 8 },
  barTrack: { width: 18, height: 112, borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 14 },
  footerValue: { fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontWeight: "600" },
});
