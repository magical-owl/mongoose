import { DiaryService } from '../DiaryService';
import { DiaryRepository } from '../../repositories/DiaryRepository';
import { DiaryEntry } from '../../domain/DiaryEntry';

describe('DiaryService', () => {
  let service: DiaryService;
  let repo: DiaryRepository;

  const mockEntry: DiaryEntry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Sunny Morning',
    content: 'Had a wonderful and happy day outdoors!',
    date: '2026-08-13',
    paperBackgroundId: 'vintage-parchment',
    stickers: [],
    companion: 'cat',
    isFavorite: true,
    tags: ['sunny'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    manualMoodWeather: 'calm',
    writingMode: 'free-write',
    sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
    isLockbox: false,
    collectionIds: [],
  };

  beforeEach(() => {
    repo = new DiaryRepository();
    service = new DiaryService(repo);
  });

  it('should save an entry without generating automated mood data', async () => {
    const result = await service.saveEntry(mockEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.manualMood).toBeUndefined();
    }
  });

  it('should calculate streak accurately', () => {
    const entries: DiaryEntry[] = [
      { ...mockEntry, id: '1', date: '2026-08-13' },
      { ...mockEntry, id: '2', date: '2026-08-12' },
      { ...mockEntry, id: '3', date: '2026-08-11' },
    ];
    const streak = service.calculateStreak(entries);
    expect(streak.currentStreak).toBeGreaterThanOrEqual(1);
  });
});
