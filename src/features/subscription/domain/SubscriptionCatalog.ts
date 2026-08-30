import { APP_IDENTITY } from '@/config/appIdentity';
import type { SubscriptionPackage } from './Subscription';

// Default development package. Production billing can replace this catalog.
export const DEFAULT_SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pro_lifetime',
    productId: APP_IDENTITY.premiumLifetimeProductId,
    tier: 'pro_lifetime',
    title: APP_IDENTITY.premiumName,
    priceString: '$9.99 once',
    priceNumber: 9.99,
    period: 'lifetime',
    badge: 'ONE-TIME PAYMENT',
  },
];
