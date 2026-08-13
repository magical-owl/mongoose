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
   */
  public async purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>> {
    try {
      useSubscriptionStore.getState().setLoading(true);

      // Simulating native purchase transaction / RevenueCat purchase
      const newEntitlement: CustomerEntitlement = {
        isPro: true,
        activeTier: pkg.tier,
        expirationDate: pkg.period === 'lifetime' ? undefined : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        originalPurchaseDate: new Date().toISOString(),
        willRenew: pkg.period !== 'lifetime',
      };

      useSubscriptionStore.getState().setEntitlement(newEntitlement);
      useSubscriptionStore.getState().setLoading(false);

      return success(newEntitlement);
    } catch (error) {
      useSubscriptionStore.getState().setLoading(false);
      const message = error instanceof Error ? error.message : 'Purchase transaction failed';
      return failure({
        code: 'PURCHASE_FAILED',
        message,
      });
    }
  }

  /**
   * Restore Purchases (Mandatory for Apple Guideline 3.1.1 Compliance).
   * Restores active App Store purchases for users reinstalling or switching devices.
   */
  public async restorePurchases(): Promise<Result<CustomerEntitlement>> {
    try {
      useSubscriptionStore.getState().setLoading(true);

      // In production, calls Native StoreKit / RevenueCat.restorePurchases()
      const restoredEntitlement: CustomerEntitlement = useSubscriptionStore.getState().isPro
        ? {
            isPro: true,
            activeTier: useSubscriptionStore.getState().activeTier,
            expirationDate: useSubscriptionStore.getState().expirationDate,
            willRenew: true,
          }
        : {
            isPro: false,
            activeTier: 'free',
            willRenew: false,
          };

      useSubscriptionStore.getState().setEntitlement(restoredEntitlement);
      useSubscriptionStore.getState().setLoading(false);

      return success(restoredEntitlement);
    } catch (error) {
      useSubscriptionStore.getState().setLoading(false);
      const message = error instanceof Error ? error.message : 'Restore purchases failed';
      return failure({
        code: 'RESTORE_FAILED',
        message,
      });
    }
  }
}

export const subscriptionService = new SubscriptionService();
