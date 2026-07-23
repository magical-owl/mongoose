/**
 * Configuration Service
 *
 * Provides typed access to application configuration.
 * Reads from environment variables and provides compile-time type safety.
 */

import Constants from 'expo-constants';

/**
 * Application environment.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Application configuration type.
 */
export interface AppConfig {
  readonly env: AppEnvironment;
  readonly appName: string;
  readonly apiBaseUrl: string;
  readonly apiTimeout: number;
  readonly isDev: boolean;
  readonly isStaging: boolean;
  readonly isProd: boolean;
  readonly enableAnalytics: boolean;
  readonly enableCrashReporting: boolean;
  readonly version: string;
  readonly buildNumber: string;
}

/**
 * Get the current environment from the app config.
 */
function getEnvironment(): AppEnvironment {
  // In EAS Build, this comes from eas.json env
  // In development, this defaults to development
  const env = process.env.APP_ENV ?? 'development';

  if (env === 'production' || env === 'staging') {
    return env;
  }

  return 'development';
}

/**
 * Create the application configuration.
 */
function createConfig(): AppConfig {
  const env = getEnvironment();

  return {
    env,
    appName: process.env.APP_NAME ?? 'Meadow',
    apiBaseUrl: process.env.API_BASE_URL ?? 'https://api.example.com',
    apiTimeout: Number(process.env.API_TIMEOUT) || 30000,
    isDev: env === 'development',
    isStaging: env === 'staging',
    isProd: env === 'production',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableCrashReporting: process.env.ENABLE_CRASH_REPORTING === 'true',
    version: Constants.expoConfig?.version ?? '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber ?? '1',
  };
}

/**
 * Singleton configuration instance.
 */
export const config = createConfig();

/**
 * Get a configuration value with type safety.
 */
export function getConfig(): AppConfig {
  return config;
}