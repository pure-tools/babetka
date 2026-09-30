import { Injectable, Inject, OnDestroy } from '@angular/core';
import { AUTH_PROVIDER, SECURKA_CONFIG } from '../provide-securka';
import type { SecurkaConfig } from '../provide-securka';
import type { AuthProvider } from '../interfaces/auth-provider';

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners = new Map<string, () => void>();
  private running = false;

  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    @Inject(SECURKA_CONFIG) private readonly config: Required<SecurkaConfig>,
  ) {}

  /** Begin watching for inactivity. Call after the user logs in. */
  start(): void {
    if (this.running) return;
    this.running = true;
    for (const event of this.config.activityEvents) {
      const fn = () => this.resetTimer();
      this.listeners.set(event, fn);
      window.addEventListener(event, fn, { passive: true });
    }
    this.resetTimer();
  }

  /** Stop watching and clear the timer. Call after the user logs out. */
  stop(): void {
    this.running = false;
    this.clearTimer();
    for (const [event, fn] of this.listeners) {
      window.removeEventListener(event, fn);
    }
    this.listeners.clear();
  }

  /** Manually push the deadline forward (e.g. after a background API call) */
  resetTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => void this.auth.signOut(), this.config.sessionTimeoutMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
