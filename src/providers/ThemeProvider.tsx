/**
 * Theme Provider
 *
 * Provides theme context to the application.
 * Supports light and dark modes with automatic system detection.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { palette } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontSizes, fontWeights } from '@/theme/typography';
import { useAppStore } from '@/stores/useAppStore';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme colors for light and dark modes.
 */
export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly tint: string;
  readonly tabIconDefault: string;
  readonly tabIconSelected: string;
  readonly border: string;
  readonly borderLight: string;
  readonly error: string;
  readonly success: string;
  readonly warning: string;
  readonly info: string;
  readonly card: string;
  readonly overlay: string;
  readonly disabled: string;
  readonly disabledText: string;
  readonly inputBackground: string;
  readonly inputBorder: string;
}

/**
 * Full theme context value.
 */
export interface Theme {
  readonly mode: ThemeMode;
  readonly isDark: boolean;
  readonly colors: ThemeColors;
  readonly spacing: typeof spacing;
  readonly borderRadius: typeof borderRadius;
  readonly typography: typeof typography;
  readonly fontSizes: typeof fontSizes;
  readonly fontWeights: typeof fontWeights;
  /** Update the theme mode (light / dark / system). Persisted automatically. */
  readonly setThemeMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: palette.white,
  surface: palette.gray50,
  text: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  tint: palette.primary500,
  tabIconDefault: palette.gray400,
  tabIconSelected: palette.primary500,
  border: palette.gray200,
  borderLight: palette.gray100,
  error: palette.error500,
  success: palette.success500,
  warning: palette.warning500,
  info: palette.info500,
  card: palette.white,
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: palette.gray200,
  disabledText: palette.gray400,
  inputBackground: palette.gray50,
  inputBorder: palette.gray300,
};

const darkColors: ThemeColors = {
  background: palette.gray900,
  surface: palette.gray800,
  text: palette.gray50,
  textSecondary: palette.gray300,
  textTertiary: palette.gray500,
  tint: palette.primary300,
  tabIconDefault: palette.gray500,
  tabIconSelected: palette.primary300,
  border: palette.gray700,
  borderLight: palette.gray800,
  error: palette.error500,
  success: palette.success500,
  warning: palette.warning500,
  info: palette.info500,
  card: palette.gray800,
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: palette.gray700,
  disabledText: palette.gray500,
  inputBackground: palette.gray800,
  inputBorder: palette.gray600,
};

const ThemeContext = createContext<Theme | undefined>(undefined);

/**
 * Theme provider component.
 */
export function ThemeProvider({
  children,
  initialMode,
}: {
  readonly children: React.ReactNode;
  /** Test-only override for deterministic provider rendering. */
  readonly initialMode?: ThemeMode;
}): React.JSX.Element {
  const systemColorScheme = useColorScheme();
  const persistedMode = useAppStore((state) => state.themeMode);
  const persistThemeMode = useAppStore((state) => state.setThemeMode);
  const mode = initialMode ?? persistedMode ?? 'dark';
  const resolvedMode = mode === 'system' && systemColorScheme === 'dark'
    ? 'dark'
    : mode === 'light'
      ? 'light'
      : 'dark';

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    persistThemeMode(newMode);
  }, [persistThemeMode]);

  const theme = useMemo<Theme>(
    () => ({
      mode,
      isDark: resolvedMode === 'dark',
      colors: resolvedMode === 'dark' ? darkColors : lightColors,
      spacing,
      borderRadius,
      typography,
      fontSizes,
      fontWeights,
      setThemeMode,
    }),
    [mode, resolvedMode, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use the current theme.
 */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
