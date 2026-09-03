import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  StyleSheet,
  Alert,
  UIManager,
  findNodeHandle,
  useWindowDimensions,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@providers/ThemeProvider";
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
import { EntryReflectionsModal } from "@/features/diary/components/EntryReflectionsModal";
import {
  JOURNAL_COVER_COLLAPSED_EXTRA_HEIGHT,
  JOURNAL_COVER_EXPANDED_HEIGHT,
  JOURNAL_HEADER_BOTTOM_GAP,
  JOURNAL_HEADER_ROW_HEIGHT,
  JOURNAL_HEADER_TOP_PADDING,
  JournalEntryListChrome,
} from "@/features/diary/components/JournalEntryListChrome";
import { VirtualizedDiaryEntryList, type VirtualizedDiaryEntryListRef } from "@/features/diary/components/VirtualizedDiaryEntryList";
import { PaywallModal } from "@/shared/components/PaywallModal";
import { useAppStore } from "@/stores/useAppStore";
import { useScrollCollapse } from "@/shared/hooks/useScrollCollapse";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { APP_IDENTITY } from "@/config/appIdentity";
import type { HomeViewMode } from "@/stores/useAppStore";
import { getEntryManualMoods, type DiaryEntry, type ManualMood } from "@/features/diary/domain/DiaryEntry";
import { getManualMoodColor } from "@/features/diary/domain/moodColors";
import { premiumPaywallTitle, useTranslation } from "@/localization/i18n";

const HOME_VIEW_MODES = ["timeline", "detailed", "feed"] as const satisfies readonly HomeViewMode[];
const PREMIUM_REMINDER_ENTRY_THRESHOLD = 5;
const PREMIUM_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const ALL_ENTRIES_JOURNAL_ID = "all";
const UNASSIGNED_JOURNAL_ID = "unassigned";

export default function JournalEntriesScreen() {
  const router = useRouter();
  const { id: journalIdParam, title: titleParam } = useLocalSearchParams<{ id?: string; title?: string }>();
  const journalId = typeof journalIdParam === "string" ? journalIdParam : "";
  const routeJournalTitle = typeof titleParam === "string" ? titleParam : "";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const { entries, isLoading, refresh, addReflection, deleteReflection } = useDiary();
  const { journals, refresh: refreshJournals } = useJournals();
  const { profile } = useProfileForm();
  const { isPro } = useSubscription();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const timeFormat = useAppStore((state) => state.timeFormat);
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
  const [reflectionModalEntryId, setReflectionModalEntryId] = useState<string | null>(null);
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
  } = useScrollCollapse<VirtualizedDiaryEntryListRef>();
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
  const reflectionModalEntry = useMemo(
    () => reflectionModalEntryId ? entries.find((entry) => entry.id === reflectionModalEntryId) ?? null : null,
    [entries, reflectionModalEntryId],
  );

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
        const target = scrollRef.current;
        if (target?.scrollToOffset) {
          target.scrollToOffset({ offset: Math.max(0, nextY), animated: true });
        }
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

  const scrollToJournalOffset = useCallback((y: number, animated = true) => {
    const nextY = Math.max(0, y);
    const target = scrollRef.current;
    if (target?.scrollToOffset) {
      target.scrollToOffset({ offset: nextY, animated });
    }
  }, [scrollRef]);

  const scrollToEntry = useCallback((entryId: string) => {
    const entryNode = entryRefs.current.get(entryId);
    if (entryNode && scrollRef.current) {
      const entryHandle = findNodeHandle(entryNode);
      const scrollHandle = findNodeHandle(scrollRef.current);
      if (entryHandle !== null && scrollHandle !== null) {
        UIManager.measure(entryHandle, (_entryX: number, _entryY: number, _entryWidth: number, _entryHeight: number, _entryPageX: number, entryPageY: number) => {
          UIManager.measure(scrollHandle, (_scrollX: number, _scrollY: number, _scrollWidth: number, _scrollHeight: number, _scrollPageX: number, scrollPageY: number) => {
          const nextY = scrollOffsetY.current + entryPageY - scrollPageY - 72;
          scrollToJournalOffset(nextY);
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
    scrollToJournalOffset(groupY + entryY - 72);
    pendingScrollEntryId.current = null;
    return true;
  }, [scrollOffsetY, scrollRef, scrollToJournalOffset]);

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

  const handleReflectionSummaryPress = useCallback((entryId: string) => {
    setReflectionModalEntryId(entryId);
  }, []);

  const handleDeleteReflection = useCallback(
    (entryId: string, reflectionId: string) => {
      Alert.alert(t("reflectionDeleteTitle"), t("reflectionDeleteMessage"), [
        { text: t("entryCancel"), style: "cancel" },
        {
          text: t("entryDelete"),
          style: "destructive",
          onPress: async () => {
            const result = await deleteReflection(entryId, reflectionId);
            if (!result.success) {
              Alert.alert(t("reflectionNotDeletedTitle"), result.error.message);
            }
          },
        },
      ]);
    },
    [deleteReflection, t],
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

  const hasMoreEntries = visibleEntryCount < filteredEntries.length;
  const entryCountsByJournalId = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) => {
      if (!isDiaryEntryVisible(entry)) return;
      (entry.journalIds ?? entry.collectionIds).forEach((entryJournalId) => {
        counts.set(entryJournalId, (counts.get(entryJournalId) ?? 0) + 1);
      });
    });
    return counts;
  }, [entries]);

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

  const handleEntryPress = useCallback(async (entry: DiaryEntry) => {
    if (entry.isLockbox && !(await appLockService.authenticate())) return;
    router.push(`/entry/${entry.id}`);
  }, [router]);

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

  return (
    <AppPatternBackground style={styles.container} testID="journal-entry-list-pattern-background">
      <View style={styles.contentPane}>
        <JournalEntryListChrome
          isDrawerOpen={isDrawerOpen}
          drawerProfile={drawerProfile}
          topInset={insets.top}
          bottomInset={insets.bottom}
          hasJournalCover={hasJournalCover}
          journalCoverImageSource={journalCoverImageSource ?? null}
          journalCoverHeight={journalCoverHeight}
          journalCoverOverlayOpacity={journalCoverOverlayOpacity}
          journalTitle={journalTitle}
          entryCount={filteredEntries.length}
          selectableViewModes={selectableViewModes}
          selectedViewModeIndex={viewModeIndex}
          entryHierarchyMode={entryHierarchyMode}
          expandedFilter={expandedFilter}
          filterOptions={filterOptions}
          search={search}
          filterDate={filterDate}
          filterTag={filterTag}
          filterMood={filterMood}
          favoritesOnly={favoritesOnly}
          moodColor={moodColor}
          onCloseDrawer={closeDrawer}
          onOpenDrawer={openDrawer}
          onProfilePress={() => {
            closeDrawer();
            router.push("/profile/edit");
          }}
          onNavigateBack={navigateBack}
          onCreateEntry={() => {
            if (journalId === ALL_ENTRIES_JOURNAL_ID) {
              router.push("/entry/new");
              return;
            }
            router.push({ pathname: "/entry/new", params: { journalId } });
          }}
          onNavigateSettings={() => {
            closeDrawer();
            router.push("/(tabs)/settings");
          }}
          onSelectViewMode={(index, mode) => {
            setViewModeIndex(index);
            setHomeViewMode(mode);
          }}
          onChangeExpandedFilter={setExpandedFilter}
          onChangeSearch={setSearch}
          onChangeEntryHierarchyMode={setEntryHierarchyMode}
          onChangeFilterDate={setFilterDate}
          onChangeFilterTag={setFilterTag}
          onChangeFilterMood={setFilterMood}
          onToggleFavoritesOnly={() => setFavoritesOnly((value) => !value)}
          onClearFilters={() => {
            setFilterDate("");
            setFilterTag("");
            setFilterMood("");
            setFavoritesOnly(false);
          }}
        />
        {isLoading ? null : (
        <>
          <VirtualizedDiaryEntryList
            ref={scrollRef}
            entries={visibleFilteredEntries}
            totalEntryCount={filteredEntries.length}
            mode={viewMode}
            entryHierarchyMode={entryHierarchyMode}
            calendarDateFormat={calendarDateFormat}
            profile={profile}
            collapsedYears={collapsedYears}
            collapsedMonths={collapsedMonths}
            collapsedDates={collapsedDates}
            hasMoreEntries={hasMoreEntries}
            journals={journals}
            currentJournalId={journalId}
            entryCountsByJournalId={entryCountsByJournalId}
            searchQuery={search}
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
            onEntryPress={handleEntryPress}
            onAddReflection={viewMode === "timeline" || viewMode === "feed" ? handleAddReflection : undefined}
            onReflectionInputFocus={viewMode === "timeline" || viewMode === "feed" ? handleReflectionInputFocus : undefined}
            onReflectionSummaryPress={viewMode === "timeline" || viewMode === "feed" ? undefined : handleReflectionSummaryPress}
            onPressJournalSuggestion={(journal) => {
              router.push({ pathname: "/journal/[id]", params: { id: journal.id, title: journal.title } });
            }}
            onPressSuggestionsTitle={() => router.push("/(tabs)")}
            onScroll={handleJournalScroll}
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
          />
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
      <EntryReflectionsModal
        visible={reflectionModalEntryId !== null}
        entry={reflectionModalEntry}
        profile={profile}
        timeFormat={timeFormat}
        onDismiss={() => setReflectionModalEntryId(null)}
        onAddReflection={handleAddReflection}
        onDeleteReflection={handleDeleteReflection}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  loadMoreIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
