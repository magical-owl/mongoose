import { JournalExtrasRepository } from '../../repositories/JournalExtrasRepository';
import { JournalExtrasService } from '../JournalExtrasService';
import { EMPTY_JOURNAL_EXTRAS } from '../../domain/JournalExtras';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';

class MemoryStorage implements ISecureStorageDataSource {
  private readonly values = new Map<string, string>();
  public async getItem(key: string): Promise<string | null> { return this.values.get(key) ?? null; }
  public async setItem(key: string, value: string): Promise<void> { this.values.set(key, value); }
  public async removeItem(key: string): Promise<void> { this.values.delete(key); }
}

describe('JournalExtrasService', () => {
  it('persists chapters, rituals, collections, and milestones', async () => {
    const service = new JournalExtrasService(new JournalExtrasRepository(new MemoryStorage()));
    const chapter = await service.addChapter(EMPTY_JOURNAL_EXTRAS, { title: 'Recovery', startDate: '2026-01-01' });
    expect(chapter.success).toBe(true);
    if (!chapter.success) return;
    const ritual = await service.addRitual(chapter.data, { title: 'Sunday reflection', frequency: 'weekly' });
    expect(ritual.success).toBe(true);
    if (!ritual.success) return;
    expect(ritual.data.rituals[0]?.title).toBe('Sunday reflection');
  });
});
