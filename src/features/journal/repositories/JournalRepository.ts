import { z } from 'zod';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { failure, success } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';
import { Journal, JournalSchema } from '../domain/Journal';
import type { IJournalRepository } from './IJournalRepository';

const JournalStorageSchema = z.object({
  version: z.number().default(1),
  journals: z.array(JournalSchema).default([]),
});

export class JournalRepository implements IJournalRepository {
  private memoryStore = new Map<string, Journal>();
  private isLoaded = false;

  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const raw = await this.storage.getItem(secureStorageKeys.journals);
      if (raw) {
        const parsed = JournalStorageSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          this.memoryStore.clear();
          parsed.data.journals.forEach((journal) => this.memoryStore.set(journal.id, journal));
        }
      }
    } catch {
      // Keep the in-memory fallback if secure storage cannot be read.
    } finally {
      this.isLoaded = true;
    }
  }

  private async persist(): Promise<void> {
    await this.storage.setItem(secureStorageKeys.journals, JSON.stringify({
      version: 1,
      journals: Array.from(this.memoryStore.values()),
    }));
  }

  public async getAll(): Promise<Result<Journal[]>> {
    try {
      await this.ensureLoaded();
      return success(Array.from(this.memoryStore.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (error) {
      return failure({ code: 'JOURNALS_READ_FAILED', message: error instanceof Error ? error.message : 'Unable to load journals' });
    }
  }

  public async getById(id: string): Promise<Result<Journal | null>> {
    try {
      await this.ensureLoaded();
      return success(this.memoryStore.get(id) ?? null);
    } catch (error) {
      return failure({ code: 'JOURNAL_READ_FAILED', message: error instanceof Error ? error.message : 'Unable to load journal' });
    }
  }

  public async save(journal: Journal): Promise<Result<Journal>> {
    const parsed = JournalSchema.safeParse(journal);
    if (!parsed.success) return failure({ code: 'JOURNAL_INVALID', message: parsed.error.issues.map((issue) => issue.message).join(', ') });
    try {
      await this.ensureLoaded();
      this.memoryStore.set(parsed.data.id, parsed.data);
      await this.persist();
      return success(parsed.data);
    } catch (error) {
      return failure({ code: 'JOURNAL_WRITE_FAILED', message: error instanceof Error ? error.message : 'Unable to save journal' });
    }
  }

  public async delete(id: string): Promise<Result<boolean>> {
    try {
      await this.ensureLoaded();
      const deleted = this.memoryStore.delete(id);
      if (deleted) await this.persist();
      return success(deleted);
    } catch (error) {
      return failure({ code: 'JOURNAL_DELETE_FAILED', message: error instanceof Error ? error.message : 'Unable to delete journal' });
    }
  }

  public async clearAll(): Promise<Result<boolean>> {
    try {
      this.memoryStore.clear();
      this.isLoaded = true;
      await this.storage.removeItem(secureStorageKeys.journals);
      return success(true);
    } catch (error) {
      return failure({ code: 'JOURNALS_CLEAR_FAILED', message: error instanceof Error ? error.message : 'Unable to clear journals' });
    }
  }
}

export const journalRepository = new JournalRepository();
