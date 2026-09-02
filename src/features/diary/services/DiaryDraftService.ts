import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { normalizeHtmlContent } from '@/shared/utils/html';
import type { CompanionType } from '../domain/Companion';
import type { PlacedSticker } from '../domain/Sticker';
import { getPrimaryManualMood, normalizeManualMoods, type DiaryPhoto, type ManualMood, type ManualMoodWeather, type SensoryDetails, type WritingMode } from '../domain/DiaryEntry';
import { normalizeDiaryBodyFontFamily, normalizeDiaryBodyTextColor, type DiaryBodyFontFamily, type DiaryBodyTextColor } from '../domain/DiaryBodyStyle';

export interface DiaryDraft {
  readonly title: string;
  readonly content: string;
  readonly date: string;
  readonly companion: CompanionType;
  readonly stickers: PlacedSticker[];
  readonly coverPhoto?: DiaryPhoto;
  readonly paperBackgroundId: string;
  readonly bodyFontFamily: DiaryBodyFontFamily;
  readonly bodyTextColor?: DiaryBodyTextColor;
  readonly photos: DiaryPhoto[];
  readonly tags: string[];
  readonly manualMoodWeather: ManualMoodWeather;
  readonly manualMood?: ManualMood;
  readonly manualMoods?: readonly ManualMood[];
  readonly writingMode: WritingMode;
  readonly sensory: SensoryDetails;
  readonly isLockbox: boolean;
  readonly timeCapsuleUnlockAt?: string;
  readonly expiresAt?: string;
  readonly savedAt: string;
}

export class DiaryDraftService {
  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  public async get(): Promise<DiaryDraft | null> {
    const raw = await this.storage.getItem(secureStorageKeys.diaryDraft);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isDraft(parsed)) return null;
      const legacyDraft = parsed as Partial<DiaryDraft>;
      const manualMoods = normalizeManualMoods(legacyDraft.manualMoods, legacyDraft.manualMood ?? 'neutral');
      return {
        photos: [],
        paperBackgroundId: 'vintage-parchment',
        tags: [],
        manualMoodWeather: 'neutral',
        writingMode: 'free-write',
        sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
        isLockbox: false,
        ...legacyDraft,
        manualMood: getPrimaryManualMood(manualMoods),
        manualMoods,
        content: normalizeHtmlContent(legacyDraft.content ?? ''),
        bodyFontFamily: normalizeDiaryBodyFontFamily(legacyDraft.bodyFontFamily),
        bodyTextColor: normalizeDiaryBodyTextColor(legacyDraft.bodyTextColor),
      } as DiaryDraft;
    } catch {
      return null;
    }
  }

  public async save(draft: Omit<DiaryDraft, 'savedAt'>): Promise<void> {
    await this.storage.setItem(
      secureStorageKeys.diaryDraft,
      JSON.stringify({ ...draft, content: normalizeHtmlContent(draft.content), savedAt: new Date().toISOString() })
    );
  }

  public async clear(): Promise<void> {
    await this.storage.removeItem(secureStorageKeys.diaryDraft);
  }
}

function isDraft(value: unknown): value is DiaryDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.title === 'string'
    && typeof draft.content === 'string'
    && typeof draft.date === 'string'
    && typeof draft.companion === 'string'
    && Array.isArray(draft.stickers)
    && typeof draft.savedAt === 'string';
}

export const diaryDraftService = new DiaryDraftService();
