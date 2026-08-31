import {
  DIARY_ENTRY_LIST_LOAD_MORE_THRESHOLD_PX,
  DIARY_ENTRY_LIST_PAGE_SIZE,
  getNextDiaryEntryVisibleCount,
  getVisibleDiaryEntries,
  shouldLoadMoreDiaryEntries,
} from '../DiaryEntryListPagination';

describe('DiaryEntryListPagination', () => {
  describe('getVisibleDiaryEntries', () => {
    it('returns only the requested visible entries', () => {
      const entries = Array.from({ length: DIARY_ENTRY_LIST_PAGE_SIZE + 3 }, (_, index) => index);

      expect(getVisibleDiaryEntries(entries, DIARY_ENTRY_LIST_PAGE_SIZE)).toEqual(
        entries.slice(0, DIARY_ENTRY_LIST_PAGE_SIZE),
      );
    });

    it('returns an empty list for non-positive visible counts', () => {
      expect(getVisibleDiaryEntries([1, 2, 3], 0)).toEqual([]);
      expect(getVisibleDiaryEntries([1, 2, 3], -5)).toEqual([]);
    });
  });

  describe('getNextDiaryEntryVisibleCount', () => {
    it('advances by one page without exceeding the total count', () => {
      expect(getNextDiaryEntryVisibleCount(24, 57, 24)).toBe(48);
      expect(getNextDiaryEntryVisibleCount(48, 57, 24)).toBe(57);
    });

    it('handles empty totals and invalid page sizes', () => {
      expect(getNextDiaryEntryVisibleCount(24, 0, 24)).toBe(0);
      expect(getNextDiaryEntryVisibleCount(24, 57, 0)).toBe(0);
    });
  });

  describe('shouldLoadMoreDiaryEntries', () => {
    it('loads more when the scroll position reaches the bottom threshold', () => {
      expect(
        shouldLoadMoreDiaryEntries({
          visibleHeight: 800,
          contentOffsetY: 700,
          contentHeight: 800 + 700 + DIARY_ENTRY_LIST_LOAD_MORE_THRESHOLD_PX,
        }),
      ).toBe(true);
    });

    it('does not load more before the bottom threshold', () => {
      expect(
        shouldLoadMoreDiaryEntries({
          visibleHeight: 800,
          contentOffsetY: 100,
          contentHeight: 2000,
          thresholdPx: 300,
        }),
      ).toBe(false);
    });
  });
});
