import { MmkvDatabaseService } from '@/database/DatabaseService';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { LocalDataService } from '../LocalDataService';
import { logger } from '../LoggingService';

describe('LocalDataService', () => {
  it('clears all application-managed records and registered secure keys', async () => {
    logger.configure({ enableConsole: false });
    const database = new MmkvDatabaseService(`local-data-test-${Date.now()}-${Math.random()}`);
    database.clearAll();
    database.create('profiles', { displayName: 'Meadow' });
    database.create('offline_queue', { operationType: 'create' });
    const removedKeys: string[] = [];
    const secureStorage: ISecureStorageDataSource = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: async (key) => {
        removedKeys.push(key);
      },
    };
    const service = new LocalDataService(database, secureStorage);

    await service.clearManagedData();

    expect(database.getAll('profiles')).toEqual([]);
    expect(removedKeys).toEqual([
      secureStorageKeys.currentProfile,
      secureStorageKeys.diaryEntries,
      secureStorageKeys.diaryDraft,
      secureStorageKeys.backupEncryptionKey,
      secureStorageKeys.journalExtras,
    ]);
  });
});
