import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RateLimiterService {
  private readonly buckets = new Map<string, number[]>();

  /**
   * Returns true if the action is allowed, false if rate-limited.
   * Tracks attempts in a sliding window keyed by `key`.
   *
   * @param key      Unique identifier (e.g. 'login', `reset:${email}`)
   * @param max      Maximum allowed attempts within the window
   * @param windowMs Window duration in milliseconds
   */
  allow(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = (this.buckets.get(key) ?? []).filter(t => now - t < windowMs);
    if (timestamps.length >= max) return false;
    timestamps.push(now);
    this.buckets.set(key, timestamps);
    return true;
  }

  /** Remaining attempts before the limit is hit within the current window */
  remaining(key: string, max: number, windowMs: number): number {
    const now = Date.now();
    const count = (this.buckets.get(key) ?? []).filter(t => now - t < windowMs).length;
    return Math.max(0, max - count);
  }

  /** Clear the attempt history for a key (e.g. after successful login) */
  reset(key: string): void {
    this.buckets.delete(key);
  }
}
