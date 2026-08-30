import { DiaryRepository } from '../DiaryRepository';
import { DiaryEntry } from '../../domain/DiaryEntry';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';

class MockSecureStorage implements ISecureStorageDataSource {
  private store = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('DiaryRepository', () => {
  let repository: DiaryRepository;
  let mockStorage: MockSecureStorage;

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
        behindText: false,
      },
    ],
    companion: 'cat',
    isFavorite: false,
    tags: ['test', 'gratitude'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    manualMoodWeather: 'calm',
    manualMoods: [],
    writingMode: 'free-write',
    sensory: { locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' },
    isLockbox: false,
    collectionIds: [],
    journalIds: [],
    photos: [],
    reflections: [],
  };

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
    repository = new DiaryRepository(mockStorage);
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

  it('should persist diary entries across repository instances (simulating app restart)', async () => {
    await repository.save(mockEntry);

    // Create a new instance pointing to the same encrypted storage
    const newRepoInstance = new DiaryRepository(mockStorage);
    const getAllResult = await newRepoInstance.getAll();
    expect(getAllResult.success).toBe(true);
    if (getAllResult.success) {
      expect(getAllResult.data.length).toBe(1);
      expect(getAllResult.data[0]?.id).toBe(mockEntry.id);
      expect(getAllResult.data[0]?.title).toBe('Test Entry');
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

  it('should move a diary entry to the recovery bin and hide it from active reads', async () => {
    await repository.save(mockEntry);
    const deleteResult = await repository.softDelete(mockEntry.id);
    expect(deleteResult.success).toBe(true);

    const getResult = await repository.getById(mockEntry.id);
    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.data).toBeNull();
    }

    const newRepoInstance = new DiaryRepository(mockStorage);
    const getAllResult = await newRepoInstance.getAll();
    const getDeletedResult = await newRepoInstance.getDeleted();
    expect(getAllResult.success).toBe(true);
    if (getAllResult.success) {
      expect(getAllResult.data.length).toBe(0);
    }
    expect(getDeletedResult.success).toBe(true);
    if (getDeletedResult.success) {
      expect(getDeletedResult.data).toHaveLength(1);
      expect(getDeletedResult.data[0]?.id).toBe(mockEntry.id);
      expect(getDeletedResult.data[0]?.deletedAt).toBeDefined();
    }
  });

  it('should restore a soft-deleted diary entry', async () => {
    await repository.save(mockEntry);
    await repository.softDelete(mockEntry.id);

    const restoreResult = await repository.restore(mockEntry.id);
    expect(restoreResult.success).toBe(true);
    if (restoreResult.success) {
      expect(restoreResult.data?.id).toBe(mockEntry.id);
      expect(restoreResult.data?.deletedAt).toBeUndefined();
    }

    const getAllResult = await repository.getAll();
    const getDeletedResult = await repository.getDeleted();
    expect(getAllResult.success).toBe(true);
    expect(getDeletedResult.success).toBe(true);
    if (getAllResult.success) expect(getAllResult.data).toHaveLength(1);
    if (getDeletedResult.success) expect(getDeletedResult.data).toHaveLength(0);
  });

  it('should permanently delete a diary entry from the recovery bin', async () => {
    await repository.save(mockEntry);
    await repository.softDelete(mockEntry.id);

    const permanentDeleteResult = await repository.delete(mockEntry.id);
    expect(permanentDeleteResult.success).toBe(true);

    const getDeletedResult = await repository.getDeleted();
    expect(getDeletedResult.success).toBe(true);
    if (getDeletedResult.success) {
      expect(getDeletedResult.data).toHaveLength(0);
    }
  });
});
