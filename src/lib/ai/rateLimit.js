/**
 * TeachyBlogs AI — In-Memory Rate Limiter
 * Enforces per-client request limits (default: 10 requests / 60 seconds).
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 12; // 12 requests per minute
const ipStore = new Map();

// Periodic cleanup of stale client records
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (now - record.windowStart > WINDOW_MS * 2) {
        ipStore.delete(key);
      }
    }
  }, WINDOW_MS);
}

/**
 * Check if client exceeds rate limit
 */
export function checkRateLimit(clientIdentifier) {
  const key = clientIdentifier || 'anonymous_client';
  const now = Date.now();

  const record = ipStore.get(key) || { count: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    // Reset window
    record.count = 1;
    record.windowStart = now;
    ipStore.set(key, record);
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSeconds = Math.ceil((record.windowStart + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  record.count += 1;
  ipStore.set(key, record);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetInSeconds: Math.ceil((record.windowStart + WINDOW_MS - now) / 1000),
  };
}

/**
 * Extract client IP or proxy header from Next.js request
 */
export function getClientFingerprint(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
