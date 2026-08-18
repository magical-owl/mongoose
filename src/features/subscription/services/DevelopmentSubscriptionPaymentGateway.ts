import type { Result } from '@/shared/types/architecture';
import { success } from '@/shared/utils/result';
import type { CustomerEntitlement, SubscriptionPackage } from '../domain/Subscription';
import type { ISubscriptionPaymentGateway } from './ISubscriptionPaymentGateway';

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export class DevelopmentSubscriptionPaymentGateway implements ISubscriptionPaymentGateway {
  public async purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>> {
    const now = new Date();
    const expirationDate =
      pkg.period === 'month'
        ? addMonths(now, 1).toISOString()
        : pkg.period === 'year'
          ? addMonths(now, 12).toISOString()
          : undefined;

    return success({
      isPro: true,
      activeTier: pkg.tier,
      expirationDate,
      originalPurchaseDate: now.toISOString(),
      willRenew: pkg.period !== 'lifetime',
    });
  }

  public async restorePurchases(): Promise<Result<CustomerEntitlement | null>> {
    return success(null);
  }
}

export const developmentSubscriptionPaymentGateway = new DevelopmentSubscriptionPaymentGateway();
