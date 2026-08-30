import { failure } from '@/shared/utils/result';
import type { Result } from '@/shared/types/architecture';
import { generateUUID } from '@/shared/utils/uuid';
import type { Journal } from '../domain/Journal';
import { journalRepository } from '../repositories/JournalRepository';
import type { IJournalRepository } from '../repositories/IJournalRepository';

export interface CreateJournalInput {
  readonly title: string;
  readonly description?: string;
  readonly coverImageUri?: string;
  readonly coverImageWidth?: number;
  readonly coverImageHeight?: number;
}

const JOURNAL_DESCRIPTION_MAX_LENGTH = 280;

export class JournalService {
  public constructor(private readonly repository: IJournalRepository = journalRepository) {}

  public async getJournals(): Promise<Result<Journal[]>> {
    return this.repository.getAll();
  }

  public async getJournalById(id: string): Promise<Result<Journal | null>> {
    return this.repository.getById(id);
  }

  public async createJournal(input: string | CreateJournalInput): Promise<Result<Journal>> {
    const request = typeof input === 'string' ? { title: input } : input;
    const trimmed = request.title.trim();
    if (!trimmed) return failure({ code: 'JOURNAL_TITLE_REQUIRED', message: 'Journal title is required.' });
    const description = request.description?.trim() ?? '';
    if (description.length > JOURNAL_DESCRIPTION_MAX_LENGTH) {
      return failure({
        code: 'JOURNAL_DESCRIPTION_TOO_LONG',
        message: 'Journal description must be 280 characters or fewer.',
      });
    }
    const now = new Date().toISOString();
    return this.repository.save({
      id: generateUUID(),
      title: trimmed,
      description,
      color: '#4ECDC4',
      coverImageUri: request.coverImageUri,
      coverImageWidth: request.coverImageWidth,
      coverImageHeight: request.coverImageHeight,
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
