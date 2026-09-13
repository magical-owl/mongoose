/**
 * App Providers
 *
 * Composes all global providers with proper nesting order.
 * Add new providers here as the app grows.
 *
 * NOTE: react-native-gesture-handler and react-native-reanimated require
 * native modules (worklet runtime, NitroModules) that are NOT available in
 * Expo Go. To use sticker pan/pinch gestures, run a development build:
 *   npx expo run:ios
 */

import React, { useEffect } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { NetworkProvider } from './NetworkProvider';
import { assertValidConfig } from '@/config/ConfigService';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { releaseFeatures } from '@/config/releaseFeatures';

/**
 * App providers composition.
 * Providers are nested from outermost to innermost.
 * The innermost provider wraps children closest.
 */
export function AppProviders({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  assertValidConfig();
  const setEntitlement = useSubscriptionStore((state) => state.setEntitlement);

  useEffect(() => {
    if (!releaseFeatures.monetization) return;

    const initializeSubscription = async () => {
      const { subscriptionService } = await import('@/features/subscription/services/SubscriptionService');
      const result = await subscriptionService.initialize();
      if (result.success) {
        setEntitlement(result.data);
      }
    };
    void initializeSubscription();
  }, [setEntitlement]);

  return (
    <ThemeProvider>
      <NetworkProvider>
        <QueryProvider>
          {children}
        </QueryProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}
