import type { Result } from '@/shared/types/architecture';
import type { Journal } from '../domain/Journal';

export interface IJournalRepository {
  getAll(): Promise<Result<Journal[]>>;
  getById(id: string): Promise<Result<Journal | null>>;
  save(journal: Journal): Promise<Result<Journal>>;
  delete(id: string): Promise<Result<boolean>>;
  clearAll(): Promise<Result<boolean>>;
}
