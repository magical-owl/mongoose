import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import { generateUUID } from '@/shared/utils/uuid';
import { FREE_PLAN_LIMITS, countAddedStickers, getLocalDateKey, validateDiaryEntryPlanLimits } from '@/features/subscription/services/PlanLimitService';
import { DiaryEntry, DiaryReflection } from '../domain/DiaryEntry';
import { MemoryReaction, toggleMemoryReactionSelection } from '../domain/MemoryReaction';
import { IDiaryRepository } from '../repositories/IDiaryRepository';
import { diaryRepository } from '../repositories/DiaryRepository';
import { IPlanUsageRepository } from '@/features/subscription/repositories/IPlanUsageRepository';
import { planUsageRepository } from '@/features/subscription/repositories/PlanUsageRepository';
import { diaryPhotoService, type IDiaryPhotoCleanupService } from './DiaryPhotoService';

export class DiaryService {
  constructor(
    private repo: IDiaryRepository = diaryRepository,
    private planUsageRepo: IPlanUsageRepository = planUsageRepository,
    private photoCleanup: IDiaryPhotoCleanupService = diaryPhotoService
  ) {}

  public async getEntries(): Promise<Result<DiaryEntry[]>> {
    return await this.repo.getAll();
  }

  public async getDeletedEntries(): Promise<Result<DiaryEntry[]>> {
    return await this.repo.getDeleted();
  }

  public async getEntryById(id: string): Promise<Result<DiaryEntry | null>> {
    return await this.repo.getById(id);
  }

  public async saveEntry(entry: DiaryEntry, options: { readonly isPro?: boolean } = {}): Promise<Result<DiaryEntry>> {
    const isPro = options.isPro ?? false;
    const deviceDateKey = getLocalDateKey(new Date());

    const entriesResult = await this.repo.getAll();
    if (!entriesResult.success) {
      return entriesResult;
    }

    const previousEntryResult = await this.repo.getById(entry.id);
    if (!previousEntryResult.success) {
      return previousEntryResult;
    }

    const dailyUsageResult = await this.planUsageRepo.getDailyUsage(deviceDateKey);
    if (!dailyUsageResult.success) {
      return dailyUsageResult;
    }

    const limitResult = validateDiaryEntryPlanLimits({
      isPro,
      existingEntries: entriesResult.data,
      nextEntry: entry,
      previousEntry: previousEntryResult.data,
      deviceDateKey,
      dailyUsage: dailyUsageResult.data,
    });

    if (!limitResult.success) {
      return limitResult;
    }

    const saveResult = await this.repo.save(entry);
    if (!saveResult.success) {
      return saveResult;
    }

    const addedStickerCount = countAddedStickers(saveResult.data, previousEntryResult.data);
    if (!isPro && addedStickerCount > 0) {
      const usageResult = await this.planUsageRepo.recordStickerUsage(deviceDateKey, addedStickerCount, {
        limit: FREE_PLAN_LIMITS.stickersPerDay,
        occurredAt: saveResult.data.updatedAt,
      });
      if (!usageResult.success) {
        return usageResult;
      }
    }

    return saveResult;
  }

  public async deleteEntry(id: string): Promise<Result<boolean>> {
    return await this.repo.softDelete(id);
  }

  public async restoreDeletedEntry(id: string): Promise<Result<DiaryEntry | null>> {
    return await this.repo.restore(id);
  }

  public async permanentlyDeleteEntry(id: string): Promise<Result<boolean>> {
    const deletedEntriesResult = await this.repo.getDeleted();
    if (!deletedEntriesResult.success) return deletedEntriesResult;

    const entryToDelete = deletedEntriesResult.data.find((entry) => entry.id === id);
    const deleteResult = await this.repo.delete(id);
    if (!deleteResult.success) return deleteResult;

    if (deleteResult.data && entryToDelete) {
      try {
        await this.photoCleanup.deleteEntryPhotos(entryToDelete);
      } catch (error) {
        return failure({
          code: 'PHOTO_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete diary entry photos',
        });
      }
    }

    return deleteResult;
  }

  public async restoreEntries(entries: readonly DiaryEntry[]): Promise<Result<DiaryEntry[]>> {
    const restored: DiaryEntry[] = [];
    for (const entry of entries) {
      const saveResult = await this.repo.save(entry);
      if (!saveResult.success) {
        return saveResult;
      }
      restored.push(saveResult.data);
    }
    return success(restored);
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

  public async toggleMemoryReaction(entryId: string, reaction: MemoryReaction): Promise<Result<DiaryEntry>> {
    const entryResult = await this.repo.getById(entryId);
    if (!entryResult.success) return entryResult;
    if (!entryResult.data) {
      return failure({
        code: 'NOT_FOUND',
        message: 'Diary entry not found',
      });
    }

    const updated: DiaryEntry = {
      ...entryResult.data,
      memoryReactions: toggleMemoryReactionSelection(entryResult.data.memoryReactions, reaction),
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
