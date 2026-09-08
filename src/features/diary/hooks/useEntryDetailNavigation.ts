import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Animated,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getNextDiaryEntry, getPreviousDiaryEntry } from '@/features/diary/services/DiaryEntryNavigation';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';

type AdjacentEntryDirection = 'previous' | 'next';

const NEXT_ENTRY_SCROLL_THRESHOLD = 36;
const NEXT_ENTRY_LOAD_DELAY_MS = 550;
const NEXT_ENTRY_FADE_OUT_MS = 420;
const NEXT_ENTRY_FADE_IN_MS = 520;

async function preloadEntryCoverPhoto(photo?: DiaryPhoto): Promise<void> {
  if (!photo) return;
  const source = getDiaryPhotoImageSource(photo.uri);
  if (!source || typeof source !== 'object' || !('uri' in source) || typeof source.uri !== 'string') return;
  await Image.prefetch(source.uri).catch(() => false);
}

interface UseEntryDetailNavigationOptions {
  readonly entries: readonly DiaryEntry[];
  readonly entry: DiaryEntry | null;
  readonly isEditing: boolean;
  readonly scrollRef: RefObject<ScrollView | null>;
  readonly hydrateEntryState: (entry: DiaryEntry) => void;
  readonly resetScrollCollapse: () => void;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly onRouteEntryChange: (entryId: string) => void;
  readonly onRequireLockboxAccess: () => Promise<boolean>;
  readonly onResetTransientUi: () => void;
}

interface UseEntryDetailNavigationResult {
  readonly previousEntry: DiaryEntry | undefined;
  readonly nextEntry: DiaryEntry | undefined;
  readonly loadingEntryDirection: AdjacentEntryDirection | null;
  readonly viewEntryOpacity: Animated.Value;
  readonly handleLoadPreviousEntry: () => void;
  readonly handleLoadNextEntry: () => void;
  readonly handleViewScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly markViewScrollStarted: () => void;
  readonly resetAdjacentEntryNavigation: () => void;
}

export function useEntryDetailNavigation({
  entries,
  entry,
  isEditing,
  scrollRef,
  hydrateEntryState,
  resetScrollCollapse,
  onScroll,
  onRouteEntryChange,
  onRequireLockboxAccess,
  onResetTransientUi,
}: UseEntryDetailNavigationOptions): UseEntryDetailNavigationResult {
  const adjacentEntryLoadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeInFrame = useRef<number | null>(null);
  const hasUserScrolledViewRef = useRef(false);
  const isLoadingAdjacentEntryRef = useRef(false);
  const viewEntryOpacity = useRef(new Animated.Value(1)).current;
  const [loadingEntryDirection, setLoadingEntryDirection] = useState<AdjacentEntryDirection | null>(null);

  useEffect(() => () => {
    if (adjacentEntryLoadTimer.current) clearTimeout(adjacentEntryLoadTimer.current);
    if (fadeInFrame.current) cancelAnimationFrame(fadeInFrame.current);
  }, []);

  const previousEntry = useMemo(() => (
    entry ? getPreviousDiaryEntry(entries, entry.id) : undefined
  ), [entries, entry]);

  const nextEntry = useMemo(() => (
    entry ? getNextDiaryEntry(entries, entry.id) : undefined
  ), [entries, entry]);

  const resetAdjacentEntryNavigation = useCallback(() => {
    hasUserScrolledViewRef.current = false;
    isLoadingAdjacentEntryRef.current = false;
    setLoadingEntryDirection(null);
    viewEntryOpacity.setValue(1);
  }, [viewEntryOpacity]);

  const handleLoadAdjacentEntry = useCallback(async (targetEntry: DiaryEntry | undefined, direction: AdjacentEntryDirection) => {
    if (isEditing || !targetEntry || isLoadingAdjacentEntryRef.current) return;
    isLoadingAdjacentEntryRef.current = true;
    setLoadingEntryDirection(direction);
    viewEntryOpacity.stopAnimation();

    if (targetEntry.isLockbox && !(await onRequireLockboxAccess())) {
      isLoadingAdjacentEntryRef.current = false;
      setLoadingEntryDirection(null);
      viewEntryOpacity.setValue(1);
      return;
    }

    await preloadEntryCoverPhoto(targetEntry.coverPhoto);

    if (adjacentEntryLoadTimer.current) clearTimeout(adjacentEntryLoadTimer.current);
    if (fadeInFrame.current) cancelAnimationFrame(fadeInFrame.current);
    adjacentEntryLoadTimer.current = setTimeout(() => {
      Animated.timing(viewEntryOpacity, {
        toValue: 0,
        duration: NEXT_ENTRY_FADE_OUT_MS,
        useNativeDriver: true,
      }).start(() => {
        onResetTransientUi();
        viewEntryOpacity.setValue(0);
        hydrateEntryState(targetEntry);
        resetScrollCollapse();
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        onRouteEntryChange(targetEntry.id);
        adjacentEntryLoadTimer.current = null;
        fadeInFrame.current = requestAnimationFrame(() => {
          setLoadingEntryDirection(null);
          Animated.timing(viewEntryOpacity, {
            toValue: 1,
            duration: NEXT_ENTRY_FADE_IN_MS,
            useNativeDriver: true,
          }).start(() => {
            fadeInFrame.current = null;
            isLoadingAdjacentEntryRef.current = false;
          });
        });
      });
    }, NEXT_ENTRY_LOAD_DELAY_MS);
  }, [
    hydrateEntryState,
    isEditing,
    onRequireLockboxAccess,
    onResetTransientUi,
    onRouteEntryChange,
    resetScrollCollapse,
    scrollRef,
    viewEntryOpacity,
  ]);

  const handleLoadPreviousEntry = useCallback(() => {
    void handleLoadAdjacentEntry(previousEntry, 'previous');
  }, [handleLoadAdjacentEntry, previousEntry]);

  const handleLoadNextEntry = useCallback(() => {
    void handleLoadAdjacentEntry(nextEntry, 'next');
  }, [handleLoadAdjacentEntry, nextEntry]);

  const handleViewScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(event);
    if (isEditing || !hasUserScrolledViewRef.current || !nextEntry) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom <= NEXT_ENTRY_SCROLL_THRESHOLD) {
      handleLoadNextEntry();
    }
  }, [handleLoadNextEntry, isEditing, nextEntry, onScroll]);

  const markViewScrollStarted = useCallback(() => {
    hasUserScrolledViewRef.current = true;
  }, []);

  return {
    previousEntry,
    nextEntry,
    loadingEntryDirection,
    viewEntryOpacity,
    handleLoadPreviousEntry,
    handleLoadNextEntry,
    handleViewScroll,
    markViewScrollStarted,
    resetAdjacentEntryNavigation,
  };
}
