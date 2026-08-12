/**
 * App Providers
 *
 * Composes all global providers with proper nesting order.
 * Add new providers here as the app grows.
 */

import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { NetworkProvider } from './NetworkProvider';
import { assertValidConfig } from '@/config/ConfigService';

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
