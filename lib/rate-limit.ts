/**
 * Rise Up Roofing - Sliding Window Rate Limiter
 * 
 * Provides memory-safe sliding window rate limiting for public endpoints,
 * login brute-force prevention, and bot abuse defense.
 */

export interface RateLimitOptions {
  limit: number;       // Max permitted requests within the window
  windowMs: number;    // Sliding window duration in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

interface Bucket {
  tokens: number[];
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitStores?: Map<string, Map<string, Bucket>>;
};

if (!globalForRateLimit.rateLimitStores) {
  globalForRateLimit.rateLimitStores = new Map<string, Map<string, Bucket>>();
}

const rateLimitStores = globalForRateLimit.rateLimitStores;

/**
 * Resolve client IP safely from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * Check and consume a token in the sliding window rate limiter
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let store = rateLimitStores.get(namespace);
  if (!store) {
    store = new Map<string, Bucket>();
    rateLimitStores.set(namespace, store);
  }

  // Periodic pruning of stale entries to prevent memory leaks under load
  if (store.size > 5000) {
    for (const [key, bucket] of store.entries()) {
      bucket.tokens = bucket.tokens.filter(ts => ts > windowStart);
      if (bucket.tokens.length === 0) store.delete(key);
    }
  }

  let bucket = store.get(identifier);
  if (!bucket) {
    bucket = { tokens: [] };
    store.set(identifier, bucket);
  }

  // Prune expired timestamps in the current bucket
  bucket.tokens = bucket.tokens.filter(ts => ts > windowStart);

  if (bucket.tokens.length >= options.limit) {
    const oldestToken = bucket.tokens[0];
    const resetMs = oldestToken ? oldestToken + options.windowMs - now : options.windowMs;
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  bucket.tokens.push(now);
  return {
    allowed: true,
    limit: options.limit,
    remaining: options.limit - bucket.tokens.length,
    resetMs: options.windowMs,
  };
}
