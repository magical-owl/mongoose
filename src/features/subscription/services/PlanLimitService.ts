import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { Result, ArchitectureError } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import type { DailyPlanUsage } from '../domain/PlanUsage';

export const FREE_PLAN_LIMITS = {
  entriesPerDay: 3,
  stickersPerDay: 9,
} as const;

export const PREMIUM_PLAN_LIMITS = {
  entriesPerDay: null,
  stickersPerDay: null,
} as const;

export const PLAN_LIMIT_ERROR_CODES = {
  entriesPerDay: 'FREE_ENTRY_DAILY_LIMIT_REACHED',
  stickersPerDay: 'FREE_STICKER_DAILY_LIMIT_REACHED',
} as const;

const PLAN_LIMIT_ERROR_CODE_VALUES: readonly string[] = Object.values(PLAN_LIMIT_ERROR_CODES);

export function isPlanLimitErrorCode(code: string): boolean {
  return PLAN_LIMIT_ERROR_CODE_VALUES.includes(code);
}

interface ValidateDiaryEntryPlanLimitsInput {
  readonly isPro: boolean;
  readonly existingEntries: readonly DiaryEntry[];
  readonly nextEntry: DiaryEntry;
  readonly previousEntry: DiaryEntry | null;
  readonly deviceDateKey: string;
  readonly dailyUsage: DailyPlanUsage;
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextLocalPlanResetDate(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

function countEntriesCreatedOnDeviceDate(entries: readonly DiaryEntry[], deviceDateKey: string): number {
  return entries.filter((entry) => getLocalDateKey(new Date(entry.createdAt)) === deviceDateKey).length;
}

export function countAddedStickers(nextEntry: DiaryEntry, previousEntry: DiaryEntry | null): number {
  if (!previousEntry) {
    return nextEntry.stickers.length;
  }

  const previousStickerIds = new Set(previousEntry.stickers.map((sticker) => sticker.id));
  return nextEntry.stickers.filter((sticker) => !previousStickerIds.has(sticker.id)).length;
}

function buildLimitError(
  code: string,
  message: string,
  limit: number,
  used: number,
  requested: number,
  date: string
): ArchitectureError {
  return {
    code,
    message,
    details: {
      limit,
      used,
      requested,
      date,
    },
  };
}

export function validateDiaryEntryPlanLimits({
  isPro,
  existingEntries,
  nextEntry,
  previousEntry,
  deviceDateKey,
  dailyUsage,
}: ValidateDiaryEntryPlanLimitsInput): Result<void> {
  if (isPro) {
    return success(undefined);
  }

  const createdToday = countEntriesCreatedOnDeviceDate(existingEntries, deviceDateKey);

  if (!previousEntry && createdToday >= FREE_PLAN_LIMITS.entriesPerDay) {
    return failure(
      buildLimitError(
        PLAN_LIMIT_ERROR_CODES.entriesPerDay,
        `Free users can create up to ${FREE_PLAN_LIMITS.entriesPerDay} entries per day.`,
        FREE_PLAN_LIMITS.entriesPerDay,
        createdToday,
        1,
        deviceDateKey
      )
    );
  }

  const addedStickerCount = countAddedStickers(nextEntry, previousEntry);

  if (dailyUsage.stickersUsed + addedStickerCount > FREE_PLAN_LIMITS.stickersPerDay) {
    return failure(
      buildLimitError(
        PLAN_LIMIT_ERROR_CODES.stickersPerDay,
        `Free users can use up to ${FREE_PLAN_LIMITS.stickersPerDay} stickers per day.`,
        FREE_PLAN_LIMITS.stickersPerDay,
        dailyUsage.stickersUsed,
        addedStickerCount,
        deviceDateKey
      )
    );
  }

  return success(undefined);
}
