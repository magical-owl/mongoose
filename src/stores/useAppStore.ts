/**
 * App Store
 *
 * Global application state using Zustand.
 * Manages theme mode, onboarding status, and session state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSafeMMKV } from '@/database/mmkvSafe';
import type { ThemeMode } from '@/providers/ThemeProvider';

const storage = createSafeMMKV({ id: 'app-store' });

/**
 * Onboarding status.
 */
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Session state.
 */
export type SessionState = 'idle' | 'active' | 'expired';

/**
 * App state interface.
 */
export interface AppState {
  // State
  themeMode: ThemeMode;
  onboardingStatus: OnboardingStatus;
  sessionState: SessionState;
  isOnboarded: boolean;
  selectedCalendarDate: string | null;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  setSessionState: (state: SessionState) => void;
  setSelectedCalendarDate: (date: string | null) => void;
  reset: () => void;
}

const initialState: Pick<AppState, 'themeMode' | 'onboardingStatus' | 'sessionState' | 'isOnboarded' | 'selectedCalendarDate'> = {
  themeMode: 'dark',
  onboardingStatus: 'not_started',
  sessionState: 'idle',
  isOnboarded: false,
  selectedCalendarDate: null,
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

      setSelectedCalendarDate: (selectedCalendarDate: string | null) => set({ selectedCalendarDate }),

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
        onboardingStatus: state.onboardingStatus,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
