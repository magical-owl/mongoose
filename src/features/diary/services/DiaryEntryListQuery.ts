import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { getEntryManualMoods } from '@/features/diary/domain/DiaryEntry';

export interface DiaryEntryFilterOptionSet {
  readonly year: readonly string[];
  readonly month: readonly string[];
  readonly date: readonly string[];
  readonly tag: readonly string[];
  readonly mood: readonly string[];
}

export function sortDiaryEntriesByDateDesc(entries: readonly DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function getDiaryEntryFilterOptions(entries: readonly DiaryEntry[]): DiaryEntryFilterOptionSet {
  const years = new Set<string>();
  const months = new Set<string>();
  const dates = new Set<string>();
  const tags = new Set<string>();
  const moods = new Set<string>();

  entries.forEach((entry) => {
    years.add(entry.date.slice(0, 4));
    months.add(entry.date.slice(0, 7));
    dates.add(entry.date);
    entry.tags.forEach((tag) => tags.add(tag));
    getEntryManualMoods(entry).forEach((mood) => moods.add(mood));
  });

  return {
    year: Array.from(years).sort().reverse(),
    month: Array.from(months).sort().reverse(),
    date: Array.from(dates).sort().reverse(),
    tag: Array.from(tags).sort(),
    mood: Array.from(moods).sort(),
  };
}
