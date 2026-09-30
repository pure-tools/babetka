import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  /** Read and JSON-parse a value. Returns null on missing key or parse error. */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /** JSON-stringify and store a value. Silently drops on quota errors. */
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing or storage quota exceeded — fail silently
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** Remove all keys. Use with care — clears all localStorage for the origin. */
  clear(): void {
    localStorage.clear();
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
