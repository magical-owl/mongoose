import { createConfig, getConfigValidationErrors } from '../ConfigService';

describe('ConfigService', () => {
  it('allows local-first production builds without a general API URL', () => {
    const config = createConfig({ appEnv: 'production' });

    expect(getConfigValidationErrors(config)).toEqual([]);
    expect(config.apiBaseUrl).toBeNull();
  });

  it('rejects insecure API URLs outside development', () => {
    const config = createConfig({
      appEnv: 'staging',
      apiBaseUrl: 'http://api.meadow.example',
    });

    expect(getConfigValidationErrors(config)).toContain(
      'EXPO_PUBLIC_API_BASE_URL must use HTTPS outside development.'
    );
  });

  it('normalizes valid public configuration', () => {
    const config = createConfig({
      appEnv: 'production',
      apiBaseUrl: 'https://api.meadow.example/',
      apiTimeout: '15000',
      enableAnalytics: 'true',
    });

    expect(getConfigValidationErrors(config)).toEqual([]);
    expect(config.apiBaseUrl).toBe('https://api.meadow.example');
    expect(config.apiTimeout).toBe(15000);
    expect(config.enableAnalytics).toBe(true);
  });

  it('requires ZDR confirmation when remote AI is configured', () => {
    const config = createConfig({
      appEnv: 'production',
      apiBaseUrl: 'https://api.meadow.example',
      remoteAiBaseUrl: 'https://ai.meadow.example',
    });

    expect(getConfigValidationErrors(config)).toContain(
      'EXPO_PUBLIC_REMOTE_AI_ZDR must be true when EXPO_PUBLIC_REMOTE_AI_BASE_URL is configured.'
    );
  });

  it('accepts remote AI only when ZDR is confirmed', () => {
    const config = createConfig({
      appEnv: 'production',
      apiBaseUrl: 'https://api.meadow.example',
      remoteAiBaseUrl: 'https://ai.meadow.example',
      remoteAiZdrConfigured: 'true',
    });

    expect(getConfigValidationErrors(config)).toEqual([]);
  });
});
