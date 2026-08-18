import { z } from 'zod';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import { CustomerEntitlement, CustomerEntitlementSchema } from '../domain/Subscription';
import type { ISubscriptionEntitlementRepository } from './ISubscriptionEntitlementRepository';

export class SubscriptionEntitlementRepository implements ISubscriptionEntitlementRepository {
  public constructor(private readonly storage: ISecureStorageDataSource = secureStorage) {}

  public async get(): Promise<Result<CustomerEntitlement | null>> {
    try {
      const raw = await this.storage.getItem(secureStorageKeys.subscriptionEntitlement);
      if (!raw) {
        return success(null);
      }
      const parsed: unknown = JSON.parse(raw);
      return success(CustomerEntitlementSchema.parse(parsed));
    } catch (error) {
      let message = 'Failed to retrieve subscription entitlement';
      if (error instanceof z.ZodError) {
        message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      } else if (error instanceof Error) {
        message = error.message;
      }
      return failure({
        code: 'SUBSCRIPTION_STORAGE_ERROR',
        message,
      });
    }
  }

  public async save(entitlement: CustomerEntitlement): Promise<Result<CustomerEntitlement>> {
    try {
      const validated = CustomerEntitlementSchema.parse(entitlement);
      await this.storage.setItem(secureStorageKeys.subscriptionEntitlement, JSON.stringify(validated));
      return success(validated);
    } catch (error) {
      let message = 'Failed to save subscription entitlement';
      if (error instanceof z.ZodError) {
        message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      } else if (error instanceof Error) {
        message = error.message;
      }
      return failure({
        code: 'SUBSCRIPTION_STORAGE_ERROR',
        message,
      });
    }
  }

  public async clear(): Promise<Result<void>> {
    try {
      await this.storage.removeItem(secureStorageKeys.subscriptionEntitlement);
      return success(undefined);
    } catch (error) {
      return failure({
        code: 'SUBSCRIPTION_STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to clear subscription entitlement',
      });
    }
  }
}

export const subscriptionEntitlementRepository = new SubscriptionEntitlementRepository();
