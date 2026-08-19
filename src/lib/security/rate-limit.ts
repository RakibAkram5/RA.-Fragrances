/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance deployment. For multi-instance production,
 * swap the store for Redis (the interface is intentionally simple so that a
 * Redis-backed implementation can drop in without touching call sites).
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

let sweepCounter = 0;

function sweep(now: number) {
  sweepCounter += 1;
  if (sweepCounter % 500 !== 0) return;
  for (const [key, bucket] of store) {
    if (now - bucket.windowStart > 15 * 60 * 1000) store.delete(key);
  }
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = store.get(key);

  if (!existing || now - existing.windowStart >= opts.windowMs) {
    const bucket: Bucket = { count: 1, windowStart: now };
    store.set(key, bucket);
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= opts.limit) {
    const retryAfterMs = existing.windowStart + opts.windowMs - now;
    return { ok: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    retryAfterMs: 0,
  };
}

/** Reset all buckets (primarily for tests). */
export function resetRateLimiter(): void {
  store.clear();
}
