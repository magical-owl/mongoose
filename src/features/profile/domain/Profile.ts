import type { BaseEntity } from '@/shared/types/architecture';

export interface Profile extends BaseEntity {
  readonly displayName: string;
  readonly email: string;
  readonly bio: string;
}

export interface SaveProfileInput {
  readonly displayName: string;
  readonly email: string;
  readonly bio: string;
}
