export const DIARY_ENTRY_LIST_PAGE_SIZE = 9;
export const DIARY_ENTRY_LIST_LOAD_MORE_THRESHOLD_PX = 520;

interface DiaryEntryListScrollMetrics {
  readonly visibleHeight: number;
  readonly contentOffsetY: number;
  readonly contentHeight: number;
  readonly thresholdPx?: number;
}

export function getVisibleDiaryEntries<T>(
  entries: readonly T[],
  visibleCount: number,
): readonly T[] {
  if (visibleCount <= 0) return [];
  return entries.slice(0, Math.min(entries.length, visibleCount));
}

export function getNextDiaryEntryVisibleCount(
  currentVisibleCount: number,
  totalCount: number,
  pageSize: number = DIARY_ENTRY_LIST_PAGE_SIZE,
): number {
  if (totalCount <= 0 || pageSize <= 0) return 0;
  return Math.min(totalCount, Math.max(0, currentVisibleCount) + pageSize);
}

export function shouldLoadMoreDiaryEntries({
  visibleHeight,
  contentOffsetY,
  contentHeight,
  thresholdPx = DIARY_ENTRY_LIST_LOAD_MORE_THRESHOLD_PX,
}: DiaryEntryListScrollMetrics): boolean {
  if (visibleHeight <= 0 || contentHeight <= 0) return false;
  return visibleHeight + Math.max(0, contentOffsetY) >= contentHeight - Math.max(0, thresholdPx);
}
