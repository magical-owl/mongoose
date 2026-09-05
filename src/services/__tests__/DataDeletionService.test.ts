import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';
import { getCachedDiaryEntries, setCachedDiaryEntries } from '@/features/diary/services/DiaryEntryCache';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { IDiaryPhotoCleanupService } from '@/features/diary/services/DiaryPhotoService';
import { getCachedJournals, setCachedJournals } from '@/features/journal/services/JournalCache';
import type { Journal } from '@/features/journal/domain/Journal';
import { DataDeletionService } from '../DataDeletionService';

describe('DataDeletionService', () => {
  it('clears managed local data, secure storage, photo files, and in-memory caches', async () => {
    const removedKeys: string[] = [];
    const managedLocalData = { clearManagedData: jest.fn().mockResolvedValue(undefined) };
    const storage: ISecureStorageDataSource = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: async (key) => {
        removedKeys.push(key);
      },
    };
    const photoCleanup: IDiaryPhotoCleanupService = {
      deletePhoto: jest.fn().mockResolvedValue(undefined),
      deleteEntryPhotos: jest.fn(),
      deleteReflectionPhoto: jest.fn().mockResolvedValue(undefined),
      clearImportedPhotos: jest.fn().mockResolvedValue(undefined),
    };
    const entry = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Entry',
      content: 'Today',
      date: '2026-08-29',
      paperBackgroundId: 'vintage-parchment',
      bodyFontFamily: 'system',
      stickers: [],
      companion: 'cat',
      isFavorite: false,
      tags: [],
      createdAt: '2026-08-29T00:00:00.000Z',
      updatedAt: '2026-08-29T00:00:00.000Z',
      manualMoodWeather: 'neutral',
      memoryReactions: [],
      manualMoods: ['neutral'],
      writingMode: 'free-write',
      sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
      isLockbox: false,
      collectionIds: [],
      journalIds: [],
      photos: [],
      reflections: [],
    } satisfies DiaryEntry;
    const journal = {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Daily Life',
      description: '',
      color: '#4ECDC4',
      createdAt: '2026-08-29T00:00:00.000Z',
      updatedAt: '2026-08-29T00:00:00.000Z',
    } satisfies Journal;
    setCachedDiaryEntries([entry], []);
    setCachedJournals([journal]);
    const service = new DataDeletionService(managedLocalData, storage, photoCleanup);

    await service.deleteAll();

    expect(managedLocalData.clearManagedData).toHaveBeenCalledTimes(1);
    expect(photoCleanup.clearImportedPhotos).toHaveBeenCalledTimes(1);
    expect(removedKeys).toEqual(managedSecureStorageKeys);
    expect(getCachedDiaryEntries()).toEqual({ entries: null, deletedEntries: null });
    expect(getCachedJournals()).toBeNull();
  });
});
