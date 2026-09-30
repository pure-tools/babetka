import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { AuthProvider } from './interfaces/auth-provider';

export interface SecurkaConfig {
  /** Inactivity duration in ms before auto-logout. Default: 30 minutes */
  sessionTimeoutMs?: number;
  /** DOM events that reset the inactivity timer */
  activityEvents?: string[];
}

export const AUTH_PROVIDER = new InjectionToken<AuthProvider>('AUTH_PROVIDER');
export const SECURKA_CONFIG = new InjectionToken<Required<SecurkaConfig>>('SECURKA_CONFIG');

export const SECURKA_DEFAULTS: Required<SecurkaConfig> = {
  sessionTimeoutMs: 30 * 60 * 1000,
  activityEvents: ['mousemove', 'keydown', 'click', 'touchstart'],
};

/**
 * Call in app.config.ts alongside:
 *   { provide: AUTH_PROVIDER, useExisting: YourAuthService }
 */
export function provideSecurka(config: SecurkaConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SECURKA_CONFIG, useValue: { ...SECURKA_DEFAULTS, ...config } },
  ]);
}
