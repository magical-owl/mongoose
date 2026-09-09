import { DiaryEntry, DiaryEntrySchema, getEntryManualMoods, getPrimaryManualMood } from './DiaryEntry';
import { normalizeMemoryReactions } from './MemoryReaction';

export const CURRENT_DIARY_SCHEMA_VERSION = 9;

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
    return [{
      ...result.data,
      viewCount: result.data.viewCount ?? 0,
      viewHistory: result.data.viewHistory,
      manualMood: getPrimaryManualMood(manualMoods),
      manualMoods,
      memoryReactions: normalizeMemoryReactions(result.data.memoryReactions),
      reflections: result.data.reflections.map((reflection) => ({
        ...reflection,
        memoryReactions: normalizeMemoryReactions(reflection.memoryReactions),
      })),
    }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
