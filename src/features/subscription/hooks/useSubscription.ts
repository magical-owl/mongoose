import { useSubscriptionStore } from '../../../stores/useSubscriptionStore';
import { subscriptionService } from '../services/SubscriptionService';
import { SubscriptionPackage } from '../domain/Subscription';

export function useSubscription() {
  const isPro = useSubscriptionStore((state) => state.isPro);
  const activeTier = useSubscriptionStore((state) => state.activeTier);
  const expirationDate = useSubscriptionStore((state) => state.expirationDate);
  const packages = useSubscriptionStore((state) => state.packages);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const error = useSubscriptionStore((state) => state.error);

  const purchasePackage = async (pkg: SubscriptionPackage) => {
    return await subscriptionService.purchasePackage(pkg);
  };

  const restorePurchases = async () => {
    return await subscriptionService.restorePurchases();
  };

  return {
    isPro,
    activeTier,
    expirationDate,
    packages,
    isLoading,
    error,
    purchasePackage,
    restorePurchases,
  };
}
