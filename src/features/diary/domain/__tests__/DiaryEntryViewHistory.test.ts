import {
  getDiaryEntryKnownViewHistoryCount,
  getDiaryEntryLegacyViewCount,
  getDiaryEntryViewCount,
  getDiaryEntryViewDateStats,
  recordDiaryEntryViewHistory,
} from '@/features/diary/domain/DiaryEntryViewHistory';
import { buildDiaryEntry } from '@tests/fixtures/domain';

describe('DiaryEntryViewHistory', () => {
  it('records timestamped view history while preserving legacy view totals', () => {
    const entry = buildDiaryEntry({ viewCount: 4, viewHistory: [] });

    const result = recordDiaryEntryViewHistory(entry, '2026-09-08T10:15:00.000Z');

    expect(result.viewCount).toBe(5);
    expect(result.viewHistory).toEqual([{ viewedAt: '2026-09-08T10:15:00.000Z' }]);
  });

  it('uses the larger value when history has more known views than the legacy count', () => {
    const entry = buildDiaryEntry({
      viewCount: 1,
      viewHistory: [
        { viewedAt: '2026-09-08T10:15:00.000Z' },
        { viewedAt: '2026-09-08T11:20:00.000Z' },
      ],
    });

    expect(getDiaryEntryViewCount(entry)).toBe(2);
    expect(getDiaryEntryKnownViewHistoryCount(entry)).toBe(2);
    expect(getDiaryEntryLegacyViewCount(entry)).toBe(0);
  });

  it('groups view history by date with highest-count dates first', () => {
    const entry = buildDiaryEntry({
      viewHistory: [
        { viewedAt: '2026-09-06T10:15:00.000Z' },
        { viewedAt: '2026-09-08T10:15:00.000Z' },
        { viewedAt: '2026-09-08T11:20:00.000Z' },
        { viewedAt: '2026-09-07T07:20:00.000Z' },
        { viewedAt: '2026-09-07T08:20:00.000Z' },
      ],
    });

    expect(getDiaryEntryViewDateStats(entry)).toEqual([
      { date: '2026-09-08', count: 2 },
      { date: '2026-09-07', count: 2 },
      { date: '2026-09-06', count: 1 },
    ]);
  });
});
