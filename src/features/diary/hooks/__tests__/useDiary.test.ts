import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { replaceDiaryEntryPreservingOrder } from '@/features/diary/hooks/useDiary';

const baseEntry: DiaryEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'First',
  content: 'Entry',
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
};

describe('replaceDiaryEntryPreservingOrder', () => {
  it('updates an entry without moving it in same-day lists', () => {
    const first = baseEntry;
    const second = {
      ...baseEntry,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Second',
      createdAt: '2026-08-29T01:00:00.000Z',
      updatedAt: '2026-08-29T01:00:00.000Z',
    };
    const updatedSecond = {
      ...second,
      memoryReactions: ['treasure'],
      updatedAt: '2026-09-04T00:00:00.000Z',
    } satisfies DiaryEntry;

    const result = replaceDiaryEntryPreservingOrder([first, second], updatedSecond);

    expect(result.map((entry) => entry.id)).toEqual([first.id, second.id]);
    expect(result[1]).toBe(updatedSecond);
  });
});
