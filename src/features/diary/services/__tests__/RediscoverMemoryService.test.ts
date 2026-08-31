import type { DiaryEntry } from '../../domain/DiaryEntry';
import {
  buildRediscoverMemorySet,
  getRediscoverEligibleEntries,
} from '../RediscoverMemoryService';

function createEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  const date = overrides.date ?? '2025-08-31';
  return {
    id: overrides.id ?? '123e4567-e89b-42d3-a456-426614174000',
    title: overrides.title ?? 'Memory',
    content: overrides.content ?? '<p>A remembered day.</p>',
    date,
    paperBackgroundId: 'vintage-parchment',
    stickers: [],
    companion: 'cat',
    isFavorite: false,
    tags: [],
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    manualMoodWeather: 'calm',
    manualMood: 'calm',
    manualMoods: ['calm'],
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
    ...overrides,
  };
}

describe('RediscoverMemoryService', () => {
  const now = new Date('2026-08-31T12:00:00.000Z');

  it('excludes locked and hidden entries from rediscovery', () => {
    const visible = createEntry({ id: '123e4567-e89b-42d3-a456-426614174001' });
    const locked = createEntry({ id: '123e4567-e89b-42d3-a456-426614174002', isLockbox: true });
    const futureCapsule = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174003',
      timeCapsuleUnlockAt: '2026-09-01T00:00:00.000Z',
    });

    expect(getRediscoverEligibleEntries([visible, locked, futureCapsule], now)).toEqual([visible]);
  });

  it('builds memory categories and shuffle memories', () => {
    const onThisDay = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174004',
      date: '2024-08-31',
      title: 'Two years ago',
    });
    const oldPhoto = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174005',
      date: '2026-01-10',
      title: 'Photo memory',
      coverPhoto: {
        id: '123e4567-e89b-42d3-a456-426614174006',
        uri: 'file:///photo.jpg',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
    });
    const oneYearAgo = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174012',
      date: '2025-08-30',
      title: 'One year ago',
    });
    const recent = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174007',
      date: '2026-08-30',
      title: 'Yesterday',
      isFavorite: true,
    });
    const reflected = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174008',
      date: '2026-07-15',
      title: 'With reflection',
      reflections: [
        {
          id: '123e4567-e89b-42d3-a456-426614174009',
          text: 'Worth revisiting.',
          createdAt: '2026-07-16T08:00:00.000Z',
          updatedAt: '2026-07-16T08:00:00.000Z',
        },
      ],
    });
    const sameMonth = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174010',
      date: '2023-08-12',
      title: 'Same month before',
    });
    const expressiveMood = createEntry({
      id: '123e4567-e89b-42d3-a456-426614174011',
      date: '2026-06-20',
      title: 'Mood memory',
      manualMood: 'excited',
      manualMoods: ['excited', 'grateful'],
    });

    const memories = buildRediscoverMemorySet(
      [recent, oldPhoto, onThisDay, reflected, sameMonth, expressiveMood, oneYearAgo],
      now,
      1,
    );

    expect(memories.onThisDayEntries).toEqual([onThisDay]);
    expect(memories.oneYearAgoEntries).toEqual([oneYearAgo]);
    expect(memories.oldPhotoEntries).toEqual([oldPhoto]);
    expect(memories.lookingBackEntries).toEqual([onThisDay, sameMonth]);
    expect(memories.favoriteEntries).toEqual([recent]);
    expect(memories.reflectionEntries).toEqual([reflected]);
    expect(memories.sameMonthEntries).toEqual([oneYearAgo, onThisDay, sameMonth]);
    expect(memories.moodRewindEntries).toEqual([
      recent,
      reflected,
      expressiveMood,
      oldPhoto,
      oneYearAgo,
      onThisDay,
    ]);
    expect(memories.surpriseEntry?.id).toBe(reflected.id);
  });
});
