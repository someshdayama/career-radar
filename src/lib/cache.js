/**
 * Server-side in-memory cache with a configurable TTL.
 * Scoped to the Node.js process — survives across requests but resets on server restart.
 *
 * Using a globalThis singleton so it survives Next.js module HMR in dev.
 *
 * The `inFlight` flag prevents cache stampedes: if multiple requests arrive
 * simultaneously during a cold start, only the first one triggers a real scrape.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

if (!globalThis.__jobCache) {
  globalThis.__jobCache = {
    data: null,      // { microsoft: [...], google: [...], ... }
    timestamp: 0,
    inFlight: false, // true while a scrape is in progress
  };
}

const store = globalThis.__jobCache;

/** Returns cached data if still fresh, or null on a cache miss. */
export function getCachedJobs() {
  if (store.data && Date.now() - store.timestamp < CACHE_TTL_MS) {
    return store.data;
  }
  return null;
}

/** Returns true if a scrape is currently running (prevents stampedes). */
export function isCacheInFlight() {
  return store.inFlight;
}

/** Call before starting a scrape to claim the in-flight slot. */
export function markCacheInFlight() {
  store.inFlight = true;
}

/** Persists fresh data and clears the in-flight flag. */
export function setCachedJobs(data) {
  store.data = data;
  store.timestamp = Date.now();
  store.inFlight = false;
}

/** Age of the current cache entry in seconds. */
export function getCacheAge() {
  if (!store.timestamp) return null;
  return Math.round((Date.now() - store.timestamp) / 1000);
}

/** Force-expire the cache (e.g. after a manual Refresh). */
export function invalidateCache() {
  store.data = null;
  store.timestamp = 0;
  store.inFlight = false;
}
