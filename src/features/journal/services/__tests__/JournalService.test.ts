import type { Result } from '@/shared/types/architecture';
import { success } from '@/shared/utils/result';
import type { Journal } from '../../domain/Journal';
import type { IJournalRepository } from '../../repositories/IJournalRepository';
import { JournalService } from '../JournalService';

class MemoryJournalRepository implements IJournalRepository {
  public savedJournal: Journal | null = null;

  public async getAll(): Promise<Result<Journal[]>> {
    return success(this.savedJournal ? [this.savedJournal] : []);
  }

  public async getById(id: string): Promise<Result<Journal | null>> {
    return success(this.savedJournal?.id === id ? this.savedJournal : null);
  }

  public async save(journal: Journal): Promise<Result<Journal>> {
    this.savedJournal = journal;
    return success(journal);
  }

  public async delete(): Promise<Result<boolean>> {
    this.savedJournal = null;
    return success(true);
  }

  public async clearAll(): Promise<Result<boolean>> {
    this.savedJournal = null;
    return success(true);
  }
}

describe('JournalService', () => {
  it('creates journals with trimmed title, description, and cover metadata', async () => {
    const repository = new MemoryJournalRepository();
    const service = new JournalService(repository);

    const result = await service.createJournal({
      title: '  Summer Trip  ',
      description: '  Family photos and daily notes.  ',
      coverImageUri: 'builtin://journal-background/summer',
      coverImageWidth: 1672,
      coverImageHeight: 941,
    });

    expect(result.success).toBe(true);
    expect(repository.savedJournal).toEqual(expect.objectContaining({
      title: 'Summer Trip',
      description: 'Family photos and daily notes.',
      color: '#4ECDC4',
      coverImageUri: 'builtin://journal-background/summer',
      coverImageWidth: 1672,
      coverImageHeight: 941,
    }));
  });

  it('rejects descriptions longer than 280 characters', async () => {
    const service = new JournalService(new MemoryJournalRepository());

    const result = await service.createJournal({
      title: 'Daily',
      description: 'x'.repeat(281),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('JOURNAL_DESCRIPTION_TOO_LONG');
    }
  });
});
