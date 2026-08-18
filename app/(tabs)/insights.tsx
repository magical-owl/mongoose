import { useCallback, useMemo, useState } from "react";
import { Image, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { useDiary } from "@/features/diary/hooks/useDiary";
import type { ManualMood } from "@/features/diary/domain/DiaryEntry";
import { getManualMoodColor } from "@/features/diary/domain/moodColors";
import { findStickerItem } from "@/features/diary/domain/Sticker";
import { useAppStore } from "@/stores/useAppStore";
import { manualMoodLabel, useTranslation } from "@/localization/i18n";

type InsightsRange = "year" | "month" | "week";
type JournalTimeBucket = "morning" | "afternoon" | "evening" | "night";
const INSIGHTS_RANGES: readonly InsightsRange[] = ["year", "month", "week"];
const JOURNAL_TIME_BUCKETS: readonly JournalTimeBucket[] = ["morning", "afternoon", "evening", "night"];
const DAY_MS = 86400000;

function stickerFallbackLabel(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function entryDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function journalTimeBucket(value: string): JournalTimeBucket | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function startOfWeek(date: Date, firstDay: 0 | 1): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const offset = (start.getDay() - firstDay + 7) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
}

function addYears(date: Date, amount: number): Date {
  const targetYear = date.getFullYear() + amount;
  const lastDay = new Date(targetYear, date.getMonth() + 1, 0).getDate();
  return new Date(targetYear, date.getMonth(), Math.min(date.getDate(), lastDay), 12);
}

function formatWeekRange(start: Date, end: Date): string {
  const startText = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endText = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startText} - ${endText}`;
}

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, refresh } = useDiary();
  const calendarFirstDay = useAppStore((state) => state.calendarFirstDay);
  const [range, setRange] = useState<InsightsRange>("month");
  const [periodDate, setPeriodDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const rangeLabel = (value: InsightsRange) => {
    if (value === "year") return t("insightsRangeYear");
    if (value === "month") return t("insightsRangeMonth");
    return t("insightsRangeWeek");
  };

  const journalTimeLabel = (value: JournalTimeBucket) => {
    if (value === "morning") return t("insightsMorning");
    if (value === "afternoon") return t("insightsAfternoon");
    if (value === "evening") return t("insightsEvening");
    return t("insightsNight");
  };

  const movePeriod = useCallback((amount: -1 | 1) => {
    setPeriodDate((current) => {
      if (range === "year") return addYears(current, amount);
      if (range === "month") return addMonths(current, amount);
      return new Date(current.getTime() + amount * 7 * DAY_MS);
    });
  }, [range]);

  const stats = useMemo(() => {
    const rangeStart =
      range === "year"
        ? new Date(periodDate.getFullYear(), 0, 1, 12)
        : range === "month"
          ? new Date(periodDate.getFullYear(), periodDate.getMonth(), 1, 12)
          : startOfWeek(periodDate, calendarFirstDay);
    const rangeEnd =
      range === "year"
        ? new Date(periodDate.getFullYear(), 11, 31, 12)
        : range === "month"
          ? new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 12)
          : new Date(rangeStart.getTime() + 6 * DAY_MS);

    const scopedEntries = entries.filter((entry) => {
      const date = entryDate(entry.date);
      return date >= rangeStart && date <= rangeEnd;
    });
    const moodCounts = new Map<string, number>();
    const stickerCounts = new Map<string, number>();
    const journalTimeCounts = new Map<JournalTimeBucket, number>();

    scopedEntries.forEach((entry) => {
      if (entry.manualMood) moodCounts.set(entry.manualMood, (moodCounts.get(entry.manualMood) ?? 0) + 1);
      entry.stickers.forEach((sticker) => {
        stickerCounts.set(sticker.stickerId, (stickerCounts.get(sticker.stickerId) ?? 0) + 1);
      });
      const bucket = journalTimeBucket(entry.createdAt);
      if (bucket) journalTimeCounts.set(bucket, (journalTimeCounts.get(bucket) ?? 0) + 1);
    });

    const journalTimeBuckets = JOURNAL_TIME_BUCKETS.map((bucket) => ({
      bucket,
      count: journalTimeCounts.get(bucket) ?? 0,
    }));
    const usualJournalTime = journalTimeBuckets.reduce<JournalTimeBucket | null>(
      (usual, bucket) => {
        if (!usual) return bucket.count > 0 ? bucket.bucket : null;
        return bucket.count > (journalTimeCounts.get(usual) ?? 0) ? bucket.bucket : usual;
      },
      null,
    );

    const mostUsedStickers = [...stickerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([stickerId, count]) => {
        const sticker = findStickerItem(stickerId);
        return {
          stickerId,
          name: sticker?.name ?? stickerFallbackLabel(stickerId),
          icon: sticker?.icon,
          source: sticker?.source,
          count,
        };
      });

    const activityBuckets =
      range === "year"
        ? Array.from({ length: 12 }, (_, index) => {
            const monthDate = new Date(periodDate.getFullYear(), index, 1, 12);
            const prefix = `${periodDate.getFullYear()}-${String(index + 1).padStart(2, "0")}-`;
            return {
              label: monthDate.toLocaleDateString(undefined, { month: "short" }).slice(0, 3),
              count: scopedEntries.filter((entry) => entry.date.startsWith(prefix)).length,
            };
          })
        : range === "month"
          ? Array.from({ length: Math.ceil(rangeEnd.getDate() / 7) }, (_, index) => {
              const startDay = index * 7 + 1;
              const endDay = Math.min(startDay + 6, rangeEnd.getDate());
              return {
                label: String(index + 1),
                count: scopedEntries.filter((entry) => {
                  const day = entryDate(entry.date).getDate();
                  return day >= startDay && day <= endDay;
                }).length,
              };
            })
          : Array.from({ length: 7 }, (_, index) => {
              const date = new Date(rangeStart.getTime() + index * DAY_MS);
              const key = dateKey(date);
              return {
                label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
                count: scopedEntries.filter((entry) => entry.date === key).length,
              };
            });

    return {
      moodCounts: [...moodCounts.entries()].sort((a, b) => b[1] - a[1]),
      mostUsedStickers,
      journalTimeBuckets,
      usualJournalTime,
      activityBuckets,
      entryTotal: scopedEntries.length,
      periodLabel: range === "week"
        ? formatWeekRange(rangeStart, rangeEnd)
        : range === "month"
          ? periodDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
          : String(periodDate.getFullYear()),
    };
  }, [calendarFirstDay, entries, periodDate, range]);

  const moodTotal = stats.moodCounts.reduce((sum, [, count]) => sum + count, 0);
  const maxActivityCount = Math.max(...stats.activityBuckets.map((day) => day.count), 1);
  const moodColor = (mood: string) => getManualMoodColor(mood as ManualMood, theme.colors);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 20, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerRow}>
          <Text color="text" style={styles.title}>{t("insightsTitle")}</Text>
          <TouchableOpacity
            onPress={() => {
              void refresh();
            }}
            style={styles.headerIcon}
            accessibilityRole="button"
            accessibilityLabel={t("insightsRefreshA11y")}
          >
            <Ionicons name="refresh-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.rangePills, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {INSIGHTS_RANGES.map((value) => {
            const selected = value === range;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setRange(value)}
                style={[styles.rangePill, selected && { backgroundColor: theme.colors.tint }]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={rangeLabel(value)}
              >
                <Text preset="caption" style={[styles.rangePillText, { color: selected ? "#fff" : theme.colors.textSecondary }]}>
                  {rangeLabel(value)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.periodPickerRow}>
          <TouchableOpacity
            onPress={() => movePeriod(-1)}
            style={styles.periodPickerButton}
            accessibilityRole="button"
            accessibilityLabel={t("insightsPreviousPeriodA11y")}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text preset="label" color="text" style={styles.periodPickerValue}>
            {stats.periodLabel}
          </Text>
          <TouchableOpacity
            onPress={() => movePeriod(1)}
            style={styles.periodPickerButton}
            accessibilityRole="button"
            accessibilityLabel={t("insightsNextPeriodA11y")}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t("insightsMoodSection")}</Text>
        <View style={[styles.card, styles.compactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
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
                    <Text preset="caption" style={[styles.moodBadgeText, { color: moodColor(mood) }]}>{manualMoodLabel(mood, t)} <Text preset="caption" style={[styles.moodBadgeText, { color: moodColor(mood) }]}>{count}</Text></Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text preset="bodySmall" color="textSecondary">{t("insightsMoodEmpty")}</Text>
          )}
        </View>

        <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t("insightsActivitySection")}</Text>
        <View style={[styles.card, styles.compactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.chart}>
            {stats.activityBuckets.map((day, index) => (
              <View key={`${day.label}-${index}`} style={styles.barColumn}>
                <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
                  <View style={[styles.bar, { height: day.count ? (day.count / maxActivityCount) * 112 : 6, backgroundColor: day.count ? theme.colors.text : theme.colors.border }]} />
                </View>
                <Text preset="caption" color="textSecondary">{day.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
            <Text preset="caption" color="textSecondary">{t("insightsTotalWritten")}</Text>
            <Text preset="caption" color="text" style={styles.footerValue}>{stats.entryTotal} {stats.entryTotal === 1 ? t("insightsEntry") : t("insightsEntries")}</Text>
          </View>
        </View>

        <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t("insightsRhythmSection")}</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {stats.usualJournalTime ? (
            <>
              <View style={styles.usualTimeRow}>
                <Text preset="caption" color="textSecondary" style={styles.usualTimeLabel}>{t("insightsUsualJournalTime")}</Text>
                <Text preset="label" color="text" style={styles.usualTimeValue}>{journalTimeLabel(stats.usualJournalTime)}</Text>
              </View>
              <View style={styles.rhythmGrid}>
                {stats.journalTimeBuckets.map((bucket) => (
                  <View key={bucket.bucket} style={[styles.rhythmPill, { backgroundColor: theme.colors.tint + "14", borderColor: theme.colors.tint + "38" }]}>
                    <Text preset="caption" color="text" style={styles.rhythmLabel}>{journalTimeLabel(bucket.bucket)}</Text>
                    <Text preset="caption" color="textSecondary">{bucket.count}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text preset="bodySmall" color="textSecondary">{t("insightsRhythmEmpty")}</Text>
          )}
        </View>

        <Text preset="caption" color="textSecondary" style={[styles.sectionLabel, styles.stickerSectionLabel]}>{t("insightsStickerSection")}</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {stats.mostUsedStickers.length > 0 ? (
            <View style={styles.stickerList}>
              {stats.mostUsedStickers.map((sticker) => (
                <View key={sticker.stickerId} style={styles.stickerRow}>
                  <View style={styles.stickerPreview}>
                    {sticker.source != null ? (
                      <Image source={sticker.source} style={styles.stickerImage} resizeMode="contain" />
                    ) : (
                      <Text style={styles.stickerEmoji}>{sticker.icon ?? "*"}</Text>
                    )}
                  </View>
                  <Text preset="bodySmall" color="text" style={styles.stickerName}>{sticker.name}</Text>
                  <View style={[styles.stickerCount, { backgroundColor: theme.colors.tint + "20" }]}>
                    <Text preset="caption" color="text" style={styles.stickerCountText}>{sticker.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text preset="bodySmall" color="textSecondary">{t("insightsStickerEmpty")}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: { zIndex: 30, elevation: 30, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "700" },
  headerIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  rangePills: {
    alignSelf: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 18,
    padding: 2,
    marginBottom: 14,
  },
  rangePill: {
    minWidth: 68,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    paddingHorizontal: 12,
  },
  rangePillText: { fontWeight: "700" },
  periodPickerRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  periodPickerButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  periodPickerValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionLabel: { fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 24 },
  compactCard: { padding: 12 },
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
  usualTimeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  usualTimeLabel: { flex: 1, minWidth: 160, fontWeight: "700" },
  usualTimeValue: { flexShrink: 0, fontSize: 20, fontWeight: "700" },
  rhythmGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  rhythmPill: {
    minHeight: 36,
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  rhythmLabel: { fontWeight: "700" },
  stickerSectionLabel: { marginTop: 8 },
  stickerList: { gap: 12 },
  stickerRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 },
  stickerPreview: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stickerImage: { width: 34, height: 34 },
  stickerEmoji: { fontSize: 26 },
  stickerName: { flex: 1, fontWeight: "600" },
  stickerCount: { minWidth: 34, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  stickerCountText: { fontWeight: "700" },
});
