import { LoggingService, LogLevel } from '@/services/LoggingService';

describe('LoggingService', () => {
  let service: LoggingService;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('uses default configuration when no config is provided', () => {
      service = new LoggingService();
      service.debug('TestTag', 'debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('merges provided config with defaults', () => {
      service = new LoggingService({ minLevel: LogLevel.ERROR });
      service.debug('TestTag', 'should not appear');
      service.error('TestTag', 'should appear');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('configure', () => {
    it('updates configuration at runtime', () => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
      service.debug('TestTag', 'first');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);

      service.configure({ minLevel: LogLevel.ERROR });
      service.debug('TestTag', 'second');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('log levels', () => {
    it('logs debug messages at DEBUG level', () => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
      service.debug('Tag', 'debug');
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'debug',
        expect.any(String),
        ''
      );
    });

    it('logs info messages at INFO level', () => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
      service.info('Tag', 'info');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'info',
        expect.any(String),
        ''
      );
    });

    it('logs warn messages at WARN level', () => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
      service.warn('Tag', 'warning');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'warning',
        expect.any(String),
        ''
      );
    });

    it('logs error messages at ERROR level', () => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
      service.error('Tag', 'error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'error',
        expect.any(String),
        expect.any(String)
      );
    });

    it('does not log messages below the configured minimum level', () => {
      service = new LoggingService({ minLevel: LogLevel.WARN });
      service.debug('Tag', 'should not log');
      service.info('Tag', 'should not log');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('logs messages at or above the configured minimum level', () => {
      service = new LoggingService({ minLevel: LogLevel.WARN });
      service.warn('Tag', 'warning');
      service.error('Tag', 'error');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('PII redaction', () => {
    beforeEach(() => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
    });

    it('redacts keys matching the configured redactKeys list', () => {
      service.info('AuthTag', 'Login attempt', {
        email: 'user@example.com',
        password: 'supersecret',
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Login attempt',
        expect.stringContaining('[REDACTED]'),
        ''
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Login attempt',
        expect.not.stringContaining('user@example.com'),
        ''
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Login attempt',
        expect.not.stringContaining('supersecret'),
        ''
      );
    });

    it('redacts nested sensitive keys', () => {
      service.info('Test', 'Nested data', {
        user: {
          email: 'nested@example.com',
          profile: {
            ssn: '123-45-6789',
          },
        },
        token: 'abc123',
      });

      const callArgs = consoleInfoSpy.mock.calls[0];
      const dataArg = callArgs[2] as string;
      expect(dataArg).toContain('[REDACTED]');
      expect(dataArg).not.toContain('nested@example.com');
      expect(dataArg).not.toContain('123-45-6789');
      expect(dataArg).not.toContain('abc123');
    });

    it('does not redact non-sensitive keys', () => {
      service.info('Test', 'Safe data', {
        username: 'john_doe',
        age: 30,
        city: 'New York',
      });

      const callArgs = consoleInfoSpy.mock.calls[0];
      const dataArg = callArgs[2] as string;
      expect(dataArg).toContain('john_doe');
      expect(dataArg).toContain('30');
      expect(dataArg).toContain('New York');
    });

    it('redacts keys case-insensitively', () => {
      service.info('Test', 'Case test', {
        Email: 'mixed@example.com',
        TOKEN: 'xyz',
        Secret: 'value',
      });

      const callArgs = consoleInfoSpy.mock.calls[0];
      const dataArg = callArgs[2] as string;
      expect(dataArg).not.toContain('mixed@example.com');
      expect(dataArg).not.toContain('xyz');
      expect(dataArg).toContain('[REDACTED]');
    });

    it('handles null and non-object values gracefully', () => {
      service.info('Test', 'Edge cases', {
        nullValue: null,
        undefinedValue: undefined,
        numberValue: 42,
      });

      const callArgs = consoleInfoSpy.mock.calls[0];
      const dataArg = callArgs[2] as string;
      expect(dataArg).toContain('42');
    });
  });

  describe('error logging', () => {
    beforeEach(() => {
      service = new LoggingService({ minLevel: LogLevel.DEBUG });
    });

    it('includes error stack trace in ERROR level logs', () => {
      const error = new Error('Something broke');
      service.error('TestTag', 'An error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'An error occurred',
        expect.any(String),
        expect.stringContaining('Something broke')
      );
    });

    it('logs errors without additional data', () => {
      service.error('TestTag', 'Simple error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Simple error',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('console output control', () => {
    it('does not log to console when enableConsole is false', () => {
      service = new LoggingService({
        minLevel: LogLevel.DEBUG,
        enableConsole: false,
      });
      service.info('Tag', 'silent');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });
});
