import type { Profile, SaveProfileInput } from '../domain/Profile';
import type { ArchitectureError, Result } from '@/shared/types/architecture';

export interface IProfileRepository {
  getCurrent(): Promise<Result<Profile | null, ArchitectureError>>;
  saveCurrent(input: SaveProfileInput): Promise<Result<Profile, ArchitectureError>>;
  clearCurrent(): Promise<Result<void, ArchitectureError>>;
}
