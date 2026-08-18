import type { Result } from '@/shared/types/architecture';
import type { CustomerEntitlement } from '../domain/Subscription';

export interface ISubscriptionEntitlementRepository {
  get(): Promise<Result<CustomerEntitlement | null>>;
  save(entitlement: CustomerEntitlement): Promise<Result<CustomerEntitlement>>;
  clear(): Promise<Result<void>>;
}
