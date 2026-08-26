import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';
import type { IDiaryPhotoCleanupService } from '@/features/diary/services/DiaryPhotoService';
import { DataDeletionService } from '../DataDeletionService';

describe('DataDeletionService', () => {
  it('clears managed local data, secure storage, photo files, and app stores', async () => {
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
      deleteEntryPhotos: jest.fn(),
      clearImportedPhotos: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DataDeletionService(managedLocalData, storage, photoCleanup);

    await service.deleteAll();

    expect(managedLocalData.clearManagedData).toHaveBeenCalledTimes(1);
    expect(photoCleanup.clearImportedPhotos).toHaveBeenCalledTimes(1);
    expect(removedKeys).toEqual(managedSecureStorageKeys);
  });
});
