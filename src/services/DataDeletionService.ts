import { localDataService } from './LocalDataService';
import { useAppStore } from '@/stores/useAppStore';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';

export class DataDeletionService {
  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  public async deleteAll(): Promise<void> {
    await localDataService.clearManagedData();
    await Promise.all(managedSecureStorageKeys.map((key) => this.storage.removeItem(key)));
    useSubscriptionStore.getState().reset();
    useAppStore.getState().reset();
  }
}

export const dataDeletionService = new DataDeletionService();
