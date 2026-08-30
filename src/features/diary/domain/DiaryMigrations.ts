import { DiaryEntry, DiaryEntrySchema, getEntryManualMoods, getPrimaryManualMood } from './DiaryEntry';

export const CURRENT_DIARY_SCHEMA_VERSION = 5;

export interface DiaryStorageEnvelope {
  readonly version: number;
  readonly entries: DiaryEntry[];
}

export function migrateDiaryStorage(raw: unknown): DiaryStorageEnvelope {
  if (Array.isArray(raw)) {
    return {
      version: CURRENT_DIARY_SCHEMA_VERSION,
      entries: parseEntries(raw),
    };
  }

  if (isRecord(raw) && Array.isArray(raw.entries)) {
    return {
      version: CURRENT_DIARY_SCHEMA_VERSION,
      entries: parseEntries(raw.entries),
    };
  }

  return { version: CURRENT_DIARY_SCHEMA_VERSION, entries: [] };
}

function parseEntries(items: unknown[]): DiaryEntry[] {
  return items.flatMap((item) => {
    const result = DiaryEntrySchema.safeParse(item);
    if (!result.success) return [];
    const manualMoods = getEntryManualMoods(result.data);
    return [{ ...result.data, manualMood: getPrimaryManualMood(manualMoods), manualMoods }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
