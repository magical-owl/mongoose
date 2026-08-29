import type { DiaryEntry } from '../domain/DiaryEntry';

type DiaryEntryCacheSnapshot = {
  entries: DiaryEntry[] | null;
  deletedEntries: DiaryEntry[] | null;
};

let cachedEntries: DiaryEntry[] | null = null;
let cachedDeletedEntries: DiaryEntry[] | null = null;

export function getCachedDiaryEntries(): DiaryEntryCacheSnapshot {
  return {
    entries: cachedEntries,
    deletedEntries: cachedDeletedEntries,
  };
}

export function setCachedDiaryEntries(entries: readonly DiaryEntry[], deletedEntries: readonly DiaryEntry[]): void {
  cachedEntries = [...entries];
  cachedDeletedEntries = [...deletedEntries];
}

export function clearCachedDiaryEntries(): void {
  cachedEntries = null;
  cachedDeletedEntries = null;
}
