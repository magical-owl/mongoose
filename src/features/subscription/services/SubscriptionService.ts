import { success, failure } from '@shared/utils/result';
import type { Result } from '@shared/types/architecture';
import { CustomerEntitlement, SubscriptionPackage } from '../domain/Subscription';
import { useSubscriptionStore, DEFAULT_SUBSCRIPTION_PACKAGES } from '@stores/useSubscriptionStore';

export class SubscriptionService {
  /**
   * Initialize subscription service and load current active entitlement status.
   */
  public async initialize(): Promise<Result<CustomerEntitlement>> {
    try {
      // In production, sync with StoreKit / RevenueCat SDK here
      const currentEntitlement = useSubscriptionStore.getState();
      const entitlement: CustomerEntitlement = {
        isPro: currentEntitlement.isPro,
        activeTier: currentEntitlement.activeTier,
        expirationDate: currentEntitlement.expirationDate,
        willRenew: currentEntitlement.activeTier !== 'pro_lifetime',
      };

      useSubscriptionStore.getState().setEntitlement(entitlement);
      return success(entitlement);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize subscriptions';
      return failure({
        code: 'SUBSCRIPTION_ERROR',
        message,
      });
    }
  }

  /**
   * Fetch available packages (Monthly, Yearly, Lifetime).
   */
  public async getPackages(): Promise<Result<SubscriptionPackage[]>> {
    try {
      const packages = useSubscriptionStore.getState().packages;
      return success(packages.length > 0 ? packages : DEFAULT_SUBSCRIPTION_PACKAGES);
    } catch {
      return success(DEFAULT_SUBSCRIPTION_PACKAGES);
    }
  }

  /**
   * Purchase a subscription package (Monthly, Yearly, or Lifetime).
   * Native billing must be wired before this method can grant an entitlement.
   */
  public async purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>> {
    void pkg;
    return failure({
      code: 'PURCHASE_NOT_CONFIGURED',
      message: 'Purchases are unavailable until native App Store billing is configured.',
    });
  }

  /**
   * Restore Purchases (Mandatory for Apple Guideline 3.1.1 Compliance).
   * Restores active App Store purchases for users reinstalling or switching devices.
   * Native billing must be wired before this method can restore an entitlement.
   */
  public async restorePurchases(): Promise<Result<CustomerEntitlement>> {
    return failure({
      code: 'RESTORE_NOT_CONFIGURED',
      message: 'Restore is unavailable until native App Store billing is configured.',
    });
  }
}

export const subscriptionService = new SubscriptionService();
