import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { z } from 'zod';
import { config, type AppConfig } from '@/config/ConfigService';
import { DiaryEntrySchema, type DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { migrateDiaryStorage } from '@/features/diary/domain/DiaryMigrations';
import { diaryRepository } from '@/features/diary/repositories/DiaryRepository';
import type { IDiaryRepository } from '@/features/diary/repositories/IDiaryRepository';
import { clearCachedDiaryEntries } from '@/features/diary/services/DiaryEntryCache';
import { JournalSchema, type Journal } from '@/features/journal/domain/Journal';
import { journalRepository } from '@/features/journal/repositories/JournalRepository';
import type { IJournalRepository } from '@/features/journal/repositories/IJournalRepository';
import { clearCachedJournals } from '@/features/journal/services/JournalCache';
import type { ArchitectureError, Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';

interface StressDataImportPayload {
  readonly entries: readonly DiaryEntry[];
  readonly journals: readonly Journal[];
}

export interface StressDataImportSummary {
  readonly entryCount: number;
  readonly journalCount: number;
}

const JournalStorageSchema = z.object({
  journals: z.array(JournalSchema),
});

export class DevStressDataImportService {
  public constructor(
    private readonly diaryRepo: IDiaryRepository = diaryRepository,
    private readonly journalRepo: IJournalRepository = journalRepository,
    private readonly appConfig: Pick<AppConfig, 'isDev'> = config,
  ) {}

  public async importFromDocumentPicker(): Promise<Result<StressDataImportSummary | null>> {
    if (!this.appConfig.isDev) {
      return failure({
        code: 'DEV_ONLY',
        message: 'Stress data import is only available in development builds.',
      });
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return success(null);
      const file = new File(result.assets[0].uri);
      return this.importFromJsonText(await file.text());
    } catch (error) {
      return failure(this.toError('STRESS_DATA_IMPORT_FAILED', 'Unable to import stress data.', error));
    }
  }

  public async importFromJsonText(jsonText: string): Promise<Result<StressDataImportSummary>> {
    if (!this.appConfig.isDev) {
      return failure({
        code: 'DEV_ONLY',
        message: 'Stress data import is only available in development builds.',
      });
    }

    const payloadResult = this.parsePayload(jsonText);
    if (!payloadResult.success) return payloadResult;

    const clearEntriesResult = await this.diaryRepo.clearAll();
    if (!clearEntriesResult.success) return clearEntriesResult;
    const clearJournalsResult = await this.journalRepo.clearAll();
    if (!clearJournalsResult.success) return clearJournalsResult;

    for (const journal of payloadResult.data.journals) {
      const saveJournalResult = await this.journalRepo.save(journal);
      if (!saveJournalResult.success) return saveJournalResult;
    }

    for (const entry of payloadResult.data.entries) {
      const saveEntryResult = await this.diaryRepo.save(entry);
      if (!saveEntryResult.success) return saveEntryResult;
    }

    clearCachedDiaryEntries();
    clearCachedJournals();
    return success({
      entryCount: payloadResult.data.entries.length,
      journalCount: payloadResult.data.journals.length,
    });
  }

  private parsePayload(jsonText: string): Result<StressDataImportPayload> {
    try {
      const parsed: unknown = JSON.parse(jsonText);
      const record = z.object({
        storage: z.object({
          diaryEntries: z.unknown(),
          journals: JournalStorageSchema,
        }).optional(),
        backupPayload: z.object({
          entries: z.array(DiaryEntrySchema),
          journals: z.array(JournalSchema).optional(),
        }).optional(),
      }).parse(parsed);

      const entries = record.storage
        ? migrateDiaryStorage(record.storage.diaryEntries).entries
        : record.backupPayload?.entries ?? [];
      const journals = record.storage?.journals.journals ?? record.backupPayload?.journals ?? [];

      if (entries.length === 0 || journals.length === 0) {
        return failure({
          code: 'STRESS_DATA_INVALID',
          message: 'Stress data file must include generated diary entries and journals.',
        });
      }
      const journalIds = new Set(journals.map((journal) => journal.id));
      const hasMissingJournalReference = entries.some((entry) => entry.journalIds.some((journalId) => !journalIds.has(journalId)));
      if (hasMissingJournalReference) {
        return failure({
          code: 'STRESS_DATA_INVALID',
          message: 'Stress data entries must reference journals included in the same file.',
        });
      }

      return success({ entries, journals });
    } catch (error) {
      return failure(this.toError('STRESS_DATA_INVALID', 'Selected file is not valid stress data.', error));
    }
  }

  private toError(code: string, message: string, error: unknown): ArchitectureError {
    return {
      code,
      message: error instanceof Error ? `${message} ${error.message}` : message,
    };
  }
}

export const devStressDataImportService = new DevStressDataImportService();
