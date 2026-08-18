import type { Result } from '@/shared/types/architecture';
import type { DailyPlanUsage } from '../domain/PlanUsage';

export interface IPlanUsageRepository {
  getDailyUsage(dateKey: string): Promise<Result<DailyPlanUsage>>;
  recordStickerUsage(
    dateKey: string,
    count: number,
    options?: { readonly limit?: number; readonly occurredAt?: string }
  ): Promise<Result<DailyPlanUsage>>;
  clearAll(): Promise<Result<boolean>>;
}
