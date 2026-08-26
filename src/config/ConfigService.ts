/**
 * Configuration Service
 *
 * Client-visible configuration must use EXPO_PUBLIC_ variables. Never place
 * secrets in these values: Expo inlines them into the application bundle.
 */

import Constants from 'expo-constants';
import { APP_IDENTITY } from './appIdentity';

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  readonly env: AppEnvironment;
  readonly appName: string;
  readonly apiBaseUrl: string | null;
  readonly apiTimeout: number;
  readonly isDev: boolean;
  readonly isStaging: boolean;
  readonly isProd: boolean;
  readonly enableAnalytics: boolean;
  readonly enableCrashReporting: boolean;
  readonly remoteAiBaseUrl: string | null;
  readonly remoteAiZdrConfigured: boolean;
  readonly version: string;
  readonly buildNumber: string;
}

export interface RawAppConfig {
  readonly appEnv?: string;
  readonly appName?: string;
  readonly apiBaseUrl?: string;
  readonly apiTimeout?: string;
  readonly enableAnalytics?: string;
  readonly enableCrashReporting?: string;
  readonly remoteAiBaseUrl?: string;
  readonly remoteAiZdrConfigured?: string;
}

function getEnvironment(value?: string): AppEnvironment {
  if (value === 'production' || value === 'staging') {
    return value;
  }
  return 'development';
}

function parseTimeout(value?: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
}

function normalizeUrl(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, '') : null;
}

/** Build typed app configuration from a raw environment source. */
export function createConfig(raw: RawAppConfig): AppConfig {
  const env = getEnvironment(raw.appEnv);
  return {
    env,
    appName: raw.appName?.trim() || APP_IDENTITY.codename,
    apiBaseUrl: normalizeUrl(raw.apiBaseUrl),
    apiTimeout: parseTimeout(raw.apiTimeout),
    isDev: env === 'development',
    isStaging: env === 'staging',
    isProd: env === 'production',
    enableAnalytics: raw.enableAnalytics === 'true',
    enableCrashReporting: raw.enableCrashReporting === 'true',
    remoteAiBaseUrl: normalizeUrl(raw.remoteAiBaseUrl),
    remoteAiZdrConfigured: raw.remoteAiZdrConfigured === 'true',
    version: Constants.expoConfig?.version ?? '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber ?? '1',
  };
}

export function getConfigValidationErrors(appConfig: AppConfig): string[] {
  const errors: string[] = [];
  if (!appConfig.isDev && !appConfig.apiBaseUrl) {
    errors.push('EXPO_PUBLIC_API_BASE_URL is required outside development.');
  }
  if (appConfig.apiBaseUrl) {
    try {
      const url = new URL(appConfig.apiBaseUrl);
      if (url.protocol !== 'https:' && !(appConfig.isDev && url.protocol === 'http:')) {
        errors.push('EXPO_PUBLIC_API_BASE_URL must use HTTPS outside development.');
      }
    } catch {
      errors.push('EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.');
    }
  }
  if (appConfig.remoteAiBaseUrl && !appConfig.remoteAiBaseUrl.startsWith('https://')) {
    errors.push('EXPO_PUBLIC_REMOTE_AI_BASE_URL must use HTTPS.');
  }
  if (appConfig.remoteAiBaseUrl && !appConfig.remoteAiZdrConfigured) {
    errors.push('EXPO_PUBLIC_REMOTE_AI_ZDR must be true when EXPO_PUBLIC_REMOTE_AI_BASE_URL is configured.');
  }
  if (appConfig.apiTimeout < 1000 || appConfig.apiTimeout > 120000) {
    errors.push('EXPO_PUBLIC_API_TIMEOUT must be between 1000 and 120000 milliseconds.');
  }
  return errors;
}

export function assertValidConfig(appConfig: AppConfig = config): void {
  const errors = getConfigValidationErrors(appConfig);
  if (errors.length > 0) {
    throw new Error(`Invalid application configuration: ${errors.join(' ')}`);
  }
}

export const config = createConfig({
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
  appName: process.env.EXPO_PUBLIC_APP_NAME,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  apiTimeout: process.env.EXPO_PUBLIC_API_TIMEOUT,
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS,
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING,
  remoteAiBaseUrl: process.env.EXPO_PUBLIC_REMOTE_AI_BASE_URL,
  remoteAiZdrConfigured: process.env.EXPO_PUBLIC_REMOTE_AI_ZDR,
});

export function getConfig(): AppConfig {
  return config;
}
