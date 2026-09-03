import { isDiaryEntryVisible } from '../DiaryEntryVisibility';
import type { DiaryEntry } from '../../domain/DiaryEntry';

const entry = { id: '123e4567-e89b-12d3-a456-426614174000', title: 'Entry', content: 'Content', date: '2026-08-13', paperBackgroundId: 'vintage-parchment', bodyFontFamily: 'system', stickers: [], companion: 'cat', isFavorite: false, memoryReactions: [], tags: [], createdAt: '2026-08-13T00:00:00.000Z', updatedAt: '2026-08-13T00:00:00.000Z', manualMoodWeather: 'calm', manualMoods: [], writingMode: 'free-write', sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' }, isLockbox: false, collectionIds: [],
    journalIds: [], photos: [], reflections: [] } satisfies DiaryEntry;

describe('DiaryEntryVisibility', () => {
  const now = new Date('2026-08-14T00:00:00.000Z');
  it('hides future capsules', () => expect(isDiaryEntryVisible({ ...entry, timeCapsuleUnlockAt: '2026-08-15T00:00:00.000Z' }, now)).toBe(false));
  it('hides expired entries', () => expect(isDiaryEntryVisible({ ...entry, expiresAt: '2026-08-13T00:00:00.000Z' }, now)).toBe(false));
});
