import { DiaryService } from '../DiaryService';
import { DiaryRepository } from '../../repositories/DiaryRepository';
import { DiaryEntry } from '../../domain/DiaryEntry';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { PlanUsageRepository } from '@/features/subscription/repositories/PlanUsageRepository';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { getLocalDateKey } from '@/features/subscription/services/PlanLimitService';
import type { IDiaryPhotoCleanupService } from '../DiaryPhotoService';

class MemorySecureStorage implements ISecureStorageDataSource {
  private readonly items = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.items.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.items.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.items.delete(key);
  }
}

class MockDiaryPhotoCleanupService implements IDiaryPhotoCleanupService {
  public readonly deletedEntryIds: string[] = [];

  public async deleteEntryPhotos(entry: DiaryEntry): Promise<void> {
    this.deletedEntryIds.push(entry.id);
  }

  public async clearImportedPhotos(): Promise<void> {}
}

describe('DiaryService', () => {
  let service: DiaryService;
  let repo: DiaryRepository;
  let planUsageRepo: PlanUsageRepository;
  let photoCleanup: MockDiaryPhotoCleanupService;

  const dateOffset = (days: number): string => {
    return new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;
  };

  const mockEntry: DiaryEntry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Sunny Morning',
    content: 'Had a wonderful and happy day outdoors!',
    date: dateOffset(0),
    paperBackgroundId: 'vintage-parchment',
    stickers: [],
    companion: 'cat',
    isFavorite: true,
    tags: ['sunny'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    manualMoodWeather: 'calm',
    manualMoods: [],
    writingMode: 'free-write',
    sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
    isLockbox: false,
    collectionIds: [],
    journalIds: [],
    photos: [],
    reflections: [],
  };

  const entryForDate = (id: string, date: string, stickers = 0): DiaryEntry => ({
    ...mockEntry,
    id,
    date,
    stickers: Array.from({ length: stickers }, (_, index) => ({
      id: `123e4567-e89b-12d3-a456-4266141741${String(index).padStart(2, '0')}`,
      stickerId: `sticker-${index}`,
      category: 'everyday',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      zIndex: index + 1,
      behindText: false,
    })),
  });

  beforeEach(async () => {
    useSubscriptionStore.getState().reset();
    const storage = new MemorySecureStorage();
    repo = new DiaryRepository(storage);
    planUsageRepo = new PlanUsageRepository(storage);
    photoCleanup = new MockDiaryPhotoCleanupService();
    await repo.clearAll();
    await planUsageRepo.clearAll();
    service = new DiaryService(repo, planUsageRepo, photoCleanup);
  });

  it('should save an entry without generating automated mood data', async () => {
    const result = await service.saveEntry(mockEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.manualMood).toBeUndefined();
    }
  });

  it('should calculate streak accurately', () => {
    const entries: DiaryEntry[] = [
      { ...mockEntry, id: '1', date: dateOffset(0) },
      { ...mockEntry, id: '2', date: dateOffset(1) },
      { ...mockEntry, id: '3', date: dateOffset(2) },
    ];
    const streak = service.calculateStreak(entries);
    expect(streak.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('should add and delete reflections on an entry', async () => {
    await service.saveEntry(mockEntry);

    const addResult = await service.addReflection(mockEntry.id, 'I understand this differently now.');
    expect(addResult.success).toBe(true);
    if (!addResult.success) return;
    expect(addResult.data.reflections).toHaveLength(1);
    expect(addResult.data.reflections[0]?.text).toBe('I understand this differently now.');

    const reflectionId = addResult.data.reflections[0]?.id;
    expect(reflectionId).toBeDefined();
    if (!reflectionId) return;

    const deleteResult = await service.deleteReflection(mockEntry.id, reflectionId);
    expect(deleteResult.success).toBe(true);
    if (deleteResult.success) {
      expect(deleteResult.data.reflections).toHaveLength(0);
    }
  });

  it('should soft-delete, restore, and permanently delete entries through the recovery flow', async () => {
    await service.saveEntry(mockEntry);

    const softDeleteResult = await service.deleteEntry(mockEntry.id);
    const activeAfterDeleteResult = await service.getEntries();
    const deletedAfterDeleteResult = await service.getDeletedEntries();

    expect(softDeleteResult.success).toBe(true);
    expect(activeAfterDeleteResult.success).toBe(true);
    expect(deletedAfterDeleteResult.success).toBe(true);
    if (activeAfterDeleteResult.success) expect(activeAfterDeleteResult.data).toHaveLength(0);
    if (deletedAfterDeleteResult.success) {
      expect(deletedAfterDeleteResult.data).toHaveLength(1);
      expect(deletedAfterDeleteResult.data[0]?.deletedAt).toBeDefined();
    }

    const restoreResult = await service.restoreDeletedEntry(mockEntry.id);
    const activeAfterRestoreResult = await service.getEntries();
    const deletedAfterRestoreResult = await service.getDeletedEntries();

    expect(restoreResult.success).toBe(true);
    if (restoreResult.success) expect(restoreResult.data?.deletedAt).toBeUndefined();
    expect(activeAfterRestoreResult.success).toBe(true);
    expect(deletedAfterRestoreResult.success).toBe(true);
    if (activeAfterRestoreResult.success) expect(activeAfterRestoreResult.data).toHaveLength(1);
    if (deletedAfterRestoreResult.success) expect(deletedAfterRestoreResult.data).toHaveLength(0);

    await service.deleteEntry(mockEntry.id);
    const permanentDeleteResult = await service.permanentlyDeleteEntry(mockEntry.id);
    const deletedAfterPermanentDeleteResult = await service.getDeletedEntries();

    expect(permanentDeleteResult.success).toBe(true);
    expect(deletedAfterPermanentDeleteResult.success).toBe(true);
    if (deletedAfterPermanentDeleteResult.success) expect(deletedAfterPermanentDeleteResult.data).toHaveLength(0);
  });

  it('should remove imported photo files only when an entry is permanently deleted', async () => {
    const entryWithPhotoSticker: DiaryEntry = {
      ...mockEntry,
      stickers: [
        {
          id: '123e4567-e89b-12d3-a456-426614174701',
          stickerId: 'photo:123e4567-e89b-12d3-a456-426614174701',
          category: 'photos',
          imageUri: 'file:///document/diary-photos/123e4567-e89b-12d3-a456-426614174701.jpg',
          imageWidth: 120,
          imageHeight: 120,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          zIndex: 1,
          behindText: false,
        },
      ],
    };
    await service.saveEntry(entryWithPhotoSticker);

    const softDeleteResult = await service.deleteEntry(entryWithPhotoSticker.id);
    expect(softDeleteResult.success).toBe(true);
    expect(photoCleanup.deletedEntryIds).toEqual([]);

    const permanentDeleteResult = await service.permanentlyDeleteEntry(entryWithPhotoSticker.id);
    expect(permanentDeleteResult.success).toBe(true);
    expect(photoCleanup.deletedEntryIds).toEqual([entryWithPhotoSticker.id]);
  });

  it('should limit free users to three entries per device day', async () => {
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174101', dateOffset(0)));
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174102', dateOffset(1)));
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174103', dateOffset(2)));

    const result = await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174104', dateOffset(3)));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FREE_ENTRY_DAILY_LIMIT_REACHED');
    }
  });

  it('should limit free users to nine sticker additions per device day', async () => {
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174201', dateOffset(0), 5));
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174202', dateOffset(1), 4));

    const result = await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174203', dateOffset(2), 1));
    const usageResult = await planUsageRepo.getDailyUsage(getLocalDateKey(new Date()));

    expect(result.success).toBe(false);
    expect(usageResult.success).toBe(true);
    if (usageResult.success) {
      expect(usageResult.data.stickerLimitExhaustedAt).toBeDefined();
    }
    if (!result.success) {
      expect(result.error.code).toBe('FREE_STICKER_DAILY_LIMIT_REACHED');
    }
  });

  it('should count stickers added while editing toward the device day limit', async () => {
    const entry = entryForDate('123e4567-e89b-12d3-a456-426614174401', dateOffset(5), 9);
    await service.saveEntry(entry);

    const result = await service.saveEntry({
      ...entry,
      stickers: [
        ...entry.stickers,
        {
          id: '123e4567-e89b-12d3-a456-426614174499',
          stickerId: 'extra-sticker',
          category: 'everyday',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          zIndex: 9,
          behindText: false,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FREE_STICKER_DAILY_LIMIT_REACHED');
    }
  });

  it('should allow pro users to exceed free daily limits', async () => {
    const date = dateOffset(0);
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174301', date, 3));
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174302', date));
    await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174303', date));

    const result = await service.saveEntry(entryForDate('123e4567-e89b-12d3-a456-426614174304', date, 2), {
      isPro: true,
    });

    expect(result.success).toBe(true);
  });

  it('should restore imported entries without consuming free daily limits', async () => {
    const importedEntries = [
      entryForDate('123e4567-e89b-12d3-a456-426614174501', dateOffset(0), 5),
      entryForDate('123e4567-e89b-12d3-a456-426614174502', dateOffset(1), 5),
      entryForDate('123e4567-e89b-12d3-a456-426614174503', dateOffset(2), 5),
      entryForDate('123e4567-e89b-12d3-a456-426614174504', dateOffset(3), 5),
    ];

    const result = await service.restoreEntries(importedEntries);
    const entriesResult = await repo.getAll();
    const usageResult = await planUsageRepo.getDailyUsage(getLocalDateKey(new Date()));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(importedEntries.length);
    }
    expect(entriesResult.success).toBe(true);
    if (entriesResult.success) {
      expect(entriesResult.data).toHaveLength(importedEntries.length);
    }
    expect(usageResult.success).toBe(true);
    if (usageResult.success) {
      expect(usageResult.data.stickersUsed).toBe(0);
      expect(usageResult.data.stickerLimitExhaustedAt).toBeUndefined();
    }
  });
});
