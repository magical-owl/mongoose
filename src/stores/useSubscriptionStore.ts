import { create } from 'zustand';
import { CustomerEntitlement, SubscriptionPackage, SubscriptionTier } from '../features/subscription/domain/Subscription';
import { APP_IDENTITY } from '@/config/appIdentity';

interface SubscriptionStoreState {
  isPro: boolean;
  activeTier: SubscriptionTier;
  expirationDate?: string;
  packages: SubscriptionPackage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setEntitlement: (entitlement: CustomerEntitlement) => void;
  setPackages: (packages: SubscriptionPackage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

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

export const useSubscriptionStore = create<SubscriptionStoreState>((set) => ({
  isPro: false,
  activeTier: 'free',
  packages: DEFAULT_SUBSCRIPTION_PACKAGES,
  isLoading: false,
  error: null,

  setEntitlement: (entitlement) =>
    set({
      isPro: entitlement.isPro,
      activeTier: entitlement.activeTier,
      expirationDate: entitlement.expirationDate,
    }),

  setPackages: (packages) => set({ packages }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      isPro: false,
      activeTier: 'free',
      expirationDate: undefined,
      packages: DEFAULT_SUBSCRIPTION_PACKAGES,
      isLoading: false,
      error: null,
    }),
}));
