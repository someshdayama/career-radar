/**
 * Server-side in-memory cache with a configurable TTL.
 * Scoped to the Node.js process — survives across requests but resets on server restart.
 *
 * Using a globalThis singleton so it survives Next.js module HMR in dev.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

if (!globalThis.__jobCache) {
  globalThis.__jobCache = {
    data: null,      // { microsoft: [...], google: [...], ... }
    timestamp: 0,
    inFlight: false, // prevent stampede
  };
}

const store = globalThis.__jobCache;

export function getCachedJobs() {
  if (store.data && Date.now() - store.timestamp < CACHE_TTL_MS) {
    return store.data;
  }
  return null;
}

export function setCachedJobs(data) {
  store.data = data;
  store.timestamp = Date.now();
}

export function getCacheAge() {
  if (!store.timestamp) return null;
  return Math.round((Date.now() - store.timestamp) / 1000); // seconds
}

export function invalidateCache() {
  store.data = null;
  store.timestamp = 0;
}
