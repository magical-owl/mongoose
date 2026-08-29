import type { Journal } from '../../domain/Journal';
import { clearCachedJournals, getCachedJournals, setCachedJournals } from '../JournalCache';

const journal = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Daily Life',
  description: '',
  color: '#4ECDC4',
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T00:00:00.000Z',
} satisfies Journal;

describe('JournalCache', () => {
  afterEach(() => {
    clearCachedJournals();
  });

  it('stores and clears cached journals', () => {
    setCachedJournals([journal]);

    expect(getCachedJournals()).toEqual([journal]);

    clearCachedJournals();

    expect(getCachedJournals()).toBeNull();
  });
});
