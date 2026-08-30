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
  const setEntitlement = useSubscriptionStore((state) => state.setEntitlement);
  const setPackages = useSubscriptionStore((state) => state.setPackages);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const initializeSubscription = async () => {
      const entitlementResult = await subscriptionService.initialize();
      if (!isMounted) return;
      if (!entitlementResult.success) {
        setError(entitlementResult.error.message);
        setLoading(false);
        return;
      }
      setEntitlement(entitlementResult.data);

      const packageResult = await subscriptionService.getPackages();
      if (!isMounted) return;
      if (packageResult.success) {
        setPackages(packageResult.data);
      }
      setError(packageResult.success ? null : packageResult.error.message);
      setLoading(false);
    };
    void initializeSubscription();
    return () => {
      isMounted = false;
    };
  }, [setEntitlement, setError, setLoading, setPackages]);

  const purchasePackage = useCallback(async (pkg: SubscriptionPackage) => {
    setLoading(true);
    const result = await subscriptionService.purchasePackage(pkg);
    if (result.success) {
      setEntitlement(result.data);
    }
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setEntitlement, setError, setLoading]);

  const restorePurchases = useCallback(async () => {
    setLoading(true);
    const result = await subscriptionService.restorePurchases();
    if (result.success) {
      setEntitlement(result.data);
    }
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setEntitlement, setError, setLoading]);

  const revertToFree = useCallback(async () => {
    setLoading(true);
    const result = await subscriptionService.revertToFree();
    if (result.success) {
      setEntitlement(result.data);
    }
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setEntitlement, setError, setLoading]);

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
