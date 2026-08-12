import {
  secureStorage,
  type ISecureStorageDataSource,
} from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { AppError, ErrorCodes } from '@/shared/errors/AppError';
import { failure, success } from '@/shared/utils/result';
import type { ArchitectureError, Result } from '@/shared/types/architecture';
import type { Profile, SaveProfileInput } from '../domain/Profile';
import type { IProfileRepository } from './IProfileRepository';

type StoredProfile = Profile;

export class ProfileRepository implements IProfileRepository {
  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  public async getCurrent(): Promise<Result<Profile | null, ArchitectureError>> {
    try {
      const serializedProfile = await this.storage.getItem(secureStorageKeys.currentProfile);
      if (!serializedProfile) {
        return success(null);
      }
      return success(this.toProfile(JSON.parse(serializedProfile) as StoredProfile));
    } catch (error) {
      return failure(this.toError('Unable to load profile', error));
    }
  }

  public async saveCurrent(input: SaveProfileInput): Promise<Result<Profile, ArchitectureError>> {
    try {
      const existing = await this.getCurrent();
      if (!existing.success) {
        return existing;
      }
      const now = new Date().toISOString();
      const profile: Profile = {
        id: existing.data?.id ?? 'current-profile',
        createdAt: existing.data?.createdAt ?? now,
        updatedAt: now,
        ...input,
      };
      await this.storage.setItem(secureStorageKeys.currentProfile, JSON.stringify(profile));
      return success(profile);
    } catch (error) {
      return failure(this.toError('Unable to save profile', error));
    }
  }

  public async clearCurrent(): Promise<Result<void, ArchitectureError>> {
    try {
      await this.storage.removeItem(secureStorageKeys.currentProfile);
      return success(undefined);
    } catch (error) {
      return failure(this.toError('Unable to clear profile', error));
    }
  }

  private toProfile(record: StoredProfile): Profile {
    return {
      id: record.id,
      displayName: record.displayName,
      email: record.email,
      bio: record.bio,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toError(message: string, cause: unknown): ArchitectureError {
    return new AppError(ErrorCodes.REPOSITORY, message, { cause }).toArchitectureError();
  }
}

export const profileRepository = new ProfileRepository();
