import { z } from 'zod';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import { DailyPlanUsage, PlanUsageEnvelope, PlanUsageEnvelopeSchema } from '../domain/PlanUsage';
import type { IPlanUsageRepository } from './IPlanUsageRepository';

const emptyEnvelope: PlanUsageEnvelope = {
  daily: {},
};

export class PlanUsageRepository implements IPlanUsageRepository {
  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  private async readEnvelope(): Promise<PlanUsageEnvelope> {
    const raw = await this.storage.getItem(secureStorageKeys.planUsage);
    if (!raw) return emptyEnvelope;

    const parsed: unknown = JSON.parse(raw);
    return PlanUsageEnvelopeSchema.parse(parsed);
  }

  private async writeEnvelope(envelope: PlanUsageEnvelope): Promise<void> {
    await this.storage.setItem(secureStorageKeys.planUsage, JSON.stringify(envelope));
  }

  public async getDailyUsage(dateKey: string): Promise<Result<DailyPlanUsage>> {
    try {
      const envelope = await this.readEnvelope();
      return success(envelope.daily[dateKey] ?? { dateKey, stickersUsed: 0 });
    } catch (error) {
      let message = 'Failed to retrieve plan usage';
      if (error instanceof z.ZodError) {
        message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      } else if (error instanceof Error) {
        message = error.message;
      }
      return failure({
        code: 'PLAN_USAGE_STORAGE_ERROR',
        message,
      });
    }
  }

  public async recordStickerUsage(
    dateKey: string,
    count: number,
    options?: { readonly limit?: number; readonly occurredAt?: string }
  ): Promise<Result<DailyPlanUsage>> {
    try {
      const envelope = await this.readEnvelope();
      const current = envelope.daily[dateKey] ?? { dateKey, stickersUsed: 0 };
      const nextStickerCount = current.stickersUsed + count;
      const next = {
        dateKey,
        stickersUsed: nextStickerCount,
        stickerLimitExhaustedAt:
          current.stickerLimitExhaustedAt
          ?? (options?.limit !== undefined && nextStickerCount >= options.limit
            ? options.occurredAt ?? new Date().toISOString()
            : undefined),
      };
      await this.writeEnvelope({
        daily: {
          ...envelope.daily,
          [dateKey]: next,
        },
      });
      return success(next);
    } catch (error) {
      let message = 'Failed to record plan usage';
      if (error instanceof z.ZodError) {
        message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      } else if (error instanceof Error) {
        message = error.message;
      }
      return failure({
        code: 'PLAN_USAGE_STORAGE_ERROR',
        message,
      });
    }
  }

  public async clearAll(): Promise<Result<boolean>> {
    try {
      await this.storage.removeItem(secureStorageKeys.planUsage);
      return success(true);
    } catch (error) {
      return failure({
        code: 'PLAN_USAGE_STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to clear plan usage',
      });
    }
  }
}

export const planUsageRepository = new PlanUsageRepository();
