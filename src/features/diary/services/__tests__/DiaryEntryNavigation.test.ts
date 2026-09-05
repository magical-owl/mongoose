import { getNextDiaryEntry } from '@/features/diary/services/DiaryEntryNavigation';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';

function createEntry(id: string): DiaryEntry {
  return {
    id,
    title: id,
    content: '<p>Entry body.</p>',
    date: '2026-08-29',
    paperBackgroundId: 'blank',
    bodyFontFamily: 'system',
    stickers: [],
    companion: 'cat',
    isFavorite: false,
    memoryReactions: [],
    tags: [],
    createdAt: '2026-08-29T01:00:00.000Z',
    updatedAt: '2026-08-29T01:00:00.000Z',
    manualMoodWeather: 'neutral',
    manualMood: 'neutral',
    manualMoods: ['neutral'],
    writingMode: 'free-write',
    isLockbox: false,
    sensory: {
      locationLabel: '',
      sounds: '',
      smells: '',
      energyLevel: 5,
      bodyState: '',
    },
    collectionIds: [],
    journalIds: [],
    photos: [],
    reflections: [],
  };
}

describe('getNextDiaryEntry', () => {
  it('returns the entry after the current entry in the provided order', () => {
    const first = createEntry('first');
    const second = createEntry('second');
    const third = createEntry('third');

    expect(getNextDiaryEntry([first, second, third], first.id)).toBe(second);
    expect(getNextDiaryEntry([first, second, third], second.id)).toBe(third);
  });

  it('returns undefined at the end or for an unknown entry', () => {
    const first = createEntry('first');
    const second = createEntry('second');

    expect(getNextDiaryEntry([first, second], second.id)).toBeUndefined();
    expect(getNextDiaryEntry([first, second], 'missing')).toBeUndefined();
  });
});
