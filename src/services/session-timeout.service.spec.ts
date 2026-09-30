import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { SessionTimeoutService } from './session-timeout.service';
import { SECURKA_DEFAULTS } from '../provide-securka';

const mockSignOut = vi.fn();
const isLoggedIn = signal(true);
const mockAuth = { isLoggedIn, signOut: mockSignOut };
const testConfig = { ...SECURKA_DEFAULTS, sessionTimeoutMs: 5_000, activityEvents: ['click'] };

describe('SessionTimeoutService', () => {
  let service: SessionTimeoutService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    service = new SessionTimeoutService(mockAuth, testConfig);
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  it('calls signOut after timeout elapses', () => {
    service.start();
    vi.advanceTimersByTime(5_001);
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('does not call signOut before timeout', () => {
    service.start();
    vi.advanceTimersByTime(4_999);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('resets timer on activity event', () => {
    service.start();
    vi.advanceTimersByTime(4_000);
    window.dispatchEvent(new Event('click'));
    vi.advanceTimersByTime(4_000);
    expect(mockSignOut).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_001);
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('stop prevents signOut from firing', () => {
    service.start();
    vi.advanceTimersByTime(2_000);
    service.stop();
    vi.advanceTimersByTime(10_000);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('start is idempotent — calling twice does not double-register', () => {
    service.start();
    service.start();
    vi.advanceTimersByTime(5_001);
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('resetTimer extends the deadline', () => {
    service.start();
    vi.advanceTimersByTime(4_500);
    service.resetTimer();
    vi.advanceTimersByTime(4_500);
    expect(mockSignOut).not.toHaveBeenCalled();
    vi.advanceTimersByTime(501);
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});
