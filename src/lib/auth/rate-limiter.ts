/**
 * Lightweight, in-memory rate limiter for authentication endpoints.
 * Protects short PINs against automated brute-force attempts.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes window
const BLOCK_DURATION_MS = 60 * 1000; // 60 seconds block duration

// In-memory store keyed by normalized identifier (e.g. phone number or IP)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 10 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleRecords() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const isExpired = now - record.firstAttemptAt > WINDOW_MS;
    const isUnblocked = !record.blockedUntil || record.blockedUntil < now;
    if (isExpired && isUnblocked) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkLoginRateLimit(rawKey: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  purgeStaleRecords();
  const key = rawKey.trim().toLowerCase();
  const record = rateLimitStore.get(key);
  if (!record) return { allowed: true };

  const now = Date.now();

  // If currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  // If window has passed, reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(rawKey: string): {
  blocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  purgeStaleRecords();
  const key = rawKey.trim().toLowerCase();
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    };
    rateLimitStore.set(key, record);
    return { blocked: false, remainingAttempts: ATTEMPT_LIMIT - 1 };
  }

  record.attempts += 1;

  if (record.attempts >= ATTEMPT_LIMIT) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    return {
      blocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  return {
    blocked: false,
    remainingAttempts: Math.max(0, ATTEMPT_LIMIT - record.attempts),
  };
}

export function resetLoginRateLimit(rawKey: string): void {
  const key = rawKey.trim().toLowerCase();
  rateLimitStore.delete(key);
}
