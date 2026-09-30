import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureStorageService } from './secure-storage.service';

// jsdom localStorage requires a valid http origin; stub it for reliability
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i) => Object.keys(store)[i] ?? null,
};
vi.stubGlobal('localStorage', localStorageMock);

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(() => {
    localStorageMock.clear();
    service = new SecureStorageService();
  });

  describe('get / set', () => {
    it('returns null for missing key', () => expect(service.get('missing')).toBeNull());
    it('stores and retrieves a string', () => {
      service.set('key', 'value');
      expect(service.get<string>('key')).toBe('value');
    });
    it('stores and retrieves an object', () => {
      service.set('obj', { a: 1, b: true });
      expect(service.get<{ a: number; b: boolean }>('obj')).toEqual({ a: 1, b: true });
    });
    it('stores and retrieves an array', () => {
      service.set('arr', [1, 2, 3]);
      expect(service.get<number[]>('arr')).toEqual([1, 2, 3]);
    });
    it('returns null when stored value is invalid JSON', () => {
      localStorageMock.setItem('bad', '{not json}');
      expect(service.get('bad')).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes a key', () => {
      service.set('key', 'val');
      service.remove('key');
      expect(service.get('key')).toBeNull();
    });
    it('no-ops on missing key', () => {
      expect(() => service.remove('nonexistent')).not.toThrow();
    });
  });

  describe('has', () => {
    it('returns false for missing key', () => expect(service.has('x')).toBe(false));
    it('returns true after set', () => {
      service.set('x', 1);
      expect(service.has('x')).toBe(true);
    });
    it('returns false after remove', () => {
      service.set('x', 1);
      service.remove('x');
      expect(service.has('x')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all keys', () => {
      service.set('a', 1);
      service.set('b', 2);
      service.clear();
      expect(service.has('a')).toBe(false);
      expect(service.has('b')).toBe(false);
    });
  });

  describe('quota error resilience', () => {
    it('does not throw when localStorage.setItem throws', () => {
      vi.spyOn(localStorageMock, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });
      expect(() => service.set('key', 'value')).not.toThrow();
    });
  });
});
