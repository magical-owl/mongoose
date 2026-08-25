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
import { CURRENT_DIARY_SCHEMA_VERSION, migrateDiaryStorage, type DiaryStorageEnvelope } from '../domain/DiaryMigrations';

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
        if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
          const migrated = migrateDiaryStorage(parsed);
          this.memoryStore.clear();
          for (const entry of migrated.entries) {
            this.memoryStore.set(entry.id, entry);
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
    const envelope: DiaryStorageEnvelope = {
      version: CURRENT_DIARY_SCHEMA_VERSION,
      entries: Array.from(this.memoryStore.values()),
    };
    await this.storage.setItem(secureStorageKeys.diaryEntries, JSON.stringify(envelope));
  }

  private removeExpiredEntries(): string[] {
    const now = Date.now();
    const expiredIds = Array.from(this.memoryStore.values())
      .filter((entry) => entry.expiresAt && new Date(entry.expiresAt).getTime() <= now)
      .map((entry) => entry.id);
    expiredIds.forEach((id) => this.memoryStore.delete(id));
    return expiredIds;
  }

  private sortEntriesByDateDesc(entries: DiaryEntry[]): DiaryEntry[] {
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async getAll(): Promise<Result<DiaryEntry[]>> {
    try {
      await this.ensureLoaded();
      if (this.removeExpiredEntries().length > 0) await this.persist();
      const entries = this.sortEntriesByDateDesc(Array.from(this.memoryStore.values()).filter((entry) => !entry.deletedAt));
      return success(entries);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve entries',
      });
    }
  }

  public async getDeleted(): Promise<Result<DiaryEntry[]>> {
    try {
      await this.ensureLoaded();
      if (this.removeExpiredEntries().length > 0) await this.persist();
      const entries = Array.from(this.memoryStore.values())
        .filter((entry) => Boolean(entry.deletedAt))
        .sort((a, b) => new Date(b.deletedAt ?? b.updatedAt).getTime() - new Date(a.deletedAt ?? a.updatedAt).getTime());
      return success(entries);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve deleted entries',
      });
    }
  }

  public async getById(id: string): Promise<Result<DiaryEntry | null>> {
    try {
      await this.ensureLoaded();
      const entry = this.memoryStore.get(id) || null;
      if (entry?.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) {
        this.memoryStore.delete(id);
        await this.persist();
        return success(null);
      }
      return success(entry?.deletedAt ? null : entry);
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
        (entry) => entry.date === date && !entry.deletedAt && (!entry.expiresAt || new Date(entry.expiresAt).getTime() > Date.now())
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

  public async softDelete(id: string): Promise<Result<boolean>> {
    try {
      await this.ensureLoaded();
      const entry = this.memoryStore.get(id);
      if (!entry) return success(false);
      if (entry.deletedAt) return success(true);
      const now = new Date().toISOString();
      const deleted: DiaryEntry = { ...entry, deletedAt: now, updatedAt: now };
      this.memoryStore.set(id, DiaryEntrySchema.parse(deleted));
      await this.persist();
      return success(true);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to move entry to recovery bin',
      });
    }
  }

  public async restore(id: string): Promise<Result<DiaryEntry | null>> {
    try {
      await this.ensureLoaded();
      const entry = this.memoryStore.get(id);
      if (!entry) return success(null);
      const restored = DiaryEntrySchema.parse({ ...entry, deletedAt: undefined, updatedAt: new Date().toISOString() });
      this.memoryStore.set(id, restored);
      await this.persist();
      return success(restored);
    } catch (error) {
      return failure({
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to restore entry',
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
