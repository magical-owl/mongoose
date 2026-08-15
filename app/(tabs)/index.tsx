import { Fragment, useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
  Modal as RNModal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { useDiary } from "@/features/diary/hooks/useDiary";
import { stripHtml } from "@shared/utils/html";
import { getMoodEmoji } from "@/ai/Mood";
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
  const [expandedFilter, setExpandedFilter] = useState<
    "date" | "tag" | "mood" | "companion" | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filterOptions = useMemo(
    () => ({
      date: Array.from(new Set(entries.map((entry) => entry.date)))
        .sort()
        .reverse(),
      tag: Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort(),
      mood: Array.from(
        new Set(
          entries.flatMap((entry) =>
            entry.manualMood
              ? [entry.manualMood]
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
          (e.manualMood
            ? e.manualMood === filterMood.toLowerCase()
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
            <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.menuButton} accessibilityRole="button" accessibilityLabel="Open diary menu">
              <Ionicons name="menu-outline" size={28} color={theme.colors.text} />
            </TouchableOpacity>

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
              const hasMood = !!entry.manualMood;
              const moodEmoji = hasMood
                ? getMoodEmoji(entry.manualMood!)
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
                        borderLeftWidth: hasMood ? 4 : 1,
                        borderLeftColor: hasMood
                          ? theme.colors.tint
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
                      <Text style={[styles.favoriteMark, { color: theme.colors.warning }]}>
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
                    {hasMood && (
                      <View style={styles.moodIndicator}>
                        <Text style={styles.moodEmoji}>{moodEmoji}</Text>
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
                      borderLeftWidth: hasMood ? 4 : 1,
                      borderLeftColor: hasMood
                        ? theme.colors.tint
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
                      <Text style={[styles.favoriteMark, { color: theme.colors.warning }]}>
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
                      {hasMood && (
                      <View style={styles.moodIndicator}>
                          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
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
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
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
      <RNModal visible={isDrawerOpen} transparent animationType="slide" onRequestClose={() => setIsDrawerOpen(false)}>
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerOverlay} onPress={() => setIsDrawerOpen(false)} accessibilityLabel="Close diary menu" />
          <View style={[styles.drawer, { backgroundColor: theme.colors.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.drawerHeader}>
              <View />
              <TouchableOpacity onPress={() => setIsDrawerOpen(false)} style={styles.drawerClose} accessibilityRole="button" accessibilityLabel="Close diary menu">
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text preset="caption" color="textSecondary" style={styles.drawerSectionLabel}>FILTER ENTRIES</Text>
              {(["date", "tag", "mood", "companion"] as const).map((kind) => {
                const value = kind === "date" ? filterDate : kind === "tag" ? filterTag : kind === "mood" ? filterMood : filterCompanion;
                const icon = kind === "date" ? "calendar-outline" : kind === "tag" ? "pricetag-outline" : kind === "mood" ? "heart-outline" : "people-outline";
                return (
                  <Fragment key={kind}>
                    <TouchableOpacity onPress={() => setExpandedFilter(expandedFilter === kind ? null : kind)} style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]} accessibilityRole="button" accessibilityLabel={`Filter by ${kind}`}>
                      <Ionicons name={icon} size={20} color={value ? theme.colors.tint : theme.colors.textSecondary} />
                      <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{value || kind.charAt(0).toUpperCase() + kind.slice(1)}</Text>
                      <Ionicons name={expandedFilter === kind ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    {expandedFilter === kind && (
                      <View style={[styles.inlineOptions, { borderBottomColor: theme.colors.border }]}>
                        <TouchableOpacity onPress={() => { if (kind === "date") setFilterDate(""); if (kind === "tag") setFilterTag(""); if (kind === "mood") setFilterMood(""); if (kind === "companion") setFilterCompanion(""); setExpandedFilter(null); }} style={styles.inlineOption}>
                          <Text preset="caption" color={!value ? "tint" : "textSecondary"}>All {kind}s</Text>
                        </TouchableOpacity>
                        {filterOptions[kind].map((option) => {
                          const selected = option === value;
                          return (
                            <TouchableOpacity key={option} onPress={() => { if (kind === "date") setFilterDate(option); if (kind === "tag") setFilterTag(option); if (kind === "mood") setFilterMood(option); if (kind === "companion") setFilterCompanion(option); setExpandedFilter(null); }} style={[styles.inlineOption, selected && { backgroundColor: theme.colors.tint + "18" }]}>
                              <Text preset="caption" color={selected ? "tint" : "text"}>{kind === "mood" ? `${getMoodEmoji(option)} ${option}` : option}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </Fragment>
                );
              })}
              <TouchableOpacity onPress={() => setFavoritesOnly((value) => !value)} style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]} accessibilityRole="switch" accessibilityState={{ checked: favoritesOnly }}>
                <Ionicons name="star-outline" size={20} color={favoritesOnly ? theme.colors.tint : theme.colors.textSecondary} />
                <Text preset="bodySmall" color="text" style={styles.drawerRowText}>Favorites only</Text>
                <Ionicons name={favoritesOnly ? "checkbox" : "square-outline"} size={20} color={favoritesOnly ? theme.colors.tint : theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFilterDate(""); setFilterTag(""); setFilterMood(""); setFilterCompanion(""); setFavoritesOnly(false); }} style={styles.clearFilters} accessibilityRole="button">
                <Text preset="bodySmall" color="tint">Clear all filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </RNModal>
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
  menuButton: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
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
  drawerRoot: { flex: 1, flexDirection: "row" },
  drawerOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.35)" },
  drawer: { width: "84%", paddingHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 3, height: 0 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 12 },
  drawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 22 },
  drawerClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  drawerSectionLabel: { fontWeight: "700", letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },
  drawerRow: { minHeight: 52, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  drawerRowText: { flex: 1, marginLeft: 12 },
  clearFilters: { paddingVertical: 14 },
  inlineOptions: { borderBottomWidth: StyleSheet.hairlineWidth, paddingLeft: 32, paddingBottom: 6 },
  inlineOption: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6 },
  memoryBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  simpleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
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
  moodIndicator: {
    marginLeft: 8,
  },
  moodEmoji: {
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
    fontSize: 18,
    width: 26,
    textAlign: "center",
  },
});
