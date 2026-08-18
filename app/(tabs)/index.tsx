import { Fragment, useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  UIManager,
  findNodeHandle,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { useDiary } from "@/features/diary/hooks/useDiary";
import { stripHtml } from "@shared/utils/html";
import { isDiaryEntryVisible } from "@/features/diary/services/DiaryEntryVisibility";
import { appLockService } from "@/services/AppLockService";
import { DiaryEntryView } from "@/features/diary/components/DiaryEntryView";
import { PaywallModal } from "@/shared/components/PaywallModal";
import { formatDisplayDate } from "@shared/utils/dateFormat";
import { useAppStore } from "@/stores/useAppStore";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { APP_IDENTITY } from "@/config/appIdentity";
import type { HomeViewMode } from "@/stores/useAppStore";
import type { ManualMood } from "@/features/diary/domain/DiaryEntry";
import { getManualMoodColor } from "@/features/diary/domain/moodColors";
import { homeFilterAllLabel, homeFilterKindLabel, homeViewModeLabel, manualMoodLabel, premiumPaywallTitle, useTranslation } from "@/localization/i18n";

function formatTimelineMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat(undefined, { month: "long" }).format(
    new Date(year, month - 1, 1, 12),
  );
}

type HierarchyMode = "year-month-date" | "month-date" | "date" | "none";
const HIERARCHY_MODES: HierarchyMode[] = ["year-month-date", "month-date", "date", "none"];
const HOME_VIEW_MODES = ["timeline", "detailed", "feed"] as const satisfies readonly HomeViewMode[];
const HIERARCHY_INDENT = { year: 0, month: 12, date: 24 } as const;
const PREMIUM_REMINDER_ENTRY_THRESHOLD = 5;
const PREMIUM_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function viewModeIcon(mode: HomeViewMode): "albums-outline" | "git-branch-outline" | "newspaper-outline" {
  if (mode === "timeline") return "git-branch-outline";
  if (mode === "feed") return "newspaper-outline";
  return "albums-outline";
}

function hierarchyModeLabel(mode: HierarchyMode): string {
  if (mode === "month-date") return "Month / Date";
  if (mode === "date") return "Date";
  if (mode === "none") return "Flat list";
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
  const t = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const { entries, isLoading, refresh, addReflection } = useDiary();
  const { isPro } = useSubscription();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const homeViewModes = useAppStore((state) => state.homeViewModes);
  const homeViewMode = useAppStore((state) => state.homeViewMode);
  const premiumOnboardingPromptShown = useAppStore((state) => state.premiumOnboardingPromptShown);
  const premiumPromptDismissedAt = useAppStore((state) => state.premiumPromptDismissedAt);
  const setHomeViewMode = useAppStore((state) => state.setHomeViewMode);
  const markPremiumOnboardingPromptShown = useAppStore((state) => state.markPremiumOnboardingPromptShown);
  const markPremiumPromptDismissed = useAppStore((state) => state.markPremiumPromptDismissed);
  const selectableViewModes = HOME_VIEW_MODES.filter((mode) => homeViewModes[mode]);
  const moodColor = useCallback((mood: string) => getManualMoodColor(mood as ManualMood, theme.colors), [theme.colors]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [hierarchyMode, setHierarchyMode] = useState<HierarchyMode>("year-month-date");
  const [expandedFilter, setExpandedFilter] = useState<
    "date" | "tag" | "mood" | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showHeaderOptions, setShowHeaderOptions] = useState(false);
  const [showHierarchyMenu, setShowHierarchyMenu] = useState(false);
  const drawerWidth = Math.min(windowWidth * 0.86, 380);
  const drawerProgress = useRef(new Animated.Value(0)).current;
  const drawerProgressValue = useRef(0);
  const drawerDragStart = useRef(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const entryLayoutY = useRef(new Map<string, number>());
  const dateGroupLayoutY = useRef(new Map<string, number>());
  const entryDateById = useRef(new Map<string, string>());
  const entryRefs = useRef(new Map<string, View>());
  const scrollOffsetY = useRef(0);
  const pendingScrollEntryId = useRef<string | null>(null);
  const premiumPromptShownThisSession = useRef(false);

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
    }),
    [entries],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const listenerId = drawerProgress.addListener(({ value }) => {
      drawerProgressValue.current = value;
    });
    return () => {
      drawerProgress.removeListener(listenerId);
    };
  }, [drawerProgress]);

  useEffect(() => {
    if (!isOnboarded || isPro || showPremiumModal) return;

    const now = Date.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!premiumOnboardingPromptShown) {
      premiumPromptShownThisSession.current = true;
      markPremiumOnboardingPromptShown(new Date(now).toISOString());
      timeout = setTimeout(() => setShowPremiumModal(true), 0);
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }

    const dismissedAtMs = premiumPromptDismissedAt ? new Date(premiumPromptDismissedAt).getTime() : 0;
    const cooldownElapsed = !dismissedAtMs || Number.isNaN(dismissedAtMs) || now - dismissedAtMs >= PREMIUM_REMINDER_COOLDOWN_MS;
    if (!premiumPromptShownThisSession.current && entries.length >= PREMIUM_REMINDER_ENTRY_THRESHOLD && cooldownElapsed) {
      premiumPromptShownThisSession.current = true;
      timeout = setTimeout(() => setShowPremiumModal(true), 0);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [
    entries.length,
    isOnboarded,
    isPro,
    markPremiumOnboardingPromptShown,
    premiumOnboardingPromptShown,
    premiumPromptDismissedAt,
    showPremiumModal,
  ]);

  const closePremiumModal = useCallback(() => {
    markPremiumPromptDismissed(new Date().toISOString());
    setShowPremiumModal(false);
  }, [markPremiumPromptDismissed]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerMounted(true);
    setIsDrawerOpen(true);
  }, []);

  useEffect(() => {
    Animated.timing(drawerProgress, {
      toValue: isDrawerOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isDrawerOpen) {
        setIsDrawerMounted(false);
      }
    });
  }, [drawerProgress, isDrawerOpen]);

  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          isDrawerMounted &&
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderGrant: () => {
          drawerProgress.stopAnimation((value) => {
            drawerDragStart.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const nextProgress = Math.max(
            0,
            Math.min(1, drawerDragStart.current + gesture.dx / drawerWidth),
          );
          drawerProgress.setValue(nextProgress);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldOpen =
            gesture.vx > 0.35 ||
            (gesture.vx >= -0.35 && drawerProgressValue.current > 0.5);
          setIsDrawerOpen(shouldOpen);
        },
        onPanResponderTerminate: () => {
          setIsDrawerOpen(drawerProgressValue.current > 0.5);
        },
      }),
    [drawerProgress, drawerWidth, isDrawerMounted],
  );

  const [viewModeIndex, setViewModeIndex] = useState(() => {
    const selectedIndex = selectableViewModes.findIndex((mode) => mode === homeViewMode);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });
  const viewMode: HomeViewMode = selectableViewModes[viewModeIndex] ?? "detailed";

  const handleAddReflection = useCallback(
    async (entryId: string, text: string) => {
      const result = await addReflection(entryId, text);
      if (!result.success) {
        Alert.alert(t("reflectionNotSavedTitle"), result.error.message);
        return false;
      }
      return true;
    },
    [addReflection, t],
  );

  const scrollToEntry = useCallback((entryId: string) => {
    const entryNode = entryRefs.current.get(entryId);
    if (entryNode && scrollRef.current) {
      const entryHandle = findNodeHandle(entryNode);
      const scrollHandle = findNodeHandle(scrollRef.current);
      if (entryHandle !== null && scrollHandle !== null) {
        UIManager.measure(entryHandle, (_entryX: number, _entryY: number, _entryWidth: number, _entryHeight: number, _entryPageX: number, entryPageY: number) => {
          UIManager.measure(scrollHandle, (_scrollX: number, _scrollY: number, _scrollWidth: number, _scrollHeight: number, _scrollPageX: number, scrollPageY: number) => {
          const nextY = scrollOffsetY.current + entryPageY - scrollPageY - 72;
          scrollRef.current?.scrollTo({ y: Math.max(0, nextY), animated: true });
          pendingScrollEntryId.current = null;
          });
        });
        return true;
      }
    }

    const entryY = entryLayoutY.current.get(entryId);
    const entryDate = entryDateById.current.get(entryId);
    const groupY = entryDate ? dateGroupLayoutY.current.get(entryDate) : undefined;
    if (entryY === undefined || groupY === undefined) return false;
    scrollRef.current?.scrollTo({ y: Math.max(0, groupY + entryY - 72), animated: true });
    pendingScrollEntryId.current = null;
    return true;
  }, []);

  const handleEntryLayout = useCallback(
    (entryId: string, entryDate: string, y: number) => {
      entryDateById.current.set(entryId, entryDate);
      entryLayoutY.current.set(entryId, y);
      if (pendingScrollEntryId.current === entryId && viewMode === "timeline") {
        scrollToEntry(entryId);
      }
    },
    [scrollToEntry, viewMode],
  );

  const handleDateGroupLayout = useCallback(
    (date: string, y: number) => {
      dateGroupLayoutY.current.set(date, y);
      const pendingId = pendingScrollEntryId.current;
      if (pendingId && entryDateById.current.get(pendingId) === date && viewMode === "timeline") {
        scrollToEntry(pendingId);
      }
    },
    [scrollToEntry, viewMode],
  );

  const handleReflectionSummaryPress = useCallback(
    (entryId: string) => {
      const entry = entries.find((item) => item.id === entryId);
      const timelineIndex = selectableViewModes.findIndex((mode) => mode === "timeline");
      if (!entry || timelineIndex < 0) {
        Alert.alert(t("timelineUnavailableTitle"), t("timelineUnavailableMessage"));
        return;
      }

      pendingScrollEntryId.current = entryId;
      setCollapsedYears((current) => {
        const next = new Set(current);
        next.delete(entry.date.slice(0, 4));
        return next;
      });
      setCollapsedMonths((current) => {
        const next = new Set(current);
        next.delete(entry.date.slice(0, 7));
        return next;
      });
      setCollapsedDates((current) => {
        const next = new Set(current);
        next.delete(entry.date);
        return next;
      });
      setViewModeIndex(timelineIndex);
      setHomeViewMode("timeline");
      [80, 180, 320].forEach((delay) => {
        setTimeout(() => {
          if (pendingScrollEntryId.current === entryId) {
            scrollToEntry(entryId);
          }
        }, delay);
      });
    },
    [entries, scrollToEntry, selectableViewModes, setHomeViewMode, t],
  );

  const filteredEntries = useMemo(() => {
    if (
      !search.trim() &&
      !filterDate &&
      !filterTag &&
      !filterMood &&
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
        (!favoritesOnly || e.isFavorite),
    );
  }, [
    entries,
    search,
    filterDate,
    filterTag,
    filterMood,
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
      {...drawerPanResponder.panHandlers}
    >
      {isDrawerMounted && (
        <Animated.View
          pointerEvents={isDrawerOpen ? "auto" : "none"}
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              backgroundColor: theme.colors.background,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              transform: [
                {
                  translateX: drawerProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-drawerWidth, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <View />
            <TouchableOpacity onPress={closeDrawer} style={styles.drawerClose} accessibilityRole="button" accessibilityLabel={t("homeDrawerCloseA11y")}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text preset="caption" color="textSecondary" style={styles.drawerSectionLabel}>{t("homeDrawerFilterEntries")}</Text>
            {(["date", "tag", "mood"] as const).map((kind) => {
              const value = kind === "date" ? filterDate : kind === "tag" ? filterTag : filterMood;
              const icon = kind === "date" ? "calendar-outline" : kind === "tag" ? "pricetag-outline" : "heart-outline";
              return (
                <Fragment key={kind}>
                  <TouchableOpacity onPress={() => setExpandedFilter(expandedFilter === kind ? null : kind)} style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]} accessibilityRole="button" accessibilityLabel={`${t("homeDrawerFilterBy")} ${homeFilterKindLabel(kind, t)}`}>
                    <Ionicons name={icon} size={20} color={value ? theme.colors.tint : theme.colors.textSecondary} />
                    <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{value ? (kind === "mood" ? manualMoodLabel(value, t) : capitalizeFilterLabel(value)) : homeFilterKindLabel(kind, t)}</Text>
                    <Ionicons name={expandedFilter === kind ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  {expandedFilter === kind && (
                    <View style={[styles.inlineOptions, { borderBottomColor: theme.colors.border }]}>
                      <TouchableOpacity onPress={() => { if (kind === "date") setFilterDate(""); if (kind === "tag") setFilterTag(""); if (kind === "mood") setFilterMood(""); setExpandedFilter(null); }} style={styles.inlineOption}>
                        <Text preset="caption" color={!value ? "tint" : "textSecondary"}>{homeFilterAllLabel(kind, t)}</Text>
                      </TouchableOpacity>
                      {filterOptions[kind].map((option) => {
                        const selected = option === value;
                        const optionMoodColor = kind === "mood" ? moodColor(option) : theme.colors.text;
                        return (
                          <TouchableOpacity key={option} onPress={() => { if (kind === "date") setFilterDate(option); if (kind === "tag") setFilterTag(option); if (kind === "mood") setFilterMood(option); setExpandedFilter(null); }} style={[styles.inlineOption, selected && { backgroundColor: theme.colors.tint + "18" }]}>
                            {kind === "mood" ? (
                              <View style={[styles.filterMoodBadge, { backgroundColor: optionMoodColor + "18", borderColor: optionMoodColor }]}>
                                <Text preset="caption" style={[styles.filterMoodBadgeText, { color: optionMoodColor }]}>{manualMoodLabel(option, t)}</Text>
                              </View>
                            ) : (
                              <Text preset="caption" color={selected ? "tint" : "text"}>{capitalizeFilterLabel(option)}</Text>
                            )}
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
              <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{t("homeFavoritesOnly")}</Text>
              <Ionicons name={favoritesOnly ? "checkbox" : "square-outline"} size={20} color={favoritesOnly ? theme.colors.tint : theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFilterDate(""); setFilterTag(""); setFilterMood(""); setFavoritesOnly(false); }} style={styles.clearFilters} accessibilityRole="button">
              <Text preset="bodySmall" color="tint">{t("homeClearAllFilters")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.contentPane,
          {
            transform: [
              {
                translateX: drawerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, drawerWidth],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.fixedHeader, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuButton} accessibilityRole="button" accessibilityLabel={t("homeDrawerOpenA11y")}>
              <Ionicons name="menu-outline" size={26} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={[styles.viewModePill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {selectableViewModes.map((mode, idx) => {
                const selected = viewModeIndex === idx;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => { setViewModeIndex(idx); setHomeViewMode(mode); }}
                    style={[styles.viewModeButton, selected && { backgroundColor: theme.colors.tint }]}
                    accessibilityRole="button"
                    accessibilityLabel={homeViewModeLabel(mode, t)}
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={viewModeIcon(mode)}
                      size={15}
                      color={selected ? (theme.isDark ? theme.colors.background : theme.colors.card) : theme.colors.textSecondary}
                    />
                    <Text
                      preset="caption"
                      style={[
                        styles.viewModeButtonText,
                        { color: selected ? (theme.isDark ? theme.colors.background : theme.colors.card) : theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                    >
                      {homeViewModeLabel(mode, t)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.headerControls}>
              {showHeaderOptions && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  style={styles.headerOptionsSlider}
                  contentContainerStyle={styles.headerOptionsSliderContent}
                >
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowHierarchyMenu((current) => !current);
                    }}
                    style={[
                      styles.headerSliderButton,
                      showHierarchyMenu && { backgroundColor: theme.colors.tint + "18" },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Entry hierarchy: ${hierarchyModeLabel(hierarchyMode)}. Open options.`}
                    accessibilityState={{ expanded: showHierarchyMenu }}
                  >
                    <Ionicons name="calendar-outline" size={20} color={showHierarchyMenu ? theme.colors.tint : theme.colors.text} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsSearchOpen((current) => !current)}
                    style={[
                      styles.headerSliderButton,
                      isSearchOpen && { backgroundColor: theme.colors.tint + "18" },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={isSearchOpen ? t("homeHeaderCloseSearch") : t("homeHeaderSearch")}
                  >
                    <Ionicons name={isSearchOpen ? "close" : "search-outline"} size={20} color={isSearchOpen ? theme.colors.tint : theme.colors.text} />
                  </TouchableOpacity>
                </ScrollView>
              )}

              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  const next = !showHeaderOptions;
                  setShowHeaderOptions(next);
                  if (!next) setShowHierarchyMenu(false);
                }}
                style={[styles.headerOptionToggle, showHeaderOptions && { backgroundColor: theme.colors.tint + "18" }]}
                accessibilityRole="button"
                accessibilityLabel={t("homeHeaderOptions")}
                accessibilityState={{ expanded: showHeaderOptions }}
              >
                <Ionicons name="options-outline" size={22} color={showHeaderOptions ? theme.colors.tint : theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {showHeaderOptions && showHierarchyMenu && (
            <View style={[styles.hierarchyInlineMenu, { borderTopColor: theme.colors.border }]}>
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

          {isSearchOpen && <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder={t("homeSearchPlaceholder")}
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
        </View>
        {isLoading ? null : (
        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            scrollOffsetY.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
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
              {search.trim() ? t("homeNoMatchingEntries") : t("homeNoEntriesYet")}
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
              {!isYearCollapsed && !isMonthCollapsed && <View style={[styles.dateGroup, !isDateVisible && styles.flatDateGroup]} onLayout={(event) => handleDateGroupLayout(date, event.nativeEvent.layout.y)}>
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
                <View
                  key={entry.id}
                  collapsable={false}
                  ref={(node) => {
                    if (node) entryRefs.current.set(entry.id, node);
                    else entryRefs.current.delete(entry.id);
                  }}
                  onLayout={(event) => handleEntryLayout(entry.id, entry.date, event.nativeEvent.layout.y)}
                >
                  <DiaryEntryView
                    entry={entry}
                    mode={viewMode}
                    onPress={async () => {
                      if (entry.isLockbox && !(await appLockService.authenticate())) return;
                      router.push(`/entry/${entry.id}`);
                    }}
                    onAddReflection={viewMode === "timeline" ? handleAddReflection : undefined}
                    onReflectionSummaryPress={viewMode === "timeline" ? undefined : handleReflectionSummaryPress}
                  />
                </View>
              );
                })}
              </View>}
              </Fragment>
              );
            })
          )}
        </ScrollView>
      )}
        {isDrawerMounted && (
          <Animated.View
            pointerEvents={isDrawerOpen ? "auto" : "none"}
            style={[
              styles.drawerOverlay,
              {
                opacity: drawerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel={t("homeDrawerCloseA11y")} />
          </Animated.View>
        )}
      </Animated.View>
      <PaywallModal
        visible={showPremiumModal}
        onClose={closePremiumModal}
        appName={APP_IDENTITY.codename}
        title={premiumPaywallTitle(t)}
        subtitle={t("premiumPaywallSubtitle")}
        features={[
          t("premiumPaywallFeatureEntries"),
          t("premiumPaywallFeatureStickers"),
          t("premiumPaywallFeatureInsights"),
          t("premiumPaywallFeatureThemes"),
          t("premiumPaywallFeatureOffline"),
        ]}
        onSuccess={closePremiumModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  contentPane: {
    flex: 1,
  },
  fixedHeader: {
    zIndex: 30,
    elevation: 30,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  menuButton: { width: 30, height: 36, alignItems: "flex-start", justifyContent: "center" },
  viewModePill: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    padding: 2,
  },
  viewModeButton: {
    flex: 1,
    minWidth: 0,
    height: 30,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 5,
  },
  viewModeButtonText: {
    flexShrink: 1,
    fontWeight: "800",
  },
  headerControls: { flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2 },
  headerOptionToggle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerOptionsSlider: {
    flexGrow: 0,
    flexShrink: 0,
  },
  headerOptionsSliderContent: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    paddingRight: 2,
  },
  headerSliderButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 0,
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: "center",
  },
  hierarchyInlineMenu: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingBottom: 8, marginBottom: 8, gap: 4 },
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
  drawerOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0, 0, 0, 0.35)" },
  drawer: { position: "absolute", top: 0, bottom: 0, left: 0, zIndex: 2, paddingHorizontal: 20, borderTopRightRadius: 22, borderBottomRightRadius: 22, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 18 },
  drawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 22 },
  drawerClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  drawerSectionLabel: { fontWeight: "700", letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },
  drawerRow: { minHeight: 52, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  drawerRowText: { flex: 1, marginLeft: 12 },
  clearFilters: { paddingVertical: 14 },
  inlineOptions: { borderBottomWidth: StyleSheet.hairlineWidth, paddingLeft: 32, paddingBottom: 6 },
  inlineOption: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6 },
  filterMoodBadge: { alignSelf: "flex-start", minHeight: 28, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  filterMoodBadgeText: { fontWeight: "700" },
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
