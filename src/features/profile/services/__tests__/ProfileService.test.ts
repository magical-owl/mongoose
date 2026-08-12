import type { IProfileRepository } from '../../repositories/IProfileRepository';
import { ProfileService } from '../ProfileService';

describe('ProfileService', () => {
  it('rejects invalid profile input before persistence', async () => {
    const repository: jest.Mocked<IProfileRepository> = {
      getCurrent: jest.fn(),
      saveCurrent: jest.fn(),
      clearCurrent: jest.fn(),
    };
    const service = new ProfileService(repository);

    const result = await service.saveProfile({
      displayName: 'A',
      email: 'invalid',
      bio: '',
    });

    expect(result.success).toBe(false);
    expect(repository.saveCurrent).not.toHaveBeenCalled();
  });

  it('normalizes valid profile input before persistence', async () => {
    const repository: jest.Mocked<IProfileRepository> = {
      getCurrent: jest.fn(),
      saveCurrent: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'profile-1',
          displayName: 'Meadow User',
          email: 'meadow@example.com',
          bio: 'Hello',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }),
      clearCurrent: jest.fn(),
    };
    const service = new ProfileService(repository);

    await service.saveProfile({
      displayName: '  Meadow User  ',
      email: '  meadow@example.com ',
      bio: ' Hello ',
    });

    expect(repository.saveCurrent).toHaveBeenCalledWith({
      displayName: 'Meadow User',
      email: 'meadow@example.com',
      bio: 'Hello',
    });
  });
});
