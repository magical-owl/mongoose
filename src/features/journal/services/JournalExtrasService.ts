import { generateUUID } from '@/shared/utils/uuid';
import type { Result } from '@/shared/types/architecture';
import type { JournalExtrasRepository } from '../repositories/JournalExtrasRepository';
import { Chapter, Collection, EntryConnection, JournalExtras, Milestone, ReflectionCard, Ritual } from '../domain/JournalExtras';
import { journalExtrasRepository } from '../repositories/JournalExtrasRepository';

export class JournalExtrasService {
  public constructor(private readonly repository: JournalExtrasRepository) {}

  public async get(): Promise<Result<JournalExtras>> { return this.repository.get(); }
  public async save(state: JournalExtras): Promise<Result<JournalExtras>> { return this.repository.save(state); }

  public async addChapter(state: JournalExtras, input: Pick<Chapter, 'title' | 'startDate'>): Promise<Result<JournalExtras>> {
    return this.save({ ...state, chapters: [...state.chapters, { id: generateUUID(), ...input, description: '', cover: '📖', color: '#1E90FF', entryIds: [] }] });
  }
  public async addRitual(state: JournalExtras, input: Pick<Ritual, 'title' | 'frequency'>): Promise<Result<JournalExtras>> {
    return this.save({ ...state, rituals: [...state.rituals, { id: generateUUID(), ...input, prompt: '', completedDates: [] }] });
  }
  public async addCollection(state: JournalExtras, input: Pick<Collection, 'title'>): Promise<Result<JournalExtras>> {
    return this.save({ ...state, collections: [...state.collections, { id: generateUUID(), ...input, description: '', color: '#4ECDC4', entryIds: [] }] });
  }
  public async addMilestone(state: JournalExtras, input: Pick<Milestone, 'title' | 'date'>): Promise<Result<JournalExtras>> {
    return this.save({ ...state, milestones: [...state.milestones, { id: generateUUID(), ...input, note: '', color: '#E5A72D' }] });
  }
  public async completeRitual(state: JournalExtras, id: string, date: string): Promise<Result<JournalExtras>> {
    return this.save({ ...state, rituals: state.rituals.map((ritual) => ritual.id === id && !ritual.completedDates.includes(date) ? { ...ritual, completedDates: [...ritual.completedDates, date] } : ritual) });
  }
  public async addReflectionCard(state: JournalExtras, input: Omit<ReflectionCard, 'id' | 'createdAt'>): Promise<Result<JournalExtras>> {
    return this.save({ ...state, reflectionCards: [...state.reflectionCards, { ...input, id: generateUUID(), createdAt: new Date().toISOString() }] });
  }
  public async connectEntries(state: JournalExtras, input: Omit<EntryConnection, 'id'>): Promise<Result<JournalExtras>> {
    return this.save({ ...state, connections: [...state.connections, { ...input, id: generateUUID() }] });
  }
}

export const journalExtrasService = new JournalExtrasService(journalExtrasRepository);
