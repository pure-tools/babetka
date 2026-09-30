import type { Signal } from '@angular/core';

export interface AuthProvider {
  /** True when a user session is active */
  readonly isLoggedIn: Signal<boolean>;
  /** True when the user has Pro/paid access. Optional — guards degrade to false */
  readonly isPro?: Signal<boolean>;
  /** Called by SessionTimeoutService when inactivity limit is reached */
  signOut(): Promise<void>;
}
