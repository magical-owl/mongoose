/**
 * Query Provider
 *
 * Provides TanStack Query context to the application with sensible defaults.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { errorHandler } from '@/services/ErrorHandlerService';

const TAG = 'QueryProvider';

/**
 * Create a QueryClient with sensible defaults.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Singleton query client instance for app-wide use.
 */
export const queryClient = createQueryClient();

/**
 * Query provider component.
 */
export function QueryProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}