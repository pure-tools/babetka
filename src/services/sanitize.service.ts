import { Injectable } from '@angular/core';

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(a\s+)?/i,
  /system\s*:\s*\[/i,
  /<\|im_start\|>/i,
  /\[INST\]/i,
  /###\s*instruction/i,
];

@Injectable({ providedIn: 'root' })
export class SanitizeService {
  /**
   * Returns true for http/https/mailto URLs.
   * Requires an explicit protocol — blocks javascript:, data:, vbscript:,
   * and protocol-relative URLs like //evil.com.
   */
  isSafeUrl(url: string): boolean {
    if (!url?.trim()) return false;
    try {
      const parsed = new URL(url);
      return SAFE_PROTOCOLS.has(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Strips all HTML tags. Removes script/style block content entirely
   * so `<script>evil()</script>text` → `text`.
   */
  stripTags(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '');
  }

  /** Returns false if the string contains null bytes or raw <script> tags */
  isClean(value: string): boolean {
    return !value.includes('\0') && !/<script[\s>]/i.test(value);
  }

  /** Detects common prompt injection patterns before forwarding to an AI API */
  hasPromptInjection(text: string): boolean {
    return PROMPT_INJECTION_PATTERNS.some(re => re.test(text));
  }

  /** Strips control characters and trims to maxLength for AI prompt input */
  sanitizeForAi(text: string, maxLength = 2000): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .slice(0, maxLength)
      .trim();
  }

  /** Validates AI-generated output before rendering. Throws on unsafe content. */
  validateAiOutput(output: string): string {
    if (!this.isClean(output)) {
      throw new Error('AI output contains unsafe content');
    }
    return output;
  }
}
