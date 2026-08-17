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
import { DiaryEntryView } from "@/features/diary/components/DiaryEntryView";
import { formatDisplayDate } from "@shared/utils/dateFormat";
import { useAppStore } from "@/stores/useAppStore";
import type { HomeViewMode } from "@/stores/useAppStore";

function formatTimelineMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat(undefined, { month: "long" }).format(
    new Date(year, month - 1, 1, 12),
  );
}

type HierarchyMode = "year-month-date" | "month-date" | "date" | "none";
const HIERARCHY_MODES: HierarchyMode[] = ["year-month-date", "month-date", "date", "none"];
const HOME_VIEW_MODES = [
  ["detailed", "Card"],
  ["timeline", "Timeline"],
  ["feed", "Feed"],
] as const satisfies (readonly [HomeViewMode, string])[];
const HIERARCHY_INDENT = { year: 0, month: 12, date: 24 } as const;

function viewModeIcon(mode: HomeViewMode): "albums-outline" | "git-branch-outline" | "newspaper-outline" {
  if (mode === "timeline") return "git-branch-outline";
  if (mode === "feed") return "newspaper-outline";
  return "albums-outline";
}

function hierarchyModeLabel(mode: HierarchyMode): string {
  if (mode === "month-date") return "Month / Date";
  if (mode === "date") return "Date only";
  if (mode === "none") return "No dates";
  return "Year / Month / Date";
}

function capitalizeFilterLabel(value: string): string {
  return value
    .split(/(\s+|-)/)
    .map((part) => /^[A-Za-z]/.test(part) ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
    .join("");
}

export default function TimelineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refresh } = useDiary();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const homeViewModes = useAppStore((state) => state.homeViewModes);
  const homeViewMode = useAppStore((state) => state.homeViewMode);
  const setHomeViewMode = useAppStore((state) => state.setHomeViewMode);
  const selectableViewModes = HOME_VIEW_MODES.filter(([mode]) => homeViewModes[mode]);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [filterCompanion, setFilterCompanion] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [hierarchyMode, setHierarchyMode] = useState<HierarchyMode>("year-month-date");
  const [expandedFilter, setExpandedFilter] = useState<
    "date" | "tag" | "mood" | "companion" | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showHierarchyMenu, setShowHierarchyMenu] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const [viewModeIndex, setViewModeIndex] = useState(() => {
    const selectedIndex = selectableViewModes.findIndex(([mode]) => mode === homeViewMode);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });
  const viewMode = selectableViewModes[viewModeIndex]?.[0] ?? "detailed";

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

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, typeof filteredEntries>();
    [...filteredEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((entry) => {
        const group = groups.get(entry.date);
        if (group) group.push(entry);
        else groups.set(entry.date, [entry]);
      });
    return Array.from(groups.entries());
  }, [filteredEntries]);

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
              <Ionicons name="menu-outline" size={26} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.headerControls}>
            {/* Home view switcher */}
            <View
              style={[
                styles.switcherWrap,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {selectableViewModes.map(([mode, label], idx) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => { setViewModeIndex(idx); setHomeViewMode(mode); }}
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
                  <Ionicons
                    name={viewModeIcon(mode)}
                    size={16}
                    color={viewModeIndex === idx ? "#fff" : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.headerHierarchyWrap}>
              <TouchableOpacity
                onPress={() => setShowHierarchyMenu((current) => !current)}
                style={[styles.headerHierarchy, { borderColor: showHierarchyMenu ? theme.colors.tint : theme.colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Entry hierarchy: ${hierarchyModeLabel(hierarchyMode)}. Open options.`}
                accessibilityState={{ expanded: showHierarchyMenu }}
              >
                <Ionicons name="calendar-outline" size={19} color={showHierarchyMenu ? theme.colors.tint : theme.colors.textSecondary} />
              </TouchableOpacity>
              {showHierarchyMenu && (
                <View style={[styles.hierarchyMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  {HIERARCHY_MODES.map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => { setHierarchyMode(mode); setShowHierarchyMenu(false); }}
                      style={[styles.hierarchyMenuOption, mode === hierarchyMode && { backgroundColor: theme.colors.tint + "18" }]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: mode === hierarchyMode }}
                    >
                      <Text preset="caption" color={mode === hierarchyMode ? "tint" : "text"} style={styles.hierarchyMenuLabel} numberOfLines={1}>{hierarchyModeLabel(mode)}</Text>
                      {mode === hierarchyMode && <Ionicons name="checkmark" size={16} color={theme.colors.tint} style={styles.hierarchyMenuCheck} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setIsSearchOpen((current) => !current)}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel={isSearchOpen ? "Close search" : "Open search"}
            >
              <Ionicons name={isSearchOpen ? "close" : "search-outline"} size={21} color={theme.colors.text} />
            </TouchableOpacity>
            </View>
          </View>

          {isSearchOpen && <TextInput
            autoFocus
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
          />}

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
            groupedEntries.map(([date, dateEntries], index) => {
              const previousDate = groupedEntries[index - 1]?.[0];
              const isNewYear = !previousDate || previousDate.slice(0, 4) !== date.slice(0, 4);
              const isNewMonth = isNewYear || previousDate?.slice(0, 7) !== date.slice(0, 7);
              const yearKey = date.slice(0, 4);
              const monthKey = date.slice(0, 7);
              const isYearVisible = hierarchyMode === "year-month-date";
              const isMonthVisible = hierarchyMode === "year-month-date" || hierarchyMode === "month-date";
              const isDateVisible = hierarchyMode !== "none";
              const isYearCollapsed = isYearVisible && collapsedYears.has(yearKey);
              const isMonthCollapsed = isMonthVisible && collapsedMonths.has(monthKey);
              return (
              <Fragment key={date}>
                {isNewYear && isYearVisible && (
                  <TouchableOpacity
                    onPress={() => setCollapsedYears((current) => {
                      const next = new Set(current);
                      if (next.has(yearKey)) next.delete(yearKey);
                      else next.add(yearKey);
                      return next;
                    })}
                    style={styles.yearGroupRow}
                    accessibilityRole="button"
                    accessibilityLabel={`${yearKey} year group`}
                    accessibilityState={{ expanded: !isYearCollapsed }}
                  >
                    <Text preset="h2" style={[styles.yearHeading, { color: theme.colors.text }]}>
                      {yearKey}
                    </Text>
                    <Ionicons name={isYearCollapsed ? "chevron-forward" : "chevron-down"} size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
                {!isYearCollapsed && isMonthVisible && isNewMonth && (
                  <TouchableOpacity
                    onPress={() => setCollapsedMonths((current) => {
                      const next = new Set(current);
                      if (next.has(monthKey)) next.delete(monthKey);
                      else next.add(monthKey);
                      return next;
                    })}
                    style={[styles.monthGroupRow, !isYearVisible && styles.flatMonthGroupRow]}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatTimelineMonth(monthKey)} month group`}
                    accessibilityState={{ expanded: !isMonthCollapsed }}
                  >
                    <Text preset="label" style={[styles.monthHeading, { color: theme.colors.textSecondary }]}>
                      {formatTimelineMonth(monthKey)}
                    </Text>
                    <Ionicons name={isMonthCollapsed ? "chevron-forward" : "chevron-down"} size={15} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              {!isYearCollapsed && !isMonthCollapsed && <View style={[styles.dateGroup, !isDateVisible && styles.flatDateGroup]}>
                {isDateVisible && <TouchableOpacity
                  onPress={() => setCollapsedDates((current) => {
                    const next = new Set(current);
                    if (next.has(date)) next.delete(date);
                    else next.add(date);
                    return next;
                  })}
                  style={[styles.dateHeadingRow, !isYearVisible && (hierarchyMode === "month-date" ? styles.monthDateHeadingRow : styles.flatDateHeadingRow)]}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDisplayDate(date, calendarDateFormat)} date group`}
                  accessibilityState={{ expanded: !collapsedDates.has(date) }}
                >
                  <Text
                    preset="label"
                    style={[styles.dateHeading, { color: theme.colors.text }]}
                  >
                    {formatDisplayDate(date, calendarDateFormat)}
                  </Text>
                  <Ionicons
                    name={collapsedDates.has(date) ? "chevron-forward" : "chevron-down"}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>}
                {(!isDateVisible || !collapsedDates.has(date)) && dateEntries.map((entry) => {
              return (
                <DiaryEntryView
                  key={entry.id}
                  entry={entry}
                  mode={viewMode}
                  onPress={async () => {
                    if (entry.isLockbox && !(await appLockService.authenticate())) return;
                    router.push(`/entry/${entry.id}`);
                  }}
                />
              );
                })}
              </View>}
              </Fragment>
              );
            })
          )}
        </ScrollView>
      )}
      <RNModal visible={isDrawerOpen} transparent animationType="slide" onRequestClose={() => setIsDrawerOpen(false)}>
        <View style={styles.drawerRoot}>
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
                      <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{value ? capitalizeFilterLabel(value) : capitalizeFilterLabel(kind)}</Text>
                      <Ionicons name={expandedFilter === kind ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    {expandedFilter === kind && (
                      <View style={[styles.inlineOptions, { borderBottomColor: theme.colors.border }]}>
                        <TouchableOpacity onPress={() => { if (kind === "date") setFilterDate(""); if (kind === "tag") setFilterTag(""); if (kind === "mood") setFilterMood(""); if (kind === "companion") setFilterCompanion(""); setExpandedFilter(null); }} style={styles.inlineOption}>
                          <Text preset="caption" color={!value ? "tint" : "textSecondary"}>All {capitalizeFilterLabel(kind)}s</Text>
                        </TouchableOpacity>
                        {filterOptions[kind].map((option) => {
                          const selected = option === value;
                          return (
                            <TouchableOpacity key={option} onPress={() => { if (kind === "date") setFilterDate(option); if (kind === "tag") setFilterTag(option); if (kind === "mood") setFilterMood(option); if (kind === "companion") setFilterCompanion(option); setExpandedFilter(null); }} style={[styles.inlineOption, selected && { backgroundColor: theme.colors.tint + "18" }]}>
                              <Text preset="caption" color={selected ? "tint" : "text"}>{kind === "mood" ? `${getMoodEmoji(option)} ${capitalizeFilterLabel(option)}` : capitalizeFilterLabel(option)}</Text>
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
          <Pressable style={styles.drawerOverlay} onPress={() => setIsDrawerOpen(false)} accessibilityLabel="Close diary menu" />
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
    gap: 6,
  },
  menuButton: { width: 30, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  switcherWrap: {
    flex: 0,
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
    minWidth: 0,
  },
  switcherBtn: {
    width: 34,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
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
  headerHierarchy: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 17,
  },
  headerHierarchyWrap: {
    position: "relative",
    zIndex: 20,
  },
  hierarchyMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 190,
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  hierarchyMenuOption: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  hierarchyMenuLabel: {
    flex: 1,
  },
  hierarchyMenuCheck: {
    marginLeft: 16,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerRoot: { flex: 1, flexDirection: "row", alignItems: "stretch" },
  drawerOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.35)" },
  drawer: { width: "86%", maxWidth: 380, paddingHorizontal: 20, borderTopRightRadius: 22, borderBottomRightRadius: 22, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 18 },
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
    borderRadius: 4,
    padding: 14,
    marginBottom: 12,
  },
  feedCard: {
    padding: 16,
    marginBottom: 14,
  },
  feedCanvas: {
    position: "relative",
    minHeight: 220,
    overflow: "visible",
  },
  feedTextLayer: {
    position: "relative",
    zIndex: 2,
  },
  feedSticker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  feedStickerImage: {
    width: 80,
    height: 80,
  },
  feedStickerEmoji: {
    fontSize: 48,
    lineHeight: 60,
    includeFontPadding: true,
    textAlign: "center",
  },
  feedTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    marginBottom: 10,
  },
  feedContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  feedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
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
  emptyText: {
    marginTop: 10,
    fontSize: 15,
  },
  dateGroup: {
    marginBottom: 6,
    marginLeft: HIERARCHY_INDENT.year,
  },
  flatDateGroup: {
    marginLeft: HIERARCHY_INDENT.year,
  },
  yearGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: 0,
    paddingVertical: 9,
  },
  yearHeading: {
    margin: 0,
    fontWeight: "700",
  },
  monthGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 3,
    marginLeft: 0,
    paddingLeft: HIERARCHY_INDENT.month,
    paddingVertical: 7,
  },
  flatMonthGroupRow: {
    paddingLeft: HIERARCHY_INDENT.year,
  },
  monthHeading: {
    margin: 0,
    fontSize: 14,
    fontWeight: "700",
  },
  dateHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingLeft: HIERARCHY_INDENT.date,
  },
  monthDateHeadingRow: {
    paddingLeft: HIERARCHY_INDENT.month,
  },
  flatDateHeadingRow: {
    paddingLeft: HIERARCHY_INDENT.year,
  },
  dateHeading: {
    margin: 0,
    fontSize: 15,
    fontWeight: "700",
  },
  timelineEntry: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 76,
    marginBottom: 12,
  },
  timelineRail: {
    width: 2,
    marginHorizontal: 10,
    position: "relative",
  },
  timelineDot: {
    position: "absolute",
    top: 10,
    left: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineBody: {
    flex: 1,
    paddingVertical: 4,
    paddingRight: 10,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5,
  },
  timelineContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
});
