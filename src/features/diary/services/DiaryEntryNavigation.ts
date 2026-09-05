import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';

export function getNextDiaryEntry(
  entries: readonly DiaryEntry[],
  currentEntryId: string,
): DiaryEntry | undefined {
  if (entries.length < 2) return undefined;
  const currentIndex = entries.findIndex((entry) => entry.id === currentEntryId);
  if (currentIndex < 0) return undefined;
  return entries[(currentIndex + 1) % entries.length];
}

export function getPreviousDiaryEntry(
  entries: readonly DiaryEntry[],
  currentEntryId: string,
): DiaryEntry | undefined {
  if (entries.length < 2) return undefined;
  const currentIndex = entries.findIndex((entry) => entry.id === currentEntryId);
  if (currentIndex < 0) return undefined;
  return entries[(currentIndex - 1 + entries.length) % entries.length];
}
