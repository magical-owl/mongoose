import { create } from 'zustand';
import { CustomerEntitlement, SubscriptionPackage, SubscriptionTier } from '../features/subscription/domain/Subscription';

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

// Default fallback packages if offline or testing
export const DEFAULT_SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pro_monthly',
    productId: 'meadow_pro_monthly',
    tier: 'pro_monthly',
    title: 'Pro Monthly',
    priceString: '$4.99 / month',
    priceNumber: 4.99,
    period: 'month',
  },
  {
    id: 'pro_yearly',
    productId: 'meadow_pro_yearly',
    tier: 'pro_yearly',
    title: 'Pro Annual',
    priceString: '$29.99 / year',
    priceNumber: 29.99,
    period: 'year',
    badge: 'BEST VALUE • SAVE 50%',
  },
  {
    id: 'pro_lifetime',
    productId: 'meadow_pro_lifetime',
    tier: 'pro_lifetime',
    title: 'Pro Lifetime',
    priceString: '$79.99 once',
    priceNumber: 79.99,
    period: 'lifetime',
    badge: 'PAY ONCE • OWN FOREVER',
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
