/**
 * App State Hook
 *
 * Combines theme, app config, and app store into a single consumable hook.
 * This is the primary interface for screens to access app-level state.
 */

import { useTheme } from '@/providers/ThemeProvider';
import { useAppStore } from '@/stores/useAppStore';
import { config, type AppConfig } from '@/config/ConfigService';

/**
 * Combined app state for screens.
 */
export interface AppStateContext {
  readonly theme: ReturnType<typeof useTheme>;
  readonly store: ReturnType<typeof useAppStore>;
  readonly config: AppConfig;
}

/**
 * Hook that combines theme, config, and app store.
 */
export function useAppState(): AppStateContext {
  const theme = useTheme();
  const store = useAppStore();

  return {
    theme,
    store,
    config,
  };
}