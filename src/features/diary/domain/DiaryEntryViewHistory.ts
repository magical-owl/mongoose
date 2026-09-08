import type { DiaryEntry, DiaryEntryViewEvent } from './DiaryEntry';

export interface DiaryEntryViewDateStat {
  readonly date: string;
  readonly count: number;
}

export function getDiaryEntryKnownViewHistoryCount(entry: Pick<DiaryEntry, 'viewHistory'>): number {
  return entry.viewHistory.length;
}

export function getDiaryEntryViewCount(entry: Pick<DiaryEntry, 'viewCount' | 'viewHistory'>): number {
  return Math.max(entry.viewCount ?? 0, getDiaryEntryKnownViewHistoryCount(entry));
}

export function getDiaryEntryLegacyViewCount(entry: Pick<DiaryEntry, 'viewCount' | 'viewHistory'>): number {
  return Math.max(0, (entry.viewCount ?? 0) - getDiaryEntryKnownViewHistoryCount(entry));
}

export function recordDiaryEntryViewHistory(
  entry: Pick<DiaryEntry, 'viewCount' | 'viewHistory'>,
  viewedAt = new Date().toISOString(),
): Pick<DiaryEntry, 'viewCount' | 'viewHistory'> {
  const viewHistory: DiaryEntryViewEvent[] = [...entry.viewHistory, { viewedAt }];
  const viewCount = Math.max((entry.viewCount ?? 0) + 1, viewHistory.length);

  return { viewCount, viewHistory };
}

export function getDiaryEntryViewDateStats(
  entry: Pick<DiaryEntry, 'viewHistory'>,
): DiaryEntryViewDateStat[] {
  const countsByDate = new Map<string, number>();

  for (const event of entry.viewHistory) {
    const date = event.viewedAt.split('T')[0];
    if (!date) continue;
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
  }

  return Array.from(countsByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count || b.date.localeCompare(a.date));
}
