import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { IDiaryRepository } from '@/features/diary/repositories/IDiaryRepository';
import type { Journal } from '@/features/journal/domain/Journal';
import type { IJournalRepository } from '@/features/journal/repositories/IJournalRepository';
import { DevStressDataImportService } from '../DevStressDataImportService';

class MemoryDiaryRepository implements IDiaryRepository {
  public entries: DiaryEntry[] = [];
  public clearCalls = 0;

  public async getAll(): Promise<Result<DiaryEntry[]>> {
    return success(this.entries.filter((entry) => !entry.deletedAt));
  }

  public async getDeleted(): Promise<Result<DiaryEntry[]>> {
    return success(this.entries.filter((entry) => Boolean(entry.deletedAt)));
  }

  public async getById(id: string): Promise<Result<DiaryEntry | null>> {
    return success(this.entries.find((entry) => entry.id === id) ?? null);
  }

  public async getByDate(date: string): Promise<Result<DiaryEntry[]>> {
    return success(this.entries.filter((entry) => entry.date === date));
  }

  public async save(entry: DiaryEntry): Promise<Result<DiaryEntry>> {
    this.entries.push(entry);
    return success(entry);
  }

  public async softDelete(): Promise<Result<boolean>> {
    return success(true);
  }

  public async restore(): Promise<Result<DiaryEntry | null>> {
    return success(null);
  }

  public async delete(): Promise<Result<boolean>> {
    return success(true);
  }

  public async clearAll(): Promise<Result<boolean>> {
    this.clearCalls += 1;
    this.entries = [];
    return success(true);
  }
}

class MemoryJournalRepository implements IJournalRepository {
  public journals: Journal[] = [];
  public clearCalls = 0;

  public async getAll(): Promise<Result<Journal[]>> {
    return success(this.journals);
  }

  public async getById(id: string): Promise<Result<Journal | null>> {
    return success(this.journals.find((journal) => journal.id === id) ?? null);
  }

  public async save(journal: Journal): Promise<Result<Journal>> {
    this.journals.push(journal);
    return success(journal);
  }

  public async delete(): Promise<Result<boolean>> {
    return success(true);
  }

  public async clearAll(): Promise<Result<boolean>> {
    this.clearCalls += 1;
    this.journals = [];
    return success(true);
  }
}

const journal: Journal = {
  id: '11111111-0000-4000-8000-000000000001',
  title: 'Stress Journal',
  description: 'Synthetic data',
  color: '#4ECDC4',
  coverImageUri: 'builtin://journal-background/summer',
  coverImageWidth: 1672,
  coverImageHeight: 941,
  createdAt: '2026-08-31T00:00:00.000Z',
  updatedAt: '2026-08-31T00:00:00.000Z',
};

const entry: DiaryEntry = {
  id: '22222222-0000-4000-8000-000000000001',
  title: 'Stress Entry',
  content: '<p>Synthetic entry.</p>',
  date: '2026-05-01',
  paperBackgroundId: 'vintage-parchment',
  bodyFontFamily: 'system',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  tags: ['stress'],
  createdAt: '2026-05-01T08:00:00.000Z',
  updatedAt: '2026-05-01T08:00:00.000Z',
  manualMoodWeather: 'sunny',
  manualMood: 'happy',
  manualMoods: ['happy', 'grateful'],
  writingMode: 'free-write',
  sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
  isLockbox: false,
  collectionIds: [],
  journalIds: [journal.id],
  coverPhoto: {
    id: '33333333-0000-4000-8000-000000000001',
    uri: 'builtin://journal-background/summer',
    width: 1672,
    height: 941,
    createdAt: '2026-05-01T08:00:00.000Z',
  },
  photos: [],
  reflections: [],
};

describe('DevStressDataImportService', () => {
  it('replaces local diary entries and journals from generated stress data', async () => {
    const diaryRepo = new MemoryDiaryRepository();
    const journalRepo = new MemoryJournalRepository();
    const service = new DevStressDataImportService(diaryRepo, journalRepo, { isDev: true });

    const result = await service.importFromJsonText(JSON.stringify({
      storage: {
        diaryEntries: { version: 5, entries: [entry] },
        journals: { version: 1, journals: [journal] },
      },
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ entryCount: 1, journalCount: 1 });
    }
    expect(diaryRepo.clearCalls).toBe(1);
    expect(journalRepo.clearCalls).toBe(1);
    expect(diaryRepo.entries).toEqual([entry]);
    expect(journalRepo.journals).toEqual([journal]);
  });

  it('blocks stress data imports outside development builds', async () => {
    const service = new DevStressDataImportService(new MemoryDiaryRepository(), new MemoryJournalRepository(), { isDev: false });

    const result = await service.importFromJsonText(JSON.stringify({
      storage: {
        diaryEntries: { version: 5, entries: [entry] },
        journals: { version: 1, journals: [journal] },
      },
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DEV_ONLY');
    }
  });

  it('rejects invalid stress data before clearing repositories', async () => {
    const diaryRepo = new MemoryDiaryRepository();
    const journalRepo = new MemoryJournalRepository();
    const service = new DevStressDataImportService(diaryRepo, journalRepo, { isDev: true });

    const result = await service.importFromJsonText(JSON.stringify({
      storage: {
        diaryEntries: { version: 5, entries: [] },
        journals: { version: 1, journals: [journal] },
      },
    }));

    expect(result.success).toBe(false);
    expect(diaryRepo.clearCalls).toBe(0);
    expect(journalRepo.clearCalls).toBe(0);
  });

  it('rejects entries that reference journals missing from the stress file', async () => {
    const diaryRepo = new MemoryDiaryRepository();
    const journalRepo = new MemoryJournalRepository();
    const service = new DevStressDataImportService(diaryRepo, journalRepo, { isDev: true });

    const result = await service.importFromJsonText(JSON.stringify({
      storage: {
        diaryEntries: { version: 5, entries: [{ ...entry, journalIds: ['44444444-0000-4000-8000-000000000001'] }] },
        journals: { version: 1, journals: [journal] },
      },
    }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('STRESS_DATA_INVALID');
    expect(diaryRepo.clearCalls).toBe(0);
    expect(journalRepo.clearCalls).toBe(0);
  });

  it('stops when clearing existing diary data fails', async () => {
    const diaryRepo = new MemoryDiaryRepository();
    diaryRepo.clearAll = async () => failure({ code: 'CLEAR_FAILED', message: 'Unable to clear entries' });
    const journalRepo = new MemoryJournalRepository();
    const service = new DevStressDataImportService(diaryRepo, journalRepo, { isDev: true });

    const result = await service.importFromJsonText(JSON.stringify({
      storage: {
        diaryEntries: { version: 5, entries: [entry] },
        journals: { version: 1, journals: [journal] },
      },
    }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('CLEAR_FAILED');
    expect(journalRepo.clearCalls).toBe(0);
  });
});
