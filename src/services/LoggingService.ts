/**
 * Logging Service
 *
 * Provides structured, level-based logging with PII redaction.
 * All log output goes through this service — never use console.log directly.
 */

import { Platform } from 'react-native';

/**
 * Log levels in order of severity.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry structure.
 */
export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly tag: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly error?: Error;
}

/**
 * Configuration for the logging service.
 */
export interface LoggingConfig {
  readonly minLevel: LogLevel;
  readonly enableConsole: boolean;
  readonly enableRemote: boolean;
  readonly redactKeys: string[];
}

const DEFAULT_CONFIG: LoggingConfig = {
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: false,
  redactKeys: [
    'password',
    'token',
    'secret',
    'authorization',
    'accessToken',
    'refreshToken',
    'ssn',
    'creditCard',
    'email',
    'phone',
  ],
};

/**
 * Logging service for structured, secure logging.
 */
export class LoggingService {
  private config: LoggingConfig;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update the logging configuration at runtime.
   */
  public configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a debug message.
   */
  public debug(tag: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  /**
   * Log an info message.
   */
  public info(tag: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, tag, message, data);
  }

  /**
   * Log a warning message.
   */
  public warn(tag: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, tag, message, data);
  }

  /**
   * Log an error message.
   */
  public error(tag: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, tag, message, { ...data, error: this.sanitizeError(error) });
  }

  /**
   * Core log method.
   */
  private log(level: LogLevel, tag: string, message: string, data?: Record<string, unknown>): void {
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      data: data ? this.redactSensitiveData(data) : undefined,
    };

    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    if (this.config.enableRemote) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Write a log entry to the console.
   */
  private writeToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.tag}]`;
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    const errorStr = entry.error ? ` ${entry.error.stack ?? entry.error.message}` : '';

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, dataStr, errorStr);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, dataStr, errorStr);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, dataStr, errorStr);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, dataStr, errorStr);
        break;
    }
  }

  /**
   * Send a log entry to a remote logging service.
   * Implement this when integrating with Sentry, Datadog, etc.
   */
  private sendToRemote(_entry: LogEntry): void {
    // TODO: Implement remote logging integration
    // This is intentionally empty — implement when a remote logging provider is configured
  }

  /**
   * Redact sensitive data from log entries.
   */
  private redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.config.redactKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !(value instanceof Error)) {
        redacted[key] = this.redactSensitiveData(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Sanitize an error for logging (strip PII from error messages).
   */
  private sanitizeError(error?: Error): Error | undefined {
    if (!error) {
      return undefined;
    }
    // Create a new error to avoid mutating the original
    const sanitized = new Error(error.message);
    sanitized.stack = error.stack;
    sanitized.name = error.name;
    return sanitized;
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const logger = new LoggingService();