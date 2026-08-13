import { DiaryRepository } from '../DiaryRepository';
import { DiaryEntry } from '../../domain/DiaryEntry';

describe('DiaryRepository', () => {
  let repository: DiaryRepository;

  const mockEntry: DiaryEntry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Entry',
    content: 'Today was a wonderful day.',
    date: '2026-08-13',
    paperBackgroundId: 'vintage-parchment',
    stickers: [
      {
        id: '987e6543-e89b-12d3-a456-426614174000',
        stickerId: 'cat-boba',
        category: 'animals',
        x: 100,
        y: 150,
        scale: 1.2,
        rotation: 15,
        zIndex: 1,
      },
    ],
    companion: 'cat',
    isFavorite: false,
    tags: ['test', 'gratitude'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = new DiaryRepository();
  });

  it('should save and retrieve a diary entry with sticker canvas positions', async () => {
    const saveResult = await repository.save(mockEntry);
    expect(saveResult.success).toBe(true);

    const getResult = await repository.getById(mockEntry.id);
    expect(getResult.success).toBe(true);
    if (getResult.success && getResult.data) {
      expect(getResult.data.title).toBe('Test Entry');
      expect(getResult.data.stickers.length).toBe(1);
      expect(getResult.data.stickers[0]?.x).toBe(100);
      expect(getResult.data.stickers[0]?.scale).toBe(1.2);
    }
  });

  it('should retrieve entries by date', async () => {
    await repository.save(mockEntry);
    const dateResult = await repository.getByDate('2026-08-13');
    expect(dateResult.success).toBe(true);
    if (dateResult.success) {
      expect(dateResult.data.length).toBe(1);
    }
  });

  it('should delete a diary entry', async () => {
    await repository.save(mockEntry);
    const deleteResult = await repository.delete(mockEntry.id);
    expect(deleteResult.success).toBe(true);

    const getResult = await repository.getById(mockEntry.id);
    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.data).toBeNull();
    }
  });
});
