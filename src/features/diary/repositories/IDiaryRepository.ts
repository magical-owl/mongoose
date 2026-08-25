import type { Result } from '@/shared/types/architecture';
import type { DiaryEntry } from '../domain/DiaryEntry';

export interface IDiaryRepository {
  getAll(): Promise<Result<DiaryEntry[]>>;
  getDeleted(): Promise<Result<DiaryEntry[]>>;
  getById(id: string): Promise<Result<DiaryEntry | null>>;
  getByDate(date: string): Promise<Result<DiaryEntry[]>>;
  save(entry: DiaryEntry): Promise<Result<DiaryEntry>>;
  softDelete(id: string): Promise<Result<boolean>>;
  restore(id: string): Promise<Result<DiaryEntry | null>>;
  delete(id: string): Promise<Result<boolean>>;
  clearAll(): Promise<Result<boolean>>;
}
