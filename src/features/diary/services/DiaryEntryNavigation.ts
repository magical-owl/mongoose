import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';

export function getNextDiaryEntry(
  entries: readonly DiaryEntry[],
  currentEntryId: string,
): DiaryEntry | undefined {
  const currentIndex = entries.findIndex((entry) => entry.id === currentEntryId);
  if (currentIndex < 0) return undefined;
  return entries[currentIndex + 1];
}
