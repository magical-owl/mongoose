import type { Result } from '@/shared/types/architecture';
import type { DiaryEntry } from '../domain/DiaryEntry';

export interface IDiaryRepository {
  getAll(): Promise<Result<DiaryEntry[]>>;
  getById(id: string): Promise<Result<DiaryEntry | null>>;
  getByDate(date: string): Promise<Result<DiaryEntry[]>>;
  save(entry: DiaryEntry): Promise<Result<DiaryEntry>>;
  delete(id: string): Promise<Result<boolean>>;
  clearAll(): Promise<Result<boolean>>;
}
