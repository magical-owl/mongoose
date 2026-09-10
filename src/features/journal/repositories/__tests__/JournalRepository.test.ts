import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { buildJournal } from '@tests/fixtures/domain';
import { JournalRepository } from '../JournalRepository';

class MockSecureStorage implements ISecureStorageDataSource {
  private store = new Map<string, string>();
  public failReads = false;
  public setItemCalls = 0;

  public async getItem(key: string): Promise<string | null> {
    if (this.failReads) {
      throw new Error('Secure storage is unavailable');
    }
    return this.store.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.setItemCalls += 1;
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('JournalRepository', () => {
  it('persists journals across repository instances', async () => {
    const storage = new MockSecureStorage();
    const repository = new JournalRepository(storage);
    const journal = buildJournal({ id: '11111111-1111-4111-8111-111111111111', title: 'Everyday Notes' });

    const saveResult = await repository.save(journal);
    expect(saveResult.success).toBe(true);

    const freshRepository = new JournalRepository(storage);
    const getAllResult = await freshRepository.getAll();

    expect(getAllResult.success).toBe(true);
    if (getAllResult.success) {
      expect(getAllResult.data).toHaveLength(1);
      expect(getAllResult.data[0]?.id).toBe(journal.id);
    }
  });

  it('does not overwrite stored journals when secure storage cannot be read', async () => {
    const storage = new MockSecureStorage();
    const repository = new JournalRepository(storage);
    const journal = buildJournal({ id: '11111111-1111-4111-8111-111111111111', title: 'Everyday Notes' });
    const saveResult = await repository.save(journal);
    expect(saveResult.success).toBe(true);
    const successfulWriteCount = storage.setItemCalls;

    const freshRepository = new JournalRepository(storage);
    storage.failReads = true;

    const failedSaveResult = await freshRepository.save(buildJournal({
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Should not save',
    }));

    expect(failedSaveResult.success).toBe(false);
    if (!failedSaveResult.success) {
      expect(failedSaveResult.error.code).toBe('JOURNAL_WRITE_FAILED');
    }
    expect(storage.setItemCalls).toBe(successfulWriteCount);

    storage.failReads = false;
    const restoredRepository = new JournalRepository(storage);
    const getAllResult = await restoredRepository.getAll();

    expect(getAllResult.success).toBe(true);
    if (getAllResult.success) {
      expect(getAllResult.data).toHaveLength(1);
      expect(getAllResult.data[0]?.id).toBe(journal.id);
    }
  });
});
