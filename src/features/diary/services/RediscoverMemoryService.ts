import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { getEntryManualMoods } from '@/features/diary/domain/DiaryEntry';
import { isDiaryEntryVisible } from './DiaryEntryVisibility';

const DAY_MS = 86_400_000;
const OLD_PHOTO_MIN_AGE_DAYS = 90;
const ONE_YEAR_AGO_MIN_AGE_DAYS = 365;
const TWO_YEARS_AGO_MIN_AGE_DAYS = 730;
const SECTION_LIMIT = 6;
const MOST_VIEWED_LIMIT = 5;

export interface RediscoverMemorySet {
  readonly surpriseEntry: DiaryEntry | null;
  readonly onThisDayEntries: readonly DiaryEntry[];
  readonly oneYearAgoEntries: readonly DiaryEntry[];
  readonly oldPhotoEntries: readonly DiaryEntry[];
  readonly lookingBackEntries: readonly DiaryEntry[];
  readonly favoriteEntries: readonly DiaryEntry[];
  readonly reflectionEntries: readonly DiaryEntry[];
  readonly sameMonthEntries: readonly DiaryEntry[];
  readonly moodRewindEntries: readonly DiaryEntry[];
  readonly mostViewedEntries: readonly DiaryEntry[];
}

function entryDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function entryAgeDays(entry: DiaryEntry, now: Date): number {
  return Math.floor((now.getTime() - entryDate(entry.date).getTime()) / DAY_MS);
}

function sortEntriesByDateDesc(entries: readonly DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

function isSameMonthDay(entry: DiaryEntry, now: Date): boolean {
  const date = entryDate(entry.date);
  return (
    date.getFullYear() < now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function hasEntryPhoto(entry: DiaryEntry): boolean {
  return Boolean(entry.coverPhoto) || entry.photos.length > 0;
}

function isSameMonthBefore(entry: DiaryEntry, now: Date): boolean {
  const date = entryDate(entry.date);
  return date.getFullYear() < now.getFullYear() && date.getMonth() === now.getMonth();
}

function hasExpressiveMood(entry: DiaryEntry): boolean {
  return getEntryManualMoods(entry).some((mood) => mood !== 'neutral');
}

function sortEntriesByViewCountDesc(entries: readonly DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => {
    const viewDelta = (b.viewCount ?? 0) - (a.viewCount ?? 0);
    if (viewDelta !== 0) return viewDelta;
    return b.date.localeCompare(a.date);
  });
}

export function getRediscoverEligibleEntries(
  entries: readonly DiaryEntry[],
  now: Date = new Date(),
): readonly DiaryEntry[] {
  return sortEntriesByDateDesc(
    entries.filter((entry) => !entry.isLockbox && isDiaryEntryVisible(entry, now)),
  );
}

export function buildRediscoverMemorySet(
  entries: readonly DiaryEntry[],
  now: Date = new Date(),
  shuffleSeed = 0,
): RediscoverMemorySet {
  const eligibleEntries = getRediscoverEligibleEntries(entries, now);
  const surprisePool = eligibleEntries.filter((entry) => entryAgeDays(entry, now) > 0);
  const surpriseEntry = surprisePool.length > 0
    ? surprisePool[Math.abs(shuffleSeed) % surprisePool.length] ?? null
    : null;

  return {
    surpriseEntry,
    onThisDayEntries: eligibleEntries
      .filter((entry) => isSameMonthDay(entry, now))
      .slice(0, SECTION_LIMIT),
    oneYearAgoEntries: eligibleEntries
      .filter((entry) => {
        const ageDays = entryAgeDays(entry, now);
        return ageDays >= ONE_YEAR_AGO_MIN_AGE_DAYS && ageDays < TWO_YEARS_AGO_MIN_AGE_DAYS;
      })
      .slice(0, SECTION_LIMIT),
    oldPhotoEntries: eligibleEntries
      .filter((entry) => hasEntryPhoto(entry) && entryAgeDays(entry, now) >= OLD_PHOTO_MIN_AGE_DAYS)
      .slice(0, SECTION_LIMIT),
    lookingBackEntries: eligibleEntries
      .filter((entry) => entryAgeDays(entry, now) >= TWO_YEARS_AGO_MIN_AGE_DAYS)
      .slice(0, SECTION_LIMIT),
    favoriteEntries: eligibleEntries
      .filter((entry) => entry.isFavorite)
      .slice(0, SECTION_LIMIT),
    reflectionEntries: eligibleEntries
      .filter((entry) => entry.reflections.length > 0)
      .slice(0, SECTION_LIMIT),
    sameMonthEntries: eligibleEntries
      .filter((entry) => isSameMonthBefore(entry, now))
      .slice(0, SECTION_LIMIT),
    moodRewindEntries: eligibleEntries
      .filter(hasExpressiveMood)
      .slice(0, SECTION_LIMIT),
    mostViewedEntries: sortEntriesByViewCountDesc(
      eligibleEntries.filter((entry) => (entry.viewCount ?? 0) > 0),
    ).slice(0, MOST_VIEWED_LIMIT),
  };
}
