import { localDataService } from './LocalDataService';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';
import { clearCachedDiaryEntries } from '@/features/diary/services/DiaryEntryCache';
import { diaryPhotoService, type IDiaryPhotoCleanupService } from '@/features/diary/services/DiaryPhotoService';
import { clearCachedJournals } from '@/features/journal/services/JournalCache';
import { profilePhotoService, type IProfilePhotoCleanupService } from '@/features/profile/services/ProfilePhotoService';

interface IManagedLocalDataService {
  clearManagedData(): Promise<void>;
}

export class DataDeletionService {
  public constructor(
    private readonly managedLocalData: IManagedLocalDataService = localDataService,
    private readonly storage: ISecureStorageDataSource = secureStorage,
    private readonly photoCleanup: IDiaryPhotoCleanupService = diaryPhotoService,
    private readonly profilePhotoCleanup: IProfilePhotoCleanupService = profilePhotoService
  ) {}

  public async deleteAll(): Promise<void> {
    await this.managedLocalData.clearManagedData();
    await this.photoCleanup.clearImportedPhotos();
    await this.profilePhotoCleanup.clearImportedProfilePhotos();
    await Promise.all(managedSecureStorageKeys.map((key) => this.storage.removeItem(key)));
    clearCachedDiaryEntries();
    clearCachedJournals();
  }
}

export const dataDeletionService = new DataDeletionService();
