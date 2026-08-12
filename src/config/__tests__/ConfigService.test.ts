import { createConfig, getConfigValidationErrors } from '../ConfigService';

describe('ConfigService', () => {
  it('requires a configured API URL outside development', () => {
    const config = createConfig({ appEnv: 'production' });

    expect(getConfigValidationErrors(config)).toContain(
      'EXPO_PUBLIC_API_BASE_URL is required outside development.'
    );
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
});
