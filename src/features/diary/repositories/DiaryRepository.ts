import { z } from 'zod';
import { success, failure } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';
import { IDiaryRepository } from './IDiaryRepository';
import { DiaryEntry, DiaryEntrySchema } from '../domain/DiaryEntry';

export class DiaryRepository implements IDiaryRepository {
  private memoryStore = new Map<string, DiaryEntry>();

  public async getAll(): Promise<Result<DiaryEntry[]>> {
    try {
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
      const validated = DiaryEntrySchema.parse(entry);
      this.memoryStore.set(validated.id, validated);
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
      const deleted = this.memoryStore.delete(id);
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
