import { failure } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';
import { generateUUID } from '@/shared/utils/uuid';
import type { Journal } from '../domain/Journal';
import { journalRepository } from '../repositories/JournalRepository';
import type { IJournalRepository } from '../repositories/IJournalRepository';

export class JournalService {
  public constructor(private readonly repository: IJournalRepository = journalRepository) {}

  public async getJournals(): Promise<Result<Journal[]>> {
    return this.repository.getAll();
  }

  public async getJournalById(id: string): Promise<Result<Journal | null>> {
    return this.repository.getById(id);
  }

  public async createJournal(title: string): Promise<Result<Journal>> {
    const trimmed = title.trim();
    if (!trimmed) return failure({ code: 'JOURNAL_TITLE_REQUIRED', message: 'Journal title is required.' });
    const now = new Date().toISOString();
    return this.repository.save({
      id: generateUUID(),
      title: trimmed,
      description: '',
      color: '#4ECDC4',
      createdAt: now,
      updatedAt: now,
    });
  }

  public async saveJournal(journal: Journal): Promise<Result<Journal>> {
    return this.repository.save({ ...journal, updatedAt: new Date().toISOString() });
  }

  public async deleteJournal(id: string): Promise<Result<boolean>> {
    return this.repository.delete(id);
  }

  public getEntryCount(journalId: string, entries: readonly { readonly journalIds?: readonly string[]; readonly collectionIds?: readonly string[] }[]): number {
    return entries.filter((entry) => (entry.journalIds ?? entry.collectionIds ?? []).includes(journalId)).length;
  }
}

export const journalService = new JournalService();
