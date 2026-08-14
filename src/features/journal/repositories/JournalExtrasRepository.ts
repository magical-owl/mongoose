import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { EMPTY_JOURNAL_EXTRAS, JournalExtras, JournalExtrasSchema } from '../domain/JournalExtras';
import { failure, success } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';

export class JournalExtrasRepository {
  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  public async get(): Promise<Result<JournalExtras>> {
    try {
      const raw = await this.storage.getItem(secureStorageKeys.journalExtras);
      if (!raw) return success(EMPTY_JOURNAL_EXTRAS);
      const parsed = JournalExtrasSchema.safeParse(JSON.parse(raw));
      return parsed.success ? success(parsed.data) : success(EMPTY_JOURNAL_EXTRAS);
    } catch (error) {
      return failure({ code: 'JOURNAL_EXTRAS_READ_FAILED', message: error instanceof Error ? error.message : 'Unable to load archive data' });
    }
  }

  public async save(state: JournalExtras): Promise<Result<JournalExtras>> {
    const parsed = JournalExtrasSchema.safeParse(state);
    if (!parsed.success) return failure({ code: 'JOURNAL_EXTRAS_INVALID', message: 'Archive data is invalid.' });
    try {
      await this.storage.setItem(secureStorageKeys.journalExtras, JSON.stringify(parsed.data));
      return success(parsed.data);
    } catch (error) {
      return failure({ code: 'JOURNAL_EXTRAS_WRITE_FAILED', message: error instanceof Error ? error.message : 'Unable to save archive data' });
    }
  }

  public async clear(): Promise<void> { await this.storage.removeItem(secureStorageKeys.journalExtras); }
}

export const journalExtrasRepository = new JournalExtrasRepository();
