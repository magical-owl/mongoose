import { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { Modal } from "@shared/components/Modal";
import { useDiary } from "@/features/diary/hooks/useDiary";
import { stripHtml } from "@shared/utils/html";
import { getMoodEmoji, normalizeMoodKey } from "@/ai/Mood";
import { isDiaryEntryVisible } from "@/features/diary/services/DiaryEntryVisibility";
import { appLockService } from "@/services/AppLockService";

export default function TimelineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refresh, saveDiaryEntry } = useDiary();
  const [viewModeIndex, setViewModeIndex] = useState(0); // 0: Detailed, 1: Simple
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [filterCompanion, setFilterCompanion] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filterModal, setFilterModal] = useState<
    "date" | "tag" | "mood" | "companion" | null
  >(null);

  const filterOptions = useMemo(
    () => ({
      date: Array.from(new Set(entries.map((entry) => entry.date)))
        .sort()
        .reverse(),
      tag: Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort(),
      mood: Array.from(
        new Set(
          entries.flatMap((entry) =>
            entry.sentiment?.mood
              ? [normalizeMoodKey(entry.sentiment.mood)]
              : [],
          ),
        ),
      ).sort(),
      companion: Array.from(
        new Set(entries.map((entry) => entry.companion)),
      ).sort(),
    }),
    [entries],
  );

  const toggleFavorite = useCallback(
    async (entry: (typeof entries)[number]) => {
      await saveDiaryEntry({
        ...entry,
        isFavorite: !entry.isFavorite,
        updatedAt: new Date().toISOString(),
      });
      await refresh();
    },
    [refresh, saveDiaryEntry],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const viewMode = viewModeIndex === 0 ? "detailed" : "simple";

  const filteredEntries = useMemo(() => {
    if (
      !search.trim() &&
      !filterDate &&
      !filterTag &&
      !filterMood &&
      !filterCompanion &&
      !favoritesOnly
    )
      return entries.filter((entry) => isDiaryEntryVisible(entry));
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        isDiaryEntryVisible(e) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          stripHtml(e.content).toLowerCase().includes(q)) &&
        (!filterDate || e.date.includes(filterDate)) &&
        (!filterTag ||
          e.tags.some((tag) =>
            tag.toLowerCase().includes(filterTag.toLowerCase()),
          )) &&
        (!filterMood ||
          (e.sentiment?.mood
            ? normalizeMoodKey(e.sentiment.mood) === filterMood.toLowerCase()
            : false)) &&
        (!filterCompanion || e.companion === filterCompanion.toLowerCase()) &&
        (!favoritesOnly || e.isFavorite),
    );
  }, [
    entries,
    search,
    filterDate,
    filterTag,
    filterMood,
    filterCompanion,
    favoritesOnly,
  ]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {(["Detailed", "Simple"] as const).map((label, idx) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => setViewModeIndex(idx)}
                  style={[
                    styles.switcherBtn,
                    {
                      backgroundColor:
                        viewModeIndex === idx
                          ? theme.colors.tint
                          : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.switcherText,
                      {
                        color:
                          viewModeIndex === idx
                            ? "#fff"
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(["date", "tag", "mood", "companion"] as const).map((kind) => {
              const value =
                kind === "date"
                  ? filterDate
                  : kind === "tag"
                    ? filterTag
                    : kind === "mood"
                      ? filterMood
                      : filterCompanion;
              return (
                <TouchableOpacity
                  key={kind}
                  onPress={() => setFilterModal(kind)}
                  style={[
                    styles.filterButton,
                    {
                      borderColor: value
                        ? theme.colors.tint
                        : theme.colors.border,
                      backgroundColor: value
                        ? theme.colors.tint + "18"
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Text preset="caption" color="text">
                    {value || kind.charAt(0).toUpperCase() + kind.slice(1)}
                  </Text>
                  <Text color="textSecondary">⌄</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setFavoritesOnly((value) => !value)}
              style={[
                styles.favoriteFilter,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: favoritesOnly
                    ? theme.colors.tint
                    : theme.colors.surface,
                },
              ]}
            >
              <Text
                preset="caption"
                style={{ color: favoritesOnly ? "#fff" : theme.colors.text }}
              >
                ★
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* {onThisDay.length > 0 && (
            <View style={[styles.memoryBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text preset="label" color="text">On this day</Text>
              <Text preset="caption" color="textSecondary">You have {onThisDay.length} memor{onThisDay.length === 1 ? 'y' : 'ies'} from this date in previous years.</Text>
            </View>
          )} */}

          {/* Entries List */}
          {filteredEntries.length === 0 ? (
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              {search.trim() ? "No matching entries." : "No entries yet."}
            </Text>
          ) : (
            filteredEntries.map((entry) => {
              const hasSentiment = !!entry.sentiment?.mood;
              const moodEmoji = hasSentiment
                ? getMoodEmoji(entry.sentiment!.mood)
                : null;

              if (viewMode === "simple") {
                {
                  /* Simple Mode Row */
                }
                return (
                  <TouchableOpacity
                    key={entry.id}
                    activeOpacity={0.8}
                    onPress={async () => {
                      if (
                        entry.isLockbox &&
                        !(await appLockService.authenticate())
                      )
                        return;
                      router.push(`/entry/${entry.id}`);
                    }}
                    style={[
                      styles.simpleRow,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderLeftWidth: hasSentiment ? 4 : 1,
                        borderLeftColor: hasSentiment
                          ? "#ff6b6b"
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        void toggleFavorite(entry);
                      }}
                      accessibilityLabel={
                        entry.isFavorite ? "Remove favorite" : "Add favorite"
                      }
                    >
                      <Text style={styles.favoriteMark}>
                        {entry.isFavorite ? "★" : "☆"}
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.date,
                        { color: theme.colors.textSecondary, minWidth: 75 },
                      ]}
                    >
                      {entry.date}
                    </Text>
                    <Text
                      style={[
                        styles.title,
                        { color: theme.colors.text, flex: 1, marginRight: 8 },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.title}
                    </Text>
                    {hasSentiment && (
                      <View style={styles.sentimentIndicator}>
                        <Text style={styles.sentimentEmoji}>{moodEmoji}</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.arrow,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ›
                    </Text>
                  </TouchableOpacity>
                );
              }

              {
                /* Detailed Mode Card (Matches original reference layout 1:1) */
              }
              return (
                <TouchableOpacity
                  key={entry.id}
                  activeOpacity={0.8}
                  onPress={async () => {
                    if (
                      entry.isLockbox &&
                      !(await appLockService.authenticate())
                    )
                      return;
                    router.push(`/entry/${entry.id}`);
                  }}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderLeftWidth: hasSentiment ? 4 : 1,
                      borderLeftColor: hasSentiment
                        ? "#ff6b6b"
                        : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        void toggleFavorite(entry);
                      }}
                      accessibilityLabel={
                        entry.isFavorite ? "Remove favorite" : "Add favorite"
                      }
                    >
                      <Text style={styles.favoriteMark}>
                        {entry.isFavorite ? "★" : "☆"}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                      <Text
                        style={[styles.title, { color: theme.colors.text }]}
                      >
                        {entry.title.substring(0, 30)}
                        {entry.title.length > 30 ? "..." : ""}
                      </Text>
                      {hasSentiment && (
                        <View style={styles.sentimentIndicator}>
                          <Text style={styles.sentimentEmoji}>{moodEmoji}</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.date,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {entry.date}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.content,
                      { color: theme.colors.textSecondary },
                    ]}
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
      <Modal
        visible={filterModal !== null}
        onDismiss={() => setFilterModal(null)}
        title={filterModal ? `Choose ${filterModal}` : "Choose filter"}
      >
        <ScrollView
          style={styles.optionList}
          showsVerticalScrollIndicator={false}
        >
          {filterModal && (
            <>
              <TouchableOpacity
                onPress={() => {
                  if (filterModal === "date") setFilterDate("");
                  if (filterModal === "tag") setFilterTag("");
                  if (filterModal === "mood") setFilterMood("");
                  if (filterModal === "companion") setFilterCompanion("");
                  setFilterModal(null);
                }}
                style={[
                  styles.optionButton,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Text preset="bodySmall" color="textSecondary">
                  All {filterModal}s
                </Text>
              </TouchableOpacity>
              {filterOptions[filterModal].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    if (filterModal === "date") setFilterDate(option);
                    if (filterModal === "tag") setFilterTag(option);
                    if (filterModal === "mood") setFilterMood(option);
                    if (filterModal === "companion") setFilterCompanion(option);
                    setFilterModal(null);
                  }}
                  style={[
                    styles.optionButton,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <Text preset="bodySmall" color="text">
                    {filterModal === "mood"
                      ? `${getMoodEmoji(option)} ${option}`
                      : option}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  switcherWrap: {
    flexDirection: "row",
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
    fontWeight: "600",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterButton: {
    minWidth: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  favoriteFilter: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
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
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
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
    backgroundColor: "#ff6b6b",
  },
  sentimentEmoji: {
    fontSize: 13,
    color: "#fff",
  },
  arrow: {
    fontSize: 18,
    marginLeft: 6,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
  },
  favoriteMark: {
    color: "#E5A72D",
    fontSize: 18,
    width: 26,
    textAlign: "center",
  },
  optionList: { maxHeight: 420 },
  optionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
});
