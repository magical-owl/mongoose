import { clearCachedDiaryEntries, getCachedDiaryEntries, setCachedDiaryEntries } from '../DiaryEntryCache';
import { buildDiaryEntry } from '@tests/fixtures/domain';

const entry = buildDiaryEntry({
  title: 'Entry',
  content: 'Today',
  paperBackgroundId: 'vintage-parchment',
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T00:00:00.000Z',
});

describe('DiaryEntryCache', () => {
  afterEach(() => {
    clearCachedDiaryEntries();
  });

  it('stores and clears cached active and deleted entries', () => {
    setCachedDiaryEntries([entry], []);

    expect(getCachedDiaryEntries()).toEqual({ entries: [entry], deletedEntries: [] });

    clearCachedDiaryEntries();

    expect(getCachedDiaryEntries()).toEqual({ entries: null, deletedEntries: null });
  });
});
