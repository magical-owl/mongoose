import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';
import { getCachedDiaryEntries, setCachedDiaryEntries } from '@/features/diary/services/DiaryEntryCache';
import type { IDiaryPhotoCleanupService } from '@/features/diary/services/DiaryPhotoService';
import { getCachedJournals, setCachedJournals } from '@/features/journal/services/JournalCache';
import type { IProfilePhotoCleanupService } from '@/features/profile/services/ProfilePhotoService';
import { buildDiaryEntry, buildJournal } from '@tests/fixtures/domain';
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
    const profilePhotoCleanup: IProfilePhotoCleanupService = {
      clearImportedProfilePhotos: jest.fn().mockResolvedValue(undefined),
    };
    const entry = buildDiaryEntry({
      title: 'Entry',
      content: 'Today',
      paperBackgroundId: 'vintage-parchment',
    });
    const journal = buildJournal({
      title: 'Daily Life',
    });
    setCachedDiaryEntries([entry], []);
    setCachedJournals([journal]);
    const service = new DataDeletionService(managedLocalData, storage, photoCleanup, profilePhotoCleanup);

    await service.deleteAll();

    expect(managedLocalData.clearManagedData).toHaveBeenCalledTimes(1);
    expect(photoCleanup.clearImportedPhotos).toHaveBeenCalledTimes(1);
    expect(profilePhotoCleanup.clearImportedProfilePhotos).toHaveBeenCalledTimes(1);
    expect(removedKeys).toEqual(managedSecureStorageKeys);
    expect(getCachedDiaryEntries()).toEqual({ entries: null, deletedEntries: null });
    expect(getCachedJournals()).toBeNull();
  });
});
