import type { Result } from '@/shared/types/architecture';
import type { CustomerEntitlement, SubscriptionPackage } from '../domain/Subscription';

export interface ISubscriptionPaymentGateway {
  getPackages?(fallbackPackages: readonly SubscriptionPackage[]): Promise<Result<SubscriptionPackage[]>>;
  getCurrentEntitlement?(): Promise<Result<CustomerEntitlement | null>>;
  purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>>;
  restorePurchases(): Promise<Result<CustomerEntitlement | null>>;
}
