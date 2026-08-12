/**
 * useNetworkStatus Hook
 *
 * Tracks network connectivity status.
 * Uses @react-native-community/netinfo if available, falls back to fetch-based check.
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface NetworkStatus {
  readonly isConnected: boolean;
  readonly connectionType: ConnectionType;
  readonly checkConnection: () => Promise<boolean>;
}

/**
 * Hook that provides network connectivity status.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<ConnectionType>('unknown');

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    const online = state.isConnected === true && state.isInternetReachable !== false;
    setIsConnected(online);
    return online;
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsConnected(online);
      if (state.type === 'wifi') setConnectionType('wifi');
      else if (state.type === 'cellular') setConnectionType('cellular');
      else if (!online) setConnectionType('none');
      else setConnectionType('unknown');
    });

    return unsubscribe;
  }, []);

  return { isConnected, connectionType, checkConnection };
}
