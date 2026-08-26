/**
 * App Store
 *
 * Global application state using Zustand.
 * Manages theme mode, onboarding status, session state, and companion preference.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSafeMMKV } from '@/database/mmkvSafe';
import type { ThemeMode } from '@/providers/ThemeProvider';
import type { CompanionType } from '@/features/diary/domain/Companion';
import type { AccentColor } from '@/theme/accents';
import type { ColorTheme } from '@/theme/colorThemes';
import type { AppFontFamily } from '@/theme/fonts';

const storage = createSafeMMKV({ id: 'app-store' });

/**
 * Onboarding status.
 */
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Session state.
 */
export type SessionState = 'idle' | 'active' | 'expired';

export type CalendarDateFormat = 'month-day-year' | 'day-month-year' | 'year-month-day';
export type TimeFormat = '24-hour' | '12-hour';
export type FontScale = 'small' | 'default' | 'large';
export type FontFamily = AppFontFamily;
export type HomeViewMode = 'detailed' | 'timeline' | 'feed';
export type EntryHierarchyMode = 'year-month-date' | 'month-date' | 'date' | 'none';
export type AppLanguage = 'en' | 'ja' | 'zh' | 'de' | 'fr';

/**
 * App state interface.
 */
export interface AppState {
  // State
  themeMode: ThemeMode;
  accentColor: AccentColor;
  colorTheme: ColorTheme;
  onboardingStatus: OnboardingStatus;
  sessionState: SessionState;
  isOnboarded: boolean;
  selectedCalendarDate: string | null;
  selectedCompanion: CompanionType;
  biometricLockEnabled: boolean;
  isLocked: boolean;
  remoteAiConsent: boolean;
  calendarDateFormat: CalendarDateFormat;
  timeFormat: TimeFormat;
  calendarFirstDay: 0 | 1;
  fontScale: FontScale;
  fontFamily: FontFamily;
  homeViewModes: Record<HomeViewMode, boolean>;
  homeViewMode: HomeViewMode;
  entryHierarchyMode: EntryHierarchyMode;
  appLanguage: AppLanguage;
  premiumOnboardingPromptShown: boolean;
  premiumPromptDismissedAt: string | null;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  setSessionState: (state: SessionState) => void;
  setSelectedCalendarDate: (date: string | null) => void;
  setSelectedCompanion: (companion: CompanionType) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setLocked: (locked: boolean) => void;
  setRemoteAiConsent: (consent: boolean) => void;
  setCalendarDateFormat: (format: CalendarDateFormat) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setCalendarFirstDay: (day: 0 | 1) => void;
  setFontScale: (scale: FontScale) => void;
  setFontFamily: (family: FontFamily) => void;
  setHomeViewModeEnabled: (mode: HomeViewMode, enabled: boolean) => void;
  setHomeViewMode: (mode: HomeViewMode) => void;
  setEntryHierarchyMode: (mode: EntryHierarchyMode) => void;
  setAppLanguage: (language: AppLanguage) => void;
  markPremiumOnboardingPromptShown: (shownAt: string) => void;
  markPremiumPromptDismissed: (dismissedAt: string) => void;
  reset: () => void;
}

const initialState: Pick<
  AppState,
  | 'themeMode'
  | 'accentColor'
  | 'colorTheme'
  | 'onboardingStatus'
  | 'sessionState'
  | 'isOnboarded'
  | 'selectedCalendarDate'
  | 'selectedCompanion'
  | 'biometricLockEnabled'
  | 'isLocked'
  | 'remoteAiConsent'
  | 'calendarDateFormat'
  | 'timeFormat'
  | 'calendarFirstDay'
  | 'fontScale'
  | 'fontFamily'
  | 'homeViewModes'
  | 'homeViewMode'
  | 'entryHierarchyMode'
  | 'appLanguage'
  | 'premiumOnboardingPromptShown'
  | 'premiumPromptDismissedAt'
> = {
  themeMode: 'dark',
  accentColor: 'blue',
  colorTheme: 'default',
  onboardingStatus: 'not_started',
  sessionState: 'idle',
  isOnboarded: false,
  selectedCalendarDate: null,
  selectedCompanion: 'cat',
  biometricLockEnabled: false,
  isLocked: false,
  remoteAiConsent: false,
  calendarDateFormat: 'month-day-year',
  timeFormat: '24-hour',
  calendarFirstDay: 0,
  fontScale: 'default',
  fontFamily: 'system',
  homeViewModes: { detailed: true, timeline: true, feed: true },
  homeViewMode: 'timeline',
  entryHierarchyMode: 'year-month-date',
  appLanguage: 'en',
  premiumOnboardingPromptShown: false,
  premiumPromptDismissedAt: null,
};

/**
 * Zustand store for global app state.
 * Persisted to MMKV for offline availability.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
      setAccentColor: (accentColor: AccentColor) => set({ accentColor }),
      setColorTheme: (colorTheme: ColorTheme) => set({ colorTheme }),

      setSelectedCalendarDate: (selectedCalendarDate: string | null) => set({ selectedCalendarDate }),

      setSelectedCompanion: (selectedCompanion: CompanionType) => set({ selectedCompanion }),

      setBiometricLockEnabled: (biometricLockEnabled: boolean) => set({ biometricLockEnabled }),

      setLocked: (isLocked: boolean) => set({ isLocked }),

      setRemoteAiConsent: (remoteAiConsent: boolean) => set({ remoteAiConsent }),

      setCalendarDateFormat: (calendarDateFormat: CalendarDateFormat) => set({ calendarDateFormat }),
      setTimeFormat: (timeFormat: TimeFormat) => set({ timeFormat }),
      setCalendarFirstDay: (calendarFirstDay: 0 | 1) => set({ calendarFirstDay }),
      setFontScale: (fontScale: FontScale) => set({ fontScale }),
      setFontFamily: (fontFamily: FontFamily) => set({ fontFamily }),
      setHomeViewModeEnabled: (mode: HomeViewMode, enabled: boolean) => set((state) => ({
        homeViewModes: { ...state.homeViewModes, [mode]: enabled },
      })),
      setHomeViewMode: (homeViewMode: HomeViewMode) => set({ homeViewMode }),
      setEntryHierarchyMode: (entryHierarchyMode: EntryHierarchyMode) => set({ entryHierarchyMode }),
      setAppLanguage: (appLanguage: AppLanguage) => set({ appLanguage }),
      markPremiumOnboardingPromptShown: (shownAt: string) => set({
        premiumOnboardingPromptShown: true,
        premiumPromptDismissedAt: shownAt,
      }),
      markPremiumPromptDismissed: (dismissedAt: string) => set({ premiumPromptDismissedAt: dismissedAt }),

      setOnboardingStatus: (onboardingStatus: OnboardingStatus) =>
        set({
          onboardingStatus,
          isOnboarded: onboardingStatus === 'completed',
        }),

      setSessionState: (sessionState: SessionState) => set({ sessionState }),

      reset: () => set(initialState),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => ({
        getItem: (key: string) => storage.getString(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.remove(key),
      })),
      partialize: (state) => ({
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        colorTheme: state.colorTheme,
        onboardingStatus: state.onboardingStatus,
        isOnboarded: state.isOnboarded,
        selectedCompanion: state.selectedCompanion,
        biometricLockEnabled: state.biometricLockEnabled,
        remoteAiConsent: state.remoteAiConsent,
        calendarDateFormat: state.calendarDateFormat,
        timeFormat: state.timeFormat,
        calendarFirstDay: state.calendarFirstDay,
        fontScale: state.fontScale,
        fontFamily: state.fontFamily,
        homeViewModes: state.homeViewModes,
        homeViewMode: state.homeViewMode,
        entryHierarchyMode: state.entryHierarchyMode,
        appLanguage: state.appLanguage,
        premiumOnboardingPromptShown: state.premiumOnboardingPromptShown,
        premiumPromptDismissedAt: state.premiumPromptDismissedAt,
      }),
    }
  )
);
