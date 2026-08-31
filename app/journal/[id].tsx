import { Fragment, useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ActivityIndicator,
  Image,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  UIManager,
  findNodeHandle,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import { IconCircleButton } from "@shared/components/IconCircleButton";
import { SectionLabel } from "@shared/components/SectionLabel";
import { SlidingDrawer } from "@shared/components/SlidingDrawer";
import { AppPatternBackground } from "@shared/components/AppPatternBackground";
import { useDiary } from "@/features/diary/hooks/useDiary";
import { useJournals } from "@/features/journal/hooks/useJournals";
import { useProfileForm } from "@/features/profile/hooks/useProfileForm";
import { resolveImportedProfilePhotoUri } from "@/features/profile/services/ProfilePhotoService";
import { getJournalCoverImageSource } from "@/features/journal/domain/JournalBackgrounds";
import { stripHtml } from "@shared/utils/html";
import { isDiaryEntryVisible } from "@/features/diary/services/DiaryEntryVisibility";
import {
  DIARY_ENTRY_LIST_PAGE_SIZE,
  getNextDiaryEntryVisibleCount,
  getVisibleDiaryEntries,
  shouldLoadMoreDiaryEntries,
} from "@/features/diary/services/DiaryEntryListPagination";
import { appLockService } from "@/services/AppLockService";
import { DiaryTimelineList } from "@/features/diary/components/DiaryTimelineList";
import { PaywallModal } from "@/shared/components/PaywallModal";
import { useAppStore } from "@/stores/useAppStore";
import { useScrollCollapse } from "@/shared/hooks/useScrollCollapse";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { APP_IDENTITY } from "@/config/appIdentity";
import type { EntryHierarchyMode, HomeViewMode } from "@/stores/useAppStore";
import { getEntryManualMoods, type ManualMood } from "@/features/diary/domain/DiaryEntry";
import { getManualMoodColor } from "@/features/diary/domain/moodColors";
import { homeFilterAllLabel, homeFilterKindLabel, homeViewModeLabel, manualMoodLabel, premiumPaywallTitle, useTranslation } from "@/localization/i18n";

const HIERARCHY_MODES: EntryHierarchyMode[] = ["year-month-date", "month-date", "date", "none"];
const HOME_VIEW_MODES = ["timeline", "detailed", "feed"] as const satisfies readonly HomeViewMode[];
const PREMIUM_REMINDER_ENTRY_THRESHOLD = 5;
const PREMIUM_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const ALL_ENTRIES_JOURNAL_ID = "all";
const UNASSIGNED_JOURNAL_ID = "unassigned";
const JOURNAL_COVER_EXPANDED_HEIGHT = 254;
const JOURNAL_COVER_COLLAPSED_EXTRA_HEIGHT = 12;
const JOURNAL_HEADER_TOP_PADDING = 16;
const JOURNAL_HEADER_ROW_HEIGHT = 44;
const JOURNAL_HEADER_BOTTOM_GAP = 14;
const JOURNAL_VIEW_PILL_HEIGHT = JOURNAL_HEADER_ROW_HEIGHT;

function hierarchyModeLabel(mode: EntryHierarchyMode): string {
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

export default function JournalEntriesScreen() {
  const router = useRouter();
  const { id: journalIdParam, title: titleParam } = useLocalSearchParams<{ id?: string; title?: string }>();
  const journalId = typeof journalIdParam === "string" ? journalIdParam : "";
  const routeJournalTitle = typeof titleParam === "string" ? titleParam : "";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const { entries, isLoading, refresh, addReflection } = useDiary();
  const { journals, refresh: refreshJournals } = useJournals();
  const { profile } = useProfileForm();
  const { isPro } = useSubscription();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const homeViewModes = useAppStore((state) => state.homeViewModes);
  const homeViewMode = useAppStore((state) => state.homeViewMode);
  const entryHierarchyMode = useAppStore((state) => state.entryHierarchyMode);
  const premiumOnboardingPromptShown = useAppStore((state) => state.premiumOnboardingPromptShown);
  const premiumPromptDismissedAt = useAppStore((state) => state.premiumPromptDismissedAt);
  const syntheticJournalCovers = useAppStore((state) => state.syntheticJournalCovers);
  const setHomeViewMode = useAppStore((state) => state.setHomeViewMode);
  const setEntryHierarchyMode = useAppStore((state) => state.setEntryHierarchyMode);
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
  const [expandedFilter, setExpandedFilter] = useState<
    "date" | "tag" | "mood" | "hierarchy" | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [entryPagination, setEntryPagination] = useState({
    key: "",
    visibleCount: DIARY_ENTRY_LIST_PAGE_SIZE,
  });
  const [isLoadingMoreEntries, setIsLoadingMoreEntries] = useState(false);
  const entryLayoutY = useRef(new Map<string, number>());
  const dateGroupLayoutY = useRef(new Map<string, number>());
  const entryDateById = useRef(new Map<string, string>());
  const entryRefs = useRef(new Map<string, View>());
  const {
    scrollRef,
    scrollY,
    scrollOffsetYRef: scrollOffsetY,
    handleScroll: handleCollapseScroll,
    resetScrollCollapse,
  } = useScrollCollapse();
  const keyboardTopY = useRef(windowHeight);
  const focusedReflectionEntryId = useRef<string | null>(null);
  const pendingScrollEntryId = useRef<string | null>(null);
  const loadMoreAnimationFrames = useRef<number[]>([]);
  const premiumPromptShownThisSession = useRef(false);
  const selectedJournal = journals.find((journal) => journal.id === journalId);
  const journalEntries = useMemo(() => {
    if (journalId === ALL_ENTRIES_JOURNAL_ID) return entries;
    if (journalId === UNASSIGNED_JOURNAL_ID) return entries.filter((entry) => (entry.journalIds?.length ?? entry.collectionIds.length) === 0);
    return entries.filter((entry) => (entry.journalIds ?? entry.collectionIds).includes(journalId));
  }, [entries, journalId]);

  const journalTitle = journalId === ALL_ENTRIES_JOURNAL_ID
    ? t("journalAllEntriesTitle")
    : journalId === UNASSIGNED_JOURNAL_ID
      ? t("journalUnassignedTitle")
      : selectedJournal?.title ?? (routeJournalTitle || t("journalFallbackTitle"));
  const syntheticJournalCover = journalId === ALL_ENTRIES_JOURNAL_ID
    ? syntheticJournalCovers.all
    : journalId === UNASSIGNED_JOURNAL_ID
      ? syntheticJournalCovers.unassigned
      : undefined;
  const journalCoverImageUri = selectedJournal?.coverImageUri ?? syntheticJournalCover?.coverImageUri;
  const journalCoverImageSource = getJournalCoverImageSource(journalCoverImageUri);
  const drawerProfile = useMemo(
    () => ({
      displayName: profile?.displayName.trim() || t("profileFallbackName"),
      avatarUri: profile?.avatarUri ? resolveImportedProfilePhotoUri(profile.avatarUri) : undefined,
    }),
    [profile, t],
  );

  const filterOptions = useMemo(
    () => ({
      date: Array.from(new Set(journalEntries.map((entry) => entry.date)))
        .sort()
        .reverse(),
      tag: Array.from(new Set(journalEntries.flatMap((entry) => entry.tags))).sort(),
      mood: Array.from(
        new Set(
          journalEntries.flatMap((entry) => getEntryManualMoods(entry)),
        ),
      ).sort(),
    }),
    [journalEntries],
  );

  useFocusEffect(
    useCallback(() => {
      resetScrollCollapse();
      refresh();
      void refreshJournals();
    }, [refresh, refreshJournals, resetScrollCollapse]),
  );

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
    setIsDrawerOpen(true);
  }, []);
  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }, [router]);

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

  const scrollReflectionInputIntoView = useCallback((entryId: string) => {
    const entryNode = entryRefs.current.get(entryId);
    if (!entryNode || !scrollRef.current) return;
    const entryHandle = findNodeHandle(entryNode);
    const scrollHandle = findNodeHandle(scrollRef.current);
    if (entryHandle === null || scrollHandle === null) return;

    UIManager.measure(entryHandle, (_entryX: number, _entryY: number, _entryWidth: number, entryHeight: number, _entryPageX: number, entryPageY: number) => {
      UIManager.measure(scrollHandle, (_scrollX: number, _scrollY: number, _scrollWidth: number, _scrollHeight: number, _scrollPageX: number, _scrollPageY: number) => {
        const keyboardSafeBottom = keyboardTopY.current - 18;
        const entryBottomY = entryPageY + entryHeight;
        if (entryBottomY <= keyboardSafeBottom) return;
        const nextY = scrollOffsetY.current + entryBottomY - keyboardSafeBottom;
        scrollRef.current?.scrollTo({ y: Math.max(0, nextY), animated: true });
      });
    });
  }, [scrollOffsetY, scrollRef]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTopY.current = event.endCoordinates.screenY;
      setKeyboardHeight(event.endCoordinates.height);
      const entryId = focusedReflectionEntryId.current;
      if (entryId) {
        setTimeout(() => scrollReflectionInputIntoView(entryId), 80);
      }
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopY.current = windowHeight;
      focusedReflectionEntryId.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollReflectionInputIntoView, windowHeight]);

  const handleReflectionInputFocus = useCallback((entryId: string) => {
    focusedReflectionEntryId.current = entryId;
    setTimeout(() => scrollReflectionInputIntoView(entryId), 80);
  }, [scrollReflectionInputIntoView]);

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
  }, [scrollOffsetY, scrollRef]);

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
      const entry = journalEntries.find((item) => item.id === entryId);
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
    [journalEntries, scrollToEntry, selectableViewModes, setHomeViewMode, setViewModeIndex, t],
  );

  const filteredEntries = useMemo(() => {
    if (
      !search.trim() &&
      !filterDate &&
      !filterTag &&
      !filterMood &&
      !favoritesOnly
    )
      return journalEntries.filter((entry) => isDiaryEntryVisible(entry));
    const q = search.toLowerCase();
    return journalEntries.filter(
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
          getEntryManualMoods(e).includes(filterMood.toLowerCase() as ManualMood)) &&
        (!favoritesOnly || e.isFavorite),
    );
  }, [
    journalEntries,
    search,
    filterDate,
    filterTag,
    filterMood,
    favoritesOnly,
  ]);

  const entryPaginationKey = useMemo(
    () => [journalId, search, filterDate, filterTag, filterMood, favoritesOnly ? "favorites" : "all"].join("|"),
    [favoritesOnly, filterDate, filterMood, filterTag, journalId, search],
  );
  const visibleEntryCount = entryPagination.key === entryPaginationKey
    ? entryPagination.visibleCount
    : DIARY_ENTRY_LIST_PAGE_SIZE;

  const sortedFilteredEntries = useMemo(
    () => [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredEntries],
  );

  const visibleFilteredEntries = useMemo(
    () => getVisibleDiaryEntries(sortedFilteredEntries, visibleEntryCount),
    [sortedFilteredEntries, visibleEntryCount],
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, (typeof visibleFilteredEntries)[number][]>();
    visibleFilteredEntries.forEach((entry) => {
      const group = groups.get(entry.date);
      if (group) group.push(entry);
      else groups.set(entry.date, [entry]);
    });
    return Array.from(groups.entries());
  }, [visibleFilteredEntries]);
  const hasMoreEntries = visibleEntryCount < filteredEntries.length;

  const loadMoreEntries = useCallback(() => {
    if (isLoadingMoreEntries || !hasMoreEntries) return;
    setIsLoadingMoreEntries(true);
    const showIndicatorFrame = requestAnimationFrame(() => {
      setEntryPagination((current) => {
        const currentVisibleCount = current.key === entryPaginationKey
          ? current.visibleCount
          : DIARY_ENTRY_LIST_PAGE_SIZE;
        return {
          key: entryPaginationKey,
          visibleCount: getNextDiaryEntryVisibleCount(currentVisibleCount, filteredEntries.length),
        };
      });
      const hideIndicatorFrame = requestAnimationFrame(() => {
        setIsLoadingMoreEntries(false);
        loadMoreAnimationFrames.current = loadMoreAnimationFrames.current.filter(
          (frame) => frame !== showIndicatorFrame && frame !== hideIndicatorFrame,
        );
      });
      loadMoreAnimationFrames.current.push(hideIndicatorFrame);
    });
    loadMoreAnimationFrames.current.push(showIndicatorFrame);
  }, [entryPaginationKey, filteredEntries.length, hasMoreEntries, isLoadingMoreEntries]);

  useEffect(() => () => {
    loadMoreAnimationFrames.current.forEach((frame) => cancelAnimationFrame(frame));
    loadMoreAnimationFrames.current = [];
  }, []);

  const handleJournalScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleCollapseScroll(event);
      if (
        hasMoreEntries &&
        !isLoadingMoreEntries &&
        shouldLoadMoreDiaryEntries({
          visibleHeight: event.nativeEvent.layoutMeasurement.height,
          contentOffsetY: event.nativeEvent.contentOffset.y,
          contentHeight: event.nativeEvent.contentSize.height,
        })
      ) {
        loadMoreEntries();
      }
    },
    [handleCollapseScroll, hasMoreEntries, isLoadingMoreEntries, loadMoreEntries],
  );

  const hasJournalCover = Boolean(journalCoverImageSource);
  const coverHeaderFloorHeight = insets.top
    + JOURNAL_HEADER_TOP_PADDING
    + JOURNAL_HEADER_ROW_HEIGHT
    + JOURNAL_COVER_COLLAPSED_EXTRA_HEIGHT;
  const journalCoverCollapseDistance = Math.max(
    1,
    JOURNAL_COVER_EXPANDED_HEIGHT - coverHeaderFloorHeight,
  );
  const journalCoverHeight = scrollY.interpolate({
    inputRange: [0, journalCoverCollapseDistance],
    outputRange: [JOURNAL_COVER_EXPANDED_HEIGHT, coverHeaderFloorHeight],
    extrapolate: "clamp",
  });
  const journalCoverOverlayOpacity = scrollY.interpolate({
    inputRange: [0, journalCoverCollapseDistance * 0.65],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const expandedHeaderHeight = hasJournalCover
    ? JOURNAL_COVER_EXPANDED_HEIGHT
    : insets.top
      + JOURNAL_HEADER_TOP_PADDING
      + JOURNAL_HEADER_ROW_HEIGHT
      + JOURNAL_HEADER_BOTTOM_GAP;
  const entryListTopPadding = hasJournalCover
    ? Math.max(0, expandedHeaderHeight - StyleSheet.hairlineWidth)
    : expandedHeaderHeight;
  const collapsedHeaderHeight = hasJournalCover
    ? coverHeaderFloorHeight + JOURNAL_HEADER_BOTTOM_GAP
    : insets.top
      + JOURNAL_HEADER_TOP_PADDING
      + JOURNAL_HEADER_ROW_HEIGHT
      + JOURNAL_HEADER_BOTTOM_GAP;

  const viewModePill = (
    <View
      style={[
        styles.viewModePill,
        {
          backgroundColor: hasJournalCover ? "rgba(0, 0, 0, 0.56)" : theme.colors.surface,
          borderColor: hasJournalCover ? theme.colors.stickerControlText + "40" : theme.colors.border,
        },
      ]}
    >
      {selectableViewModes.map((mode, idx) => {
        const selected = viewModeIndex === idx;
        return (
          <TouchableOpacity
            key={mode}
            onPress={() => { setViewModeIndex(idx); setHomeViewMode(mode); }}
            style={[styles.viewModeButton, selected && { backgroundColor: theme.colors.tint }]}
            accessibilityRole="tab"
            accessibilityLabel={homeViewModeLabel(mode, t)}
            accessibilityState={{ selected }}
          >
            <Text
              preset="caption"
              style={[
                styles.viewModeButtonText,
                { color: selected || hasJournalCover ? theme.colors.stickerControlText : theme.colors.textSecondary },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {homeViewModeLabel(mode, t)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <AppPatternBackground style={styles.container} testID="journal-entry-list-pattern-background">
      <SlidingDrawer
        visible={isDrawerOpen}
        onClose={closeDrawer}
        accessibilityCloseLabel={t("homeDrawerCloseA11y")}
        profile={drawerProfile}
        onProfilePress={() => {
          closeDrawer();
          router.push("/profile/edit");
        }}
        profileAccessibilityLabel={t("settingsProfileTitle")}
        drawerStyle={[styles.drawer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
        testID="journal-entry-list-drawer"
      >
          <ScrollView showsVerticalScrollIndicator={false}>
            <SectionLabel style={styles.drawerSectionLabel}>{t("homeHeaderSearch")}</SectionLabel>
            <View style={[styles.drawerSearchBar, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("homeSearchPlaceholder")}
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.drawerSearchInput, { color: theme.colors.text }]}
                returnKeyType="search"
                accessibilityLabel={t("homeHeaderSearch")}
              />
              {search ? (
                <IconCircleButton
                  icon="close-circle"
                  size="sm"
                  surface="transparent"
                  onPress={() => setSearch("")}
                  accessibilityLabel={t("homeHeaderCloseSearch")}
                  iconSize={18}
                />
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setExpandedFilter(expandedFilter === "hierarchy" ? null : "hierarchy")}
              style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={`Entry hierarchy: ${hierarchyModeLabel(entryHierarchyMode)}. Open options.`}
              accessibilityState={{ expanded: expandedFilter === "hierarchy" }}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{hierarchyModeLabel(entryHierarchyMode)}</Text>
              <Ionicons name={expandedFilter === "hierarchy" ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {expandedFilter === "hierarchy" && (
              <View style={[styles.inlineOptions, { borderBottomColor: theme.colors.border }]}>
                {HIERARCHY_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => {
                      setEntryHierarchyMode(mode);
                      setExpandedFilter(null);
                    }}
                    style={[styles.inlineOption, mode === entryHierarchyMode && { backgroundColor: theme.colors.tint + "18" }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: mode === entryHierarchyMode }}
                  >
                    <Text preset="caption" color={mode === entryHierarchyMode ? "tint" : "text"}>{hierarchyModeLabel(mode)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <SectionLabel style={styles.drawerSectionLabel}>{t("homeDrawerFilterEntries")}</SectionLabel>
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
            <TouchableOpacity
              onPress={() => {
                closeDrawer();
                router.push("/(tabs)/settings");
              }}
              style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={t("settingsTitle")}
            >
              <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
              <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{t("settingsTitle")}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
      </SlidingDrawer>
      <View style={styles.contentPane}>
        <View
          style={[
            styles.fixedHeader,
            hasJournalCover ? styles.fixedHeaderWithCover : { paddingTop: insets.top + JOURNAL_HEADER_TOP_PADDING },
          ]}
        >
          {journalCoverImageSource ? (
            <Animated.View
              style={[
                styles.journalCoverContext,
                {
                  height: journalCoverHeight,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Image
                source={journalCoverImageSource}
                style={styles.journalCoverImage}
                resizeMode="cover"
                accessibilityRole="image"
                accessibilityLabel={journalTitle}
              />
              <Animated.View style={[styles.journalCoverContextOverlay, { opacity: journalCoverOverlayOpacity }]}>
                <View style={styles.journalCoverContextTitleBadge}>
                  <Text preset="label" numberOfLines={1} style={[styles.journalCoverContextTitle, { color: theme.colors.stickerControlText }]}>
                    {journalTitle}
                  </Text>
                </View>
                <View style={styles.journalCoverContextMetaBadge}>
                  <Text preset="caption" numberOfLines={1} style={[styles.journalCoverContextMeta, { color: theme.colors.stickerControlText }]}>
                    {filteredEntries.length === 1 ? t("journalEntryCountOne") : t("journalEntryCountMany").replace("{count}", String(filteredEntries.length))}
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}
          <View
            style={[
              styles.headerRow,
              hasJournalCover && styles.headerRowOnCover,
              hasJournalCover && { paddingTop: insets.top + JOURNAL_HEADER_TOP_PADDING },
            ]}
          >
            <View style={[styles.headerSide, styles.headerSideLeft]}>
              <IconCircleButton icon="chevron-left" onPress={navigateBack} accessibilityLabel={t("entryBackA11y")} surface={hasJournalCover ? "overlay" : "surface"} />
            </View>
            {viewModePill}
            <View style={[styles.headerSide, styles.headerSideRight]}>
              <IconCircleButton
                icon="plus"
                onPress={() => {
                  if (journalId === ALL_ENTRIES_JOURNAL_ID) {
                    router.push("/entry/new");
                    return;
                  }
                  router.push({ pathname: "/entry/new", params: { journalId } });
                }}
                accessibilityLabel={t("entryCreateTitle")}
                surface={hasJournalCover ? "overlay" : "surface"}
              />
              <IconCircleButton icon="menu" onPress={openDrawer} accessibilityLabel={t("homeDrawerOpenA11y")} surface={hasJournalCover ? "overlay" : "surface"} />
            </View>
          </View>
        </View>
        {isLoading ? null : (
        <>
          <ScrollView
            ref={scrollRef}
            onScroll={handleJournalScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContent,
              {
                minHeight: windowHeight + (hasJournalCover ? JOURNAL_COVER_EXPANDED_HEIGHT - coverHeaderFloorHeight : 0),
                paddingTop: entryListTopPadding,
                paddingBottom: insets.bottom + 32 + keyboardHeight + collapsedHeaderHeight,
              },
            ]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
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
            <View style={[styles.emptyPanel, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.emptyIconHalo, { backgroundColor: theme.colors.tint + "16" }]}>
                <Ionicons name={search.trim() ? "search-outline" : "pencil-outline"} size={26} color={theme.colors.tint} />
              </View>
              <Text preset="label" color="text" style={styles.emptyPrompt}>
                {search.trim() ? t("homeNoMatchingEntries") : t("homeEmptyPrompt")}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {search.trim() ? t("homeSearchPlaceholder") : t("homeNoEntriesYet")}
              </Text>
            </View>
          ) : (
            <DiaryTimelineList
              groupedEntries={groupedEntries}
              mode={viewMode}
              profile={profile}
              calendarDateFormat={calendarDateFormat}
              entryHierarchyMode={entryHierarchyMode}
              collapsedYears={collapsedYears}
              collapsedMonths={collapsedMonths}
              collapsedDates={collapsedDates}
              onToggleYear={(yearKey) => setCollapsedYears((current) => {
                const next = new Set(current);
                if (next.has(yearKey)) next.delete(yearKey);
                else next.add(yearKey);
                return next;
              })}
              onToggleMonth={(monthKey) => setCollapsedMonths((current) => {
                const next = new Set(current);
                if (next.has(monthKey)) next.delete(monthKey);
                else next.add(monthKey);
                return next;
              })}
              onToggleDate={(date) => setCollapsedDates((current) => {
                const next = new Set(current);
                if (next.has(date)) next.delete(date);
                else next.add(date);
                return next;
              })}
              onDateGroupLayout={handleDateGroupLayout}
              onEntryLayout={handleEntryLayout}
              onEntryRef={(entryId, node) => {
                if (node) entryRefs.current.set(entryId, node);
                else entryRefs.current.delete(entryId);
              }}
              onEntryPress={async (entry) => {
                if (entry.isLockbox && !(await appLockService.authenticate())) return;
                router.push(`/entry/${entry.id}`);
              }}
              onAddReflection={viewMode === "timeline" || viewMode === "feed" ? handleAddReflection : undefined}
              onReflectionInputFocus={viewMode === "timeline" || viewMode === "feed" ? handleReflectionInputFocus : undefined}
              onReflectionSummaryPress={viewMode === "timeline" || viewMode === "feed" ? undefined : handleReflectionSummaryPress}
            />
          )}
          </ScrollView>
          {isLoadingMoreEntries && hasMoreEntries ? (
            <View
              pointerEvents="none"
              style={[
                styles.loadMoreIndicator,
                { bottom: insets.bottom + collapsedHeaderHeight + 10 },
              ]}
              accessibilityRole="progressbar"
            >
              <ActivityIndicator color={theme.colors.tint} />
            </View>
          ) : null}
        </>
        )}
      </View>
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
    </AppPatternBackground>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    paddingHorizontal: 20,
  },
  fixedHeaderWithCover: {
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  journalCoverContext: {
    borderBottomWidth: 1,
    borderRadius: 0,
    overflow: "hidden",
  },
  journalCoverImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  journalCoverContextOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  journalCoverContextTitleBadge: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },
  journalCoverContextMetaBadge: {
    flexShrink: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },
  journalCoverContextTitle: {
    fontWeight: "800",
    lineHeight: 20,
  },
  journalCoverContextMeta: {
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: JOURNAL_HEADER_ROW_HEIGHT,
    marginBottom: JOURNAL_HEADER_BOTTOM_GAP,
    gap: 8,
  },
  headerRowOnCover: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 3,
    height: undefined,
    minHeight: JOURNAL_HEADER_ROW_HEIGHT,
    marginBottom: 0,
  },
  headerSide: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerSideLeft: { width: 44 },
  headerSideRight: { width: 94, justifyContent: "flex-end" },
  viewModePill: {
    flex: 1,
    minWidth: 0,
    maxWidth: 260,
    alignSelf: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 22,
    padding: 4,
    height: JOURNAL_VIEW_PILL_HEIGHT,
    alignItems: "center",
  },
  viewModeButton: {
    flex: 1,
    minWidth: 0,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    paddingHorizontal: 8,
  },
  viewModeButtonText: {
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 16,
  },
  drawer: {
    paddingHorizontal: 20,
  },
  drawerSearchBar: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  drawerSearchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600",
  },
  drawerSectionLabel: { fontWeight: "700", letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },
  drawerRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  drawerRowText: { flex: 1 },
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
  emptyPanel: { minHeight: 220, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 16, padding: 24 },
  emptyIconHalo: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyPrompt: { fontWeight: "800", marginBottom: 6, textAlign: "center" },
  emptyText: { fontSize: 15, textAlign: "center" },
  loadMoreIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
