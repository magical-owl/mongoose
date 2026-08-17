import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import { generateUUID } from '@/shared/utils/uuid';
import { DiaryEntry, DiaryReflection } from '../domain/DiaryEntry';
import { IDiaryRepository } from '../repositories/IDiaryRepository';
import { diaryRepository } from '../repositories/DiaryRepository';

export class DiaryService {
  constructor(private repo: IDiaryRepository = diaryRepository) {}

  public async getEntries(): Promise<Result<DiaryEntry[]>> {
    return await this.repo.getAll();
  }

  public async getEntryById(id: string): Promise<Result<DiaryEntry | null>> {
    return await this.repo.getById(id);
  }

  public async saveEntry(entry: DiaryEntry): Promise<Result<DiaryEntry>> {
    return await this.repo.save(entry);
  }

  public async deleteEntry(id: string): Promise<Result<boolean>> {
    return await this.repo.delete(id);
  }

  public async addReflection(entryId: string, text: string): Promise<Result<DiaryEntry>> {
    const trimmed = text.trim();
    if (!trimmed) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Reflection cannot be empty',
      });
    }

    const entryResult = await this.repo.getById(entryId);
    if (!entryResult.success) return entryResult;
    if (!entryResult.data) {
      return failure({
        code: 'NOT_FOUND',
        message: 'Diary entry not found',
      });
    }

    const now = new Date().toISOString();
    const reflection: DiaryReflection = {
      id: generateUUID(),
      text: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    const updated: DiaryEntry = {
      ...entryResult.data,
      reflections: [...entryResult.data.reflections, reflection],
      updatedAt: now,
    };
    return await this.repo.save(updated);
  }

  public async deleteReflection(entryId: string, reflectionId: string): Promise<Result<DiaryEntry>> {
    const entryResult = await this.repo.getById(entryId);
    if (!entryResult.success) return entryResult;
    if (!entryResult.data) {
      return failure({
        code: 'NOT_FOUND',
        message: 'Diary entry not found',
      });
    }

    const nextReflections = entryResult.data.reflections.filter((reflection) => reflection.id !== reflectionId);
    if (nextReflections.length === entryResult.data.reflections.length) {
      return success(entryResult.data);
    }

    const updated: DiaryEntry = {
      ...entryResult.data,
      reflections: nextReflections,
      updatedAt: new Date().toISOString(),
    };
    return await this.repo.save(updated);
  }

  /**
   * Calculates writing streaks.
   */
  public calculateStreak(entries: DiaryEntry[]): { currentStreak: number; longestStreak: number } {
    if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
    let currentStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let checkIndex = 0;
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      checkIndex = 1;
    }

    for (let i = checkIndex; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]!);
      const currDate = new Date(uniqueDates[i]!);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { currentStreak, longestStreak: Math.max(currentStreak, uniqueDates.length) };
  }
}

export const diaryService = new DiaryService();
