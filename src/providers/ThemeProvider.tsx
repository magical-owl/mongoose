/**
 * Theme Provider
 *
 * Provides theme context to the application.
 * Supports light and dark modes with automatic system detection.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { palette } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontSizes, fontWeights } from '@/theme/typography';
import { useAppStore } from '@/stores/useAppStore';
import { accentColors, type AccentColor } from '@/theme/accents';
import type { FontFamily, FontScale } from '@/stores/useAppStore';

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
  readonly accentColor: AccentColor;
  readonly isDark: boolean;
  readonly colors: ThemeColors;
  readonly spacing: typeof spacing;
  readonly borderRadius: typeof borderRadius;
  readonly typography: typeof typography;
  readonly fontSizes: { [K in keyof typeof fontSizes]: number };
  readonly fontWeights: typeof fontWeights;
  readonly fontFamily: string;
  /** Update the theme mode (light / dark / system). Persisted automatically. */
  readonly setThemeMode: (mode: ThemeMode) => void;
  readonly setAccentColor: (color: AccentColor) => void;
}

function getFontScale(scale: FontScale): number {
  if (scale === 'small') return 0.9;
  if (scale === 'large') return 1.15;
  return 1;
}

function getFontFamily(family: FontFamily): string {
  if (family === 'serif') return Platform.OS === 'ios' ? 'Times New Roman' : 'serif';
  if (family === 'monospace') return Platform.OS === 'ios' ? 'Courier New' : 'monospace';
  return Platform.OS === 'ios' ? 'System' : 'sans-serif';
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
  const accentColor = useAppStore((state) => state.accentColor);
  const persistAccentColor = useAppStore((state) => state.setAccentColor);
  const fontScalePreference = useAppStore((state) => state.fontScale);
  const fontFamilyPreference = useAppStore((state) => state.fontFamily);
  const mode = initialMode ?? persistedMode ?? 'dark';
  const resolvedMode = mode === 'system' && systemColorScheme === 'dark'
    ? 'dark'
    : mode === 'light'
      ? 'light'
      : 'dark';
  const selectedAccent = accentColors[accentColor] ?? accentColors.blue;
  const fontScale = getFontScale(fontScalePreference);
  const fontFamily = getFontFamily(fontFamilyPreference);
  const scaledFontSizes = useMemo(() => ({
    xs: fontSizes.xs * fontScale,
    sm: fontSizes.sm * fontScale,
    base: fontSizes.base * fontScale,
    lg: fontSizes.lg * fontScale,
    xl: fontSizes.xl * fontScale,
    xxl: fontSizes.xxl * fontScale,
    xxxl: fontSizes.xxxl * fontScale,
    huge: fontSizes.huge * fontScale,
    massive: fontSizes.massive * fontScale,
  }), [fontScale]);
  const scaledTypography = useMemo(() => Object.fromEntries(
    Object.entries(typography).map(([key, style]) => [key, {
      ...style,
      ...(typeof style.fontSize === 'number' ? { fontSize: style.fontSize * fontScale } : {}),
      ...(typeof style.lineHeight === 'number' ? { lineHeight: style.lineHeight * fontScale } : {}),
    }]),
  ), [fontScale]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    persistThemeMode(newMode);
  }, [persistThemeMode]);
  const setAccentColor = useCallback((newColor: AccentColor) => {
    persistAccentColor(newColor);
  }, [persistAccentColor]);

  const theme = useMemo<Theme>(
    () => ({
      mode,
        accentColor: accentColors[accentColor] ? accentColor : 'blue',
      isDark: resolvedMode === 'dark',
      colors: {
        ...(resolvedMode === 'dark' ? darkColors : lightColors),
        tint: selectedAccent[resolvedMode],
        tabIconSelected: selectedAccent[resolvedMode],
      },
      spacing,
      borderRadius,
      typography: scaledTypography,
      fontSizes: scaledFontSizes,
      fontWeights,
      fontFamily,
      setThemeMode,
      setAccentColor,
    }),
    [mode, resolvedMode, accentColor, selectedAccent, scaledTypography, scaledFontSizes, fontFamily, setThemeMode, setAccentColor]
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
