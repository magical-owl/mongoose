import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { getEntryManualMoods } from '@/features/diary/domain/DiaryEntry';

import { getDiaryEntryPreviewText } from './DiaryEntryPreviewText';
import { isDiaryEntryVisible } from './DiaryEntryVisibility';

export interface DiaryEntryListFilterOptions {
  readonly search: string;
  readonly year: string;
  readonly month: string;
  readonly date: string;
  readonly tag: string;
  readonly mood: string;
  readonly favoritesOnly: boolean;
}

export function filterVisibleDiaryEntries(
  entries: readonly DiaryEntry[],
  options: DiaryEntryListFilterOptions,
): DiaryEntry[] {
  const searchQuery = options.search.trim().toLowerCase();
  const tagQuery = options.tag.trim().toLowerCase();
  const moodQuery = options.mood.trim().toLowerCase();

  return entries.filter((entry) => {
    if (!isDiaryEntryVisible(entry)) return false;
    if (options.year && !entry.date.startsWith(options.year)) return false;
    if (options.month && !entry.date.startsWith(options.month)) return false;
    if (options.date && entry.date !== options.date) return false;
    if (options.favoritesOnly && !entry.isFavorite) return false;
    if (tagQuery && !entry.tags.some((tag) => tag.toLowerCase().includes(tagQuery))) return false;
    if (moodQuery && !getEntryManualMoods(entry).some((mood) => mood === moodQuery)) return false;

    if (!searchQuery) return true;

    const titleMatches = entry.title.toLowerCase().includes(searchQuery);
    return titleMatches || getDiaryEntryPreviewText(entry).toLowerCase().includes(searchQuery);
  });
}
