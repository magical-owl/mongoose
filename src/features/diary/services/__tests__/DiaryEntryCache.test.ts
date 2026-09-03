import type { DiaryEntry } from '../../domain/DiaryEntry';
import { clearCachedDiaryEntries, getCachedDiaryEntries, setCachedDiaryEntries } from '../DiaryEntryCache';

const entry = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Entry',
  content: 'Today',
  date: '2026-08-29',
  paperBackgroundId: 'vintage-parchment',
  bodyFontFamily: 'system',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  memoryReactions: [],
  tags: [],
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T00:00:00.000Z',
  manualMoodWeather: 'neutral',
  manualMoods: ['neutral'],
  writingMode: 'free-write',
  sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
  isLockbox: false,
  collectionIds: [],
  journalIds: [],
  photos: [],
  reflections: [],
} satisfies DiaryEntry;

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
