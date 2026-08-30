import { success, failure } from '@shared/utils/result';
import type { Result } from '@shared/types/architecture';
import { CustomerEntitlement, SubscriptionPackage } from '../domain/Subscription';
import { DEFAULT_SUBSCRIPTION_PACKAGES } from '../domain/SubscriptionCatalog';
import type { ISubscriptionPaymentGateway } from './ISubscriptionPaymentGateway';
import { developmentSubscriptionPaymentGateway } from './DevelopmentSubscriptionPaymentGateway';
import type { ISubscriptionEntitlementRepository } from '../repositories/ISubscriptionEntitlementRepository';
import { subscriptionEntitlementRepository } from '../repositories/SubscriptionEntitlementRepository';
import { config } from '@/config/ConfigService';
import { nativeSubscriptionPaymentGateway } from './NativeSubscriptionPaymentGateway';

export function getDefaultSubscriptionPaymentGateway(): ISubscriptionPaymentGateway {
  return config.isDev ? developmentSubscriptionPaymentGateway : nativeSubscriptionPaymentGateway;
}

export class SubscriptionService {
  public constructor(
    private readonly paymentGateway: ISubscriptionPaymentGateway = getDefaultSubscriptionPaymentGateway(),
    private readonly entitlementRepository: ISubscriptionEntitlementRepository = subscriptionEntitlementRepository
  ) {}

  /**
   * Initialize subscription service and load current active entitlement status.
   */
  public async initialize(): Promise<Result<CustomerEntitlement>> {
    try {
      if (this.paymentGateway.getCurrentEntitlement) {
        const currentEntitlementResult = await this.paymentGateway.getCurrentEntitlement();
        if (!currentEntitlementResult.success) {
          return currentEntitlementResult;
        }

        if (currentEntitlementResult.data) {
          const saveResult = await this.entitlementRepository.save(currentEntitlementResult.data);
          if (!saveResult.success) {
            return saveResult;
          }

          return success(saveResult.data);
        }

        const clearResult = await this.entitlementRepository.clear();
        if (!clearResult.success) {
          return clearResult;
        }

        const freeEntitlement = createFreeEntitlement();
        return success(freeEntitlement);
      }

      const storedEntitlementResult = await this.entitlementRepository.get();
      if (!storedEntitlementResult.success) {
        return storedEntitlementResult;
      }

      const entitlement: CustomerEntitlement = storedEntitlementResult.data ?? createFreeEntitlement();

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
      if (this.paymentGateway.getPackages) {
        return await this.paymentGateway.getPackages(DEFAULT_SUBSCRIPTION_PACKAGES);
      }
      return success(DEFAULT_SUBSCRIPTION_PACKAGES);
    } catch {
      return success(DEFAULT_SUBSCRIPTION_PACKAGES);
    }
  }

  /**
   * Purchase a subscription package (Monthly, Yearly, or Lifetime).
   * Development builds use a local gateway. Production uses native StoreKit /
   * Google Play Billing through the configured gateway.
   */
  public async purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>> {
    const purchaseResult = await this.paymentGateway.purchasePackage(pkg);
    if (!purchaseResult.success) {
      return purchaseResult;
    }

    const saveResult = await this.entitlementRepository.save(purchaseResult.data);
    if (!saveResult.success) {
      return saveResult;
    }

    return success(saveResult.data);
  }

  /**
   * Restore Purchases (Mandatory for Apple Guideline 3.1.1 Compliance).
   * Restores active App Store purchases for users reinstalling or switching devices.
   * In development, falls back to the locally saved entitlement.
   */
  public async restorePurchases(): Promise<Result<CustomerEntitlement>> {
    const gatewayResult = await this.paymentGateway.restorePurchases();
    if (!gatewayResult.success) {
      return gatewayResult;
    }

    const entitlementResult = gatewayResult.data
      ? success(gatewayResult.data)
      : await this.entitlementRepository.get();

    if (!entitlementResult.success) {
      return entitlementResult;
    }

    if (!entitlementResult.data) {
      return failure({
        code: 'NO_PURCHASES_TO_RESTORE',
        message: 'No active premium purchase was found to restore.',
      });
    }

    return success(entitlementResult.data);
  }

  /**
   * Development helper for testing free-tier limits without deleting diary data.
   * Production billing should not expose this path.
   */
  public async revertToFree(): Promise<Result<CustomerEntitlement>> {
    const clearResult = await this.entitlementRepository.clear();
    if (!clearResult.success) {
      return clearResult;
    }

    const entitlement: CustomerEntitlement = {
      isPro: false,
      activeTier: 'free',
      willRenew: false,
    };

    return success(entitlement);
  }
}

export const subscriptionService = new SubscriptionService();

function createFreeEntitlement(): CustomerEntitlement {
  return {
    isPro: false,
    activeTier: 'free',
    willRenew: false,
  };
}
