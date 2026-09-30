import { Injectable } from '@angular/core';
import { SanitizeService } from './sanitize.service';
import { RateLimiterService } from './rate-limiter.service';

export interface AiInputResult {
  safe: boolean;
  sanitized: string;
  reason?: 'prompt_injection' | 'pii_detected' | 'rate_limited' | 'too_long';
}

/** Rough token estimate: 1 token ≈ 4 chars for English text */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Common PII patterns
const PII_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'email',       re: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g },
  { name: 'phone_us',    re: /\b(\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { name: 'ssn',         re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'credit_card', re: /\b(?:\d[ \-]*){13,16}\b/g },
];

const PII_PLACEHOLDER: Record<string, string> = {
  email:       '[EMAIL]',
  phone_us:    '[PHONE]',
  ssn:         '[SSN]',
  credit_card: '[CARD]',
};

@Injectable({ providedIn: 'root' })
export class AiGuardService {
  constructor(
    private readonly sanitize: SanitizeService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  /** True if the text contains any recognised PII pattern */
  hasPii(text: string): boolean {
    return PII_PATTERNS.some(({ re }) => { re.lastIndex = 0; return re.test(text); });
  }

  /** Replace PII matches with safe placeholders */
  redactPii(text: string): string {
    let out = text;
    for (const { name, re } of PII_PATTERNS) {
      re.lastIndex = 0;
      out = out.replace(re, PII_PLACEHOLDER[name]);
    }
    return out;
  }

  /** Estimated token count for a prompt string */
  estimateTokens(text: string): number {
    return estimateTokens(text);
  }

  /**
   * Full pre-flight check for user text before it enters an AI prompt.
   *
   * - Strips control characters and truncates to maxLength
   * - Blocks prompt injection attempts
   * - Redacts PII (configurable via allowPii)
   * - Enforces per-user rate limiting (default: 20 requests / 60 s)
   */
  validateInput(
    text: string,
    userId: string,
    options: {
      maxLength?: number;
      allowPii?: boolean;
      rateLimit?: { max: number; windowMs: number };
    } = {}
  ): AiInputResult {
    const { maxLength = 2000, allowPii = false, rateLimit = { max: 20, windowMs: 60_000 } } = options;

    if (!this.rateLimiter.allow(`ai:${userId}`, rateLimit.max, rateLimit.windowMs)) {
      return { safe: false, sanitized: '', reason: 'rate_limited' };
    }

    let sanitized = this.sanitize.sanitizeForAi(text, maxLength);

    if (sanitized.length >= maxLength) {
      return { safe: false, sanitized, reason: 'too_long' };
    }

    if (this.sanitize.hasPromptInjection(sanitized)) {
      return { safe: false, sanitized, reason: 'prompt_injection' };
    }

    if (!allowPii && this.hasPii(sanitized)) {
      sanitized = this.redactPii(sanitized);
      return { safe: true, sanitized, reason: 'pii_detected' };
    }

    return { safe: true, sanitized };
  }
}
