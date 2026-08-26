#!/usr/bin/env node

const allowedEnvironments = new Set(['development', 'staging', 'production']);
const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const remoteAiBaseUrl = process.env.EXPO_PUBLIC_REMOTE_AI_BASE_URL;
const apiTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT;

const errors = [];

if (!allowedEnvironments.has(appEnv)) {
  errors.push('EXPO_PUBLIC_APP_ENV must be one of: development, staging, production.');
}

const isDevelopment = appEnv === 'development';

if (!isDevelopment && !apiBaseUrl) {
  errors.push('EXPO_PUBLIC_API_BASE_URL is required outside development.');
}

if (apiBaseUrl) {
  validateUrl('EXPO_PUBLIC_API_BASE_URL', apiBaseUrl, { allowDevelopmentHttp: isDevelopment });
}

if (remoteAiBaseUrl) {
  validateUrl('EXPO_PUBLIC_REMOTE_AI_BASE_URL', remoteAiBaseUrl, { allowDevelopmentHttp: false });
  if (process.env.EXPO_PUBLIC_REMOTE_AI_ZDR !== 'true') {
    errors.push('EXPO_PUBLIC_REMOTE_AI_ZDR must be true when EXPO_PUBLIC_REMOTE_AI_BASE_URL is configured.');
  }
}

if (apiTimeout) {
  const parsedTimeout = Number(apiTimeout);
  if (!Number.isFinite(parsedTimeout) || parsedTimeout < 1000 || parsedTimeout > 120000) {
    errors.push('EXPO_PUBLIC_API_TIMEOUT must be between 1000 and 120000 milliseconds.');
  }
}

if (errors.length > 0) {
  console.error(`Invalid ${appEnv} configuration:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`${appEnv} configuration OK`);

function validateUrl(name, value, options) {
  try {
    const url = new URL(value);
    const isAllowedDevelopmentHttp = options.allowDevelopmentHttp && url.protocol === 'http:';
    if (url.protocol !== 'https:' && !isAllowedDevelopmentHttp) {
      errors.push(`${name} must use HTTPS outside development.`);
    }
  } catch {
    errors.push(`${name} must be a valid absolute URL.`);
  }
}
