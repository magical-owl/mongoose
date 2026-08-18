import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import type { CustomerEntitlement, SubscriptionPackage } from '../domain/Subscription';
import type { ISubscriptionPaymentGateway } from './ISubscriptionPaymentGateway';

export class UnavailableSubscriptionPaymentGateway implements ISubscriptionPaymentGateway {
  public async purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>> {
    void pkg;
    return failure({
      code: 'PURCHASE_NOT_CONFIGURED',
      message: 'Purchases are unavailable until native App Store and Google Play billing is configured.',
    });
  }

  public async restorePurchases(): Promise<Result<CustomerEntitlement | null>> {
    return success(null);
  }
}

export const unavailableSubscriptionPaymentGateway = new UnavailableSubscriptionPaymentGateway();
