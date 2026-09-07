/**
 * TechyBlogs AI — Smart Semantic Response Cache
 * Caches deterministic requests (Summaries, Takeaways, Key Facts) keyed by article content hash.
 */

const cacheStore = new Map();
const MAX_CACHE_ENTRIES = 200;
const TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate quick hash for string
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash);
}

/**
 * Get cache key for article question
 */
export function getCacheKey(articleSlug, content, normalizedQuestion) {
  if (!articleSlug || !content || !normalizedQuestion) return null;
  const contentDigest = hashString(content.slice(0, 500) + content.slice(-500) + content.length);
  const qDigest = normalizedQuestion.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return `${articleSlug}:${contentDigest}:${qDigest}`;
}

export function getCachedResponse(key) {
  if (!key || !cacheStore.has(key)) return null;
  const entry = cacheStore.get(key);
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedResponse(key, value) {
  if (!key || !value) return;
  if (cacheStore.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value;
    cacheStore.delete(oldestKey);
  }
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}
