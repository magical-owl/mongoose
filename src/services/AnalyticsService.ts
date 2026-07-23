/**
 * Analytics Service
 *
 * Abstract analytics service designed to be backed by any analytics provider.
 * Provides methods for event tracking, screen views, and user properties.
 * No provider-specific code should leak into this abstraction.
 */

import { logger } from './LoggingService';

const TAG = 'AnalyticsService';

/**
 * Analytics event with optional properties.
 */
export interface AnalyticsEvent {
  readonly name: string;
  readonly properties?: Record<string, unknown>;
  readonly timestamp?: number;
}

/**
 * Screen view event.
 */
export interface ScreenViewEvent {
  readonly screenName: string;
  readonly screenClass?: string;
  readonly properties?: Record<string, unknown>;
}

/**
 * User properties for identifying and segmenting users.
 */
export interface UserProperties {
  readonly userId?: string;
  readonly traits?: Record<string, unknown>;
}

/**
 * Abstract analytics provider interface.
 * Implement this to integrate with any analytics service.
 */
export interface IAnalyticsProvider {
  readonly name: string;
  initialize(): Promise<void>;
  trackEvent(event: AnalyticsEvent): Promise<void>;
  trackScreenView(event: ScreenViewEvent): Promise<void>;
  identifyUser(properties: UserProperties): Promise<void>;
  reset(): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Analytics service with provider abstraction.
 */
export class AnalyticsService {
  private provider: IAnalyticsProvider | null = null;
  private enabled: boolean = true;

  /**
   * Register an analytics provider.
   */
  public registerProvider(provider: IAnalyticsProvider): void {
    this.provider = provider;
    logger.info(TAG, `Analytics provider registered: ${provider.name}`);
  }

  /**
   * Enable or disable analytics tracking.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(TAG, `Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Initialize the analytics provider.
   */
  public async initialize(): Promise<void> {
    if (!this.provider) {
      logger.warn(TAG, 'No analytics provider registered');
      return;
    }
    await this.provider.initialize();
  }

  /**
   * Track an event.
   */
  public async trackEvent(name: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.enabled || !this.provider) {
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    try {
      await this.provider.trackEvent(event);
      logger.debug(TAG, `Event tracked: ${name}`, properties);
    } catch (error) {
      logger.error(TAG, `Failed to track event: ${name}`, error as Error);
    }
  }

  /**
   * Track a screen view.
   */
  public async trackScreenView(screenName: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.enabled || !this.provider) {
      return;
    }

    const event: ScreenViewEvent = {
      screenName,
      screenClass: screenName.replace(/\s/g, ''),
      properties,
    };

    try {
      await this.provider.trackScreenView(event);
      logger.debug(TAG, `Screen view tracked: ${screenName}`);
    } catch (error) {
      logger.error(TAG, `Failed to track screen view: ${screenName}`, error as Error);
    }
  }

  /**
   * Identify a user with properties.
   */
  public async identifyUser(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.enabled || !this.provider) {
      return;
    }

    try {
      await this.provider.identifyUser({ userId, traits });
      logger.info(TAG, `User identified: ${userId}`);
    } catch (error) {
      logger.error(TAG, `Failed to identify user: ${userId}`, error as Error);
    }
  }

  /**
   * Reset the current user identity.
   */
  public async reset(): Promise<void> {
    if (!this.provider) {
      return;
    }

    try {
      await this.provider.reset();
      logger.info(TAG, 'Analytics user reset');
    } catch (error) {
      logger.error(TAG, 'Failed to reset analytics user', error as Error);
    }
  }

  /**
   * Flush pending events.
   */
  public async flush(): Promise<void> {
    if (!this.provider) {
      return;
    }

    try {
      await this.provider.flush();
    } catch (error) {
      logger.error(TAG, 'Failed to flush analytics', error as Error);
    }
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const analytics = new AnalyticsService();