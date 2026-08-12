/**
 * Local Data Service
 *
 * Owns deletion of application-managed non-sensitive local data. Secure-store
 * credentials are intentionally not handled here: authentication must register
 * its own credential revocation and deletion flow when it is introduced.
 */

import { database, type IDatabaseService } from '@/database/DatabaseService';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { managedSecureStorageKeys } from '@/constants/secureStorageKeys';
import { logger } from './LoggingService';

const TAG = 'LocalDataService';

export class LocalDataService {
  public constructor(
    private readonly databaseService: IDatabaseService = database,
    private readonly secureStorageDataSource: ISecureStorageDataSource = secureStorage
  ) {}

  /** Remove all app-managed records, including offline operations and secrets. */
  public async clearManagedData(): Promise<void> {
    this.databaseService.clearAll();
    await Promise.all(
      managedSecureStorageKeys.map((key) => this.secureStorageDataSource.removeItem(key))
    );
    logger.info(TAG, 'Application-managed local data cleared');
  }
}

export const localDataService = new LocalDataService();
