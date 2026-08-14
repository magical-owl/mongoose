import { z } from 'zod';
import { success, failure } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';
import {
  secureStorage,
  type ISecureStorageDataSource,
} from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { IDiaryRepository } from './IDiaryRepository';
import { DiaryEntry, DiaryEntrySchema } from '../domain/DiaryEntry';

export class DiaryRepository implements IDiaryRepository {
  private memoryStore = new Map<string, DiaryEntry>();
  private isLoaded = false;

  public constructor(
    private readonly storage: ISecureStorageDataSource = secureStorage
  ) {}

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const raw = await this.storage.getItem(secureStorageKeys.diaryEntries);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memoryStore.clear();
          for (const item of parsed) {
            const validated = DiaryEntrySchema.safeParse(item);
            if (validated.success) {
              this.memoryStore.set(validated.data.id, validated.data);
            }
          }
        }
      }
    } catch {
      // If encrypted storage read fails, fallback gracefully to current in-memory store
    } finally {
      this.isLoaded = true;
    }
  }

  private async persist(): Promise<void> {
    const list = Array.from(this.memoryStore.values());
    await this.storage.setItem(secureStorageKeys.diaryEntries, JSON.stringify(list));
  }

  public async getAll(): Promise<Result<DiaryEntry[]>> {
    try {
      await this.ensureLoaded();
      const entries = Array.from(this.memoryStore.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return success(entries);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve entries',
      });
    }
  }

  public async getById(id: string): Promise<Result<DiaryEntry | null>> {
    try {
      await this.ensureLoaded();
      const entry = this.memoryStore.get(id) || null;
      return success(entry);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve entry',
      });
    }
  }

  public async getByDate(date: string): Promise<Result<DiaryEntry[]>> {
    try {
      await this.ensureLoaded();
      const entries = Array.from(this.memoryStore.values()).filter(
        (entry) => entry.date === date
      );
      return success(entries);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve entries by date',
      });
    }
  }

  public async save(entry: DiaryEntry): Promise<Result<DiaryEntry>> {
    try {
      await this.ensureLoaded();
      const validated = DiaryEntrySchema.parse(entry);
      this.memoryStore.set(validated.id, validated);
      await this.persist();
      return success(validated);
    } catch (error) {
      let message = 'Failed to save entry';
      if (error instanceof z.ZodError) {
        message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      } else if (error instanceof Error) {
        message = error.message;
      }
      return failure({
        code: 'VALIDATION_ERROR',
        message,
      });
    }
  }

  public async delete(id: string): Promise<Result<boolean>> {
    try {
      await this.ensureLoaded();
      const deleted = this.memoryStore.delete(id);
      if (deleted) {
        await this.persist();
      }
      return success(deleted);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete entry',
      });
    }
  }

  public async clearAll(): Promise<Result<boolean>> {
    try {
      this.memoryStore.clear();
      await this.storage.removeItem(secureStorageKeys.diaryEntries);
      this.isLoaded = true;
      return success(true);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to clear database',
      });
    }
  }
}

export const diaryRepository = new DiaryRepository();
