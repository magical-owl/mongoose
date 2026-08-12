import { ValidationError } from '@/shared/errors/AppError';
import type { ArchitectureError, Result } from '@/shared/types/architecture';
import { failure } from '@/shared/utils/result';
import type { Profile, SaveProfileInput } from '../domain/Profile';
import { profileSchema } from '../domain/profileSchema';
import { profileRepository } from '../repositories/ProfileRepository';
import type { IProfileRepository } from '../repositories/IProfileRepository';

export class ProfileService {
  public constructor(private readonly repository: IProfileRepository = profileRepository) {}

  public getCurrentProfile(): Promise<Result<Profile | null, ArchitectureError>> {
    return this.repository.getCurrent();
  }

  public async saveProfile(input: SaveProfileInput): Promise<Result<Profile, ArchitectureError>> {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return failure(
        new ValidationError('Invalid profile data', {
          details: parsed.error.flatten(),
        }).toArchitectureError()
      );
    }
    return this.repository.saveCurrent(parsed.data);
  }

  public clearProfile(): Promise<Result<void, ArchitectureError>> {
    return this.repository.clearCurrent();
  }
}

export const profileService = new ProfileService();
