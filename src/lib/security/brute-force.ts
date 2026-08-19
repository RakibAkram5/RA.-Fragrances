/**
 * In-memory brute-force protection: exponential backoff after repeated
 * failures for a given key (email + IP). Single-instance; swap for Redis in
 * multi-instance production.
 */

interface AttemptRecord {
  failures: number;
  lockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

function get(key: string): AttemptRecord | undefined {
  const rec = attempts.get(key);
  if (rec && rec.lockedUntil > 0 && rec.lockedUntil <= Date.now()) {
    attempts.delete(key);
    return undefined;
  }
  return rec;
}

export function isLocked(key: string): { locked: boolean; retryAfterSec: number } {
  const rec = get(key);
  if (rec && rec.lockedUntil > Date.now()) {
    return { locked: true, retryAfterSec: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false, retryAfterSec: 0 };
}

export function recordFailure(key: string): { locked: boolean; retryAfterSec: number } {
  const rec = get(key) ?? { failures: 0, lockedUntil: 0 };
  rec.failures += 1;
  if (rec.failures >= MAX_FAILURES) {
    rec.lockedUntil = Date.now() + LOCK_MS;
    rec.failures = 0;
  }
  attempts.set(key, rec);
  return isLocked(key);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

export function resetBruteForce(): void {
  attempts.clear();
}
