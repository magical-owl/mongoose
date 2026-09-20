import type { DiaryEntry } from './DiaryEntry';

function timestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function compareDiaryEntriesChronologicallyDesc(
  a: DiaryEntry,
  b: DiaryEntry,
): number {
  const dateComparison = b.date.localeCompare(a.date);
  if (dateComparison !== 0) return dateComparison;

  const createdAtComparison = timestamp(b.createdAt) - timestamp(a.createdAt);
  if (createdAtComparison !== 0) return createdAtComparison;

  return b.id.localeCompare(a.id);
}

export function sortDiaryEntriesChronologicallyDesc(entries: readonly DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort(compareDiaryEntriesChronologicallyDesc);
}
