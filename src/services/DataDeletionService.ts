import { localDataService } from './LocalDataService';
import { useAppStore } from '@/stores/useAppStore';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';
import { clearCachedDiaryEntries } from '@/features/diary/services/DiaryEntryCache';
import { diaryPhotoService, type IDiaryPhotoCleanupService } from '@/features/diary/services/DiaryPhotoService';
import { clearCachedJournals } from '@/features/journal/services/JournalCache';

interface IManagedLocalDataService {
  clearManagedData(): Promise<void>;
}

export class DataDeletionService {
  public constructor(
    private readonly managedLocalData: IManagedLocalDataService = localDataService,
    private readonly storage: ISecureStorageDataSource = secureStorage,
    private readonly photoCleanup: IDiaryPhotoCleanupService = diaryPhotoService
  ) {}

  public async deleteAll(): Promise<void> {
    await this.managedLocalData.clearManagedData();
    await this.photoCleanup.clearImportedPhotos();
    await Promise.all(managedSecureStorageKeys.map((key) => this.storage.removeItem(key)));
    clearCachedDiaryEntries();
    clearCachedJournals();
    useSubscriptionStore.getState().reset();
    useAppStore.getState().reset();
  }
}

export const dataDeletionService = new DataDeletionService();
