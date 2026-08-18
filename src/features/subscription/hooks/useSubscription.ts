import { useCallback, useEffect } from 'react';
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
  const setLoading = useSubscriptionStore((state) => state.setLoading);
  const setError = useSubscriptionStore((state) => state.setError);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    void subscriptionService.initialize().then((result) => {
      if (!isMounted) return;
      setError(result.success ? null : result.error.message);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [setError, setLoading]);

  const purchasePackage = useCallback(async (pkg: SubscriptionPackage) => {
    setLoading(true);
    const result = await subscriptionService.purchasePackage(pkg);
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setError, setLoading]);

  const restorePurchases = useCallback(async () => {
    setLoading(true);
    const result = await subscriptionService.restorePurchases();
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setError, setLoading]);

  const revertToFree = useCallback(async () => {
    setLoading(true);
    const result = await subscriptionService.revertToFree();
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setError, setLoading]);

  return {
    isPro,
    activeTier,
    expirationDate,
    packages,
    isLoading,
    error,
    purchasePackage,
    restorePurchases,
    revertToFree,
  };
}
