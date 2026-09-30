import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new RateLimiterService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    expect(service.allow('login', 5, 60_000)).toBe(true);
    expect(service.allow('login', 5, 60_000)).toBe(true);
  });

  it('blocks when limit is reached', () => {
    for (let i = 0; i < 5; i++) service.allow('login', 5, 60_000);
    expect(service.allow('login', 5, 60_000)).toBe(false);
  });

  it('allows again after window expires', () => {
    for (let i = 0; i < 5; i++) service.allow('login', 5, 60_000);
    vi.advanceTimersByTime(61_000);
    expect(service.allow('login', 5, 60_000)).toBe(true);
  });

  it('keys are isolated from each other', () => {
    for (let i = 0; i < 5; i++) service.allow('login', 5, 60_000);
    expect(service.allow('reset', 5, 60_000)).toBe(true);
  });

  it('reset clears attempt history', () => {
    for (let i = 0; i < 5; i++) service.allow('login', 5, 60_000);
    expect(service.allow('login', 5, 60_000)).toBe(false);
    service.reset('login');
    expect(service.allow('login', 5, 60_000)).toBe(true);
  });

  it('remaining returns correct count before limit', () => {
    service.allow('login', 5, 60_000);
    service.allow('login', 5, 60_000);
    expect(service.remaining('login', 5, 60_000)).toBe(3);
  });

  it('remaining returns 0 when limit reached', () => {
    for (let i = 0; i < 5; i++) service.allow('login', 5, 60_000);
    expect(service.remaining('login', 5, 60_000)).toBe(0);
  });

  it('remaining returns max for unknown key', () => {
    expect(service.remaining('unknown', 5, 60_000)).toBe(5);
  });

  it('uses sliding window — old attempts fall off', () => {
    service.allow('login', 3, 60_000);
    service.allow('login', 3, 60_000);
    vi.advanceTimersByTime(61_000);
    service.allow('login', 3, 60_000);
    service.allow('login', 3, 60_000);
    // only 2 in window, still allowed
    expect(service.allow('login', 3, 60_000)).toBe(true);
  });
});
