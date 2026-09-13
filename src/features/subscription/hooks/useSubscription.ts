import { useCallback, useEffect } from 'react';
import { releaseFeatures } from '@/config/releaseFeatures';
import { failure } from '@/shared/utils/result';
import { useSubscriptionStore } from '../../../stores/useSubscriptionStore';
import type { SubscriptionPackage } from '../domain/Subscription';

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
    if (!releaseFeatures.monetization) {
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    const initializeSubscription = async () => {
      const { subscriptionService } = await import('../services/SubscriptionService');
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
    if (!releaseFeatures.monetization) {
      return failure({ code: 'MONETIZATION_DISABLED', message: 'Monetization is disabled for this build.' });
    }

    setLoading(true);
    const { subscriptionService } = await import('../services/SubscriptionService');
    const result = await subscriptionService.purchasePackage(pkg);
    if (result.success) {
      setEntitlement(result.data);
    }
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setEntitlement, setError, setLoading]);

  const restorePurchases = useCallback(async () => {
    if (!releaseFeatures.monetization) {
      return failure({ code: 'MONETIZATION_DISABLED', message: 'Monetization is disabled for this build.' });
    }

    setLoading(true);
    const { subscriptionService } = await import('../services/SubscriptionService');
    const result = await subscriptionService.restorePurchases();
    if (result.success) {
      setEntitlement(result.data);
    }
    setError(result.success ? null : result.error.message);
    setLoading(false);
    return result;
  }, [setEntitlement, setError, setLoading]);

  const revertToFree = useCallback(async () => {
    if (!releaseFeatures.monetization) {
      return failure({ code: 'MONETIZATION_DISABLED', message: 'Monetization is disabled for this build.' });
    }

    setLoading(true);
    const { subscriptionService } = await import('../services/SubscriptionService');
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
