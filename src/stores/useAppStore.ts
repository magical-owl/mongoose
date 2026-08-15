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
export type FontScale = 'small' | 'default' | 'large';
export type FontFamily = 'system' | 'serif' | 'monospace';

/**
 * App state interface.
 */
export interface AppState {
  // State
  themeMode: ThemeMode;
  accentColor: AccentColor;
  onboardingStatus: OnboardingStatus;
  sessionState: SessionState;
  isOnboarded: boolean;
  selectedCalendarDate: string | null;
  selectedCompanion: CompanionType;
  biometricLockEnabled: boolean;
  isLocked: boolean;
  remoteAiConsent: boolean;
  calendarDateFormat: CalendarDateFormat;
  calendarFirstDay: 0 | 1;
  fontScale: FontScale;
  fontFamily: FontFamily;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  setSessionState: (state: SessionState) => void;
  setSelectedCalendarDate: (date: string | null) => void;
  setSelectedCompanion: (companion: CompanionType) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setLocked: (locked: boolean) => void;
  setRemoteAiConsent: (consent: boolean) => void;
  setCalendarDateFormat: (format: CalendarDateFormat) => void;
  setCalendarFirstDay: (day: 0 | 1) => void;
  setFontScale: (scale: FontScale) => void;
  setFontFamily: (family: FontFamily) => void;
  reset: () => void;
}

const initialState: Pick<
  AppState,
  | 'themeMode'
  | 'accentColor'
  | 'onboardingStatus'
  | 'sessionState'
  | 'isOnboarded'
  | 'selectedCalendarDate'
  | 'selectedCompanion'
  | 'biometricLockEnabled'
  | 'isLocked'
  | 'remoteAiConsent'
  | 'calendarDateFormat'
  | 'calendarFirstDay'
  | 'fontScale'
  | 'fontFamily'
> = {
  themeMode: 'dark',
  accentColor: 'blue',
  onboardingStatus: 'not_started',
  sessionState: 'idle',
  isOnboarded: false,
  selectedCalendarDate: null,
  selectedCompanion: 'cat',
  biometricLockEnabled: false,
  isLocked: false,
  remoteAiConsent: false,
  calendarDateFormat: 'month-day-year',
  calendarFirstDay: 0,
  fontScale: 'default',
  fontFamily: 'system',
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

      setSelectedCalendarDate: (selectedCalendarDate: string | null) => set({ selectedCalendarDate }),

      setSelectedCompanion: (selectedCompanion: CompanionType) => set({ selectedCompanion }),

      setBiometricLockEnabled: (biometricLockEnabled: boolean) => set({ biometricLockEnabled }),

      setLocked: (isLocked: boolean) => set({ isLocked }),

      setRemoteAiConsent: (remoteAiConsent: boolean) => set({ remoteAiConsent }),

      setCalendarDateFormat: (calendarDateFormat: CalendarDateFormat) => set({ calendarDateFormat }),
      setCalendarFirstDay: (calendarFirstDay: 0 | 1) => set({ calendarFirstDay }),
      setFontScale: (fontScale: FontScale) => set({ fontScale }),
      setFontFamily: (fontFamily: FontFamily) => set({ fontFamily }),

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
        onboardingStatus: state.onboardingStatus,
        isOnboarded: state.isOnboarded,
        selectedCompanion: state.selectedCompanion,
        biometricLockEnabled: state.biometricLockEnabled,
        remoteAiConsent: state.remoteAiConsent,
        calendarDateFormat: state.calendarDateFormat,
        calendarFirstDay: state.calendarFirstDay,
        fontScale: state.fontScale,
        fontFamily: state.fontFamily,
      }),
    }
  )
);
