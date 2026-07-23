/**
 * useNetworkStatus Hook
 *
 * Tracks network connectivity status.
 * Uses @react-native-community/netinfo if available, falls back to fetch-based check.
 */

import { useState, useEffect, useCallback } from 'react';

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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const online = response.ok;
      setIsConnected(online);
      return online;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // Try to use NetInfo if available
    let unsubscribe: (() => void) | null = null;

    const initNetInfo = async () => {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        unsubscribe = NetInfo.default.addEventListener((state) => {
          setIsConnected(state.isConnected ?? false);
          if (state.type === 'wifi') setConnectionType('wifi');
          else if (state.type === 'cellular') setConnectionType('cellular');
          else if (!state.isConnected) setConnectionType('none');
          else setConnectionType('unknown');
        });
      } catch {
        // NetInfo not available, use fetch-based check
        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
      }
    };

    initNetInfo();

    return () => {
      unsubscribe?.();
    };
  }, [checkConnection]);

  return { isConnected, connectionType, checkConnection };
}