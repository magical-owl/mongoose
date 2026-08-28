import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { ProfileRepository } from '../ProfileRepository';

class InMemorySecureStorage implements ISecureStorageDataSource {
  private readonly values = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  beforeEach(() => {
    repository = new ProfileRepository(new InMemorySecureStorage());
  });

  it('persists one current profile and updates it on subsequent saves', async () => {
    const first = await repository.saveCurrent({
      displayName: 'Meadow User',
      email: 'meadow@example.com',
      bio: 'First bio',
    });
    const second = await repository.saveCurrent({
      displayName: 'Updated User',
      email: 'updated@example.com',
      bio: 'Updated bio',
      avatarUri: 'file:///avatar.jpg',
    });
    const current = await repository.getCurrent();

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(current).toMatchObject({
      success: true,
      data: {
        displayName: 'Updated User',
        email: 'updated@example.com',
        bio: 'Updated bio',
        avatarUri: 'file:///avatar.jpg',
      },
    });
  });

  it('clears the current profile', async () => {
    await repository.saveCurrent({
      displayName: 'Meadow User',
      email: 'meadow@example.com',
      bio: '',
    });

    await repository.clearCurrent();

    await expect(repository.getCurrent()).resolves.toEqual({ success: true, data: null });
  });
});
