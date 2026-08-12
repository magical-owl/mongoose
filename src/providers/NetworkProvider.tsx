/**
 * Network Provider
 *
 * Keeps the offline operation queue aligned with the device connectivity state.
 */

import React, { useEffect } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { offlineService } from '@/services/OfflineService';
import { networkService } from '@/services/NetworkService';
import { useAppStore } from '@/stores/useAppStore';

export function NetworkProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    offlineService.setOnlineStatus(isConnected);
  }, [isConnected]);

  useEffect(() => {
    networkService.setSessionExpiredHandler(() => {
      useAppStore.getState().setSessionState('expired');
    });

    return () => networkService.setSessionExpiredHandler(null);
  }, []);

  return <>{children}</>;
}
