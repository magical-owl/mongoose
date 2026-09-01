import { secureStorageKeys } from '@/constants/secureStorageKeys';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { DiaryDraftService, type DiaryDraft } from '@/features/diary/services/DiaryDraftService';

class MemorySecureStorage implements ISecureStorageDataSource {
  private readonly values = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

function createDraft(content: string): DiaryDraft {
  return {
    title: '',
    content,
    date: '2026-08-29',
    companion: 'cat',
    stickers: [],
    paperBackgroundId: 'vintage-parchment',
    photos: [],
    tags: [],
    manualMoodWeather: 'neutral',
    manualMood: 'neutral',
    manualMoods: ['neutral'],
    writingMode: 'free-write',
    sensory: {
      locationLabel: '',
      sounds: '',
      smells: '',
      energyLevel: 5,
      bodyState: '',
    },
    isLockbox: false,
    savedAt: '2026-08-29T00:00:00.000Z',
  };
}

describe('DiaryDraftService', () => {
  it('normalizes rich editor empty markup when loading a draft', async () => {
    const storage = new MemorySecureStorage();
    const service = new DiaryDraftService(storage);

    await storage.setItem(
      secureStorageKeys.diaryDraft,
      JSON.stringify(createDraft('<p><br></p>')),
    );

    await expect(service.get()).resolves.toMatchObject({ content: '' });
  });

  it('normalizes rich editor empty markup before saving a draft', async () => {
    const storage = new MemorySecureStorage();
    const service = new DiaryDraftService(storage);

    await service.save(createDraft('<p>&nbsp;</p>'));
    const raw = await storage.getItem(secureStorageKeys.diaryDraft);

    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? '{}') as Pick<DiaryDraft, 'content'>;
    expect(parsed.content).toBe('');
  });
});
