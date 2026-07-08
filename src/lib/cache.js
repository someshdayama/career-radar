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

/** Persists fresh data by merging it incrementally with existing cache. */
export function setCachedJobs(newData) {
  if (!store.data) {
    store.data = {};
  }

  const CUTOFF_MS = 48 * 60 * 60 * 1000; // 48 hours
  const now = Date.now();
  const cutoffTime = now - CUTOFF_MS;

  Object.entries(newData).forEach(([source, newJobsList]) => {
    const existingJobs = store.data[source] || [];

    // If the new scrape is empty (e.g. rate-limited, timeout, or block), keep existing cached jobs
    if (!newJobsList || newJobsList.length === 0) {
      console.log(`[Cache] New scrape for "${source}" returned 0 results. Retaining existing ${existingJobs.length} cached jobs.`);
      return;
    }

    // Merge and deduplicate by job ID
    const mergedMap = new Map();
    
    // 1. Load existing jobs (filtering out any first scraped more than 48 hours ago)
    existingJobs.forEach(job => {
      if (job && job.id) {
        const scrapedAt = job.scrapedAt || now;
        if (scrapedAt > cutoffTime) {
          mergedMap.set(job.id, { ...job, scrapedAt });
        }
      }
    });

    // 2. Overwrite/add new jobs (preserve original scrapedAt if job already cached)
    newJobsList.forEach(job => {
      if (job && job.id) {
        const existingJob = mergedMap.get(job.id);
        const scrapedAt = existingJob ? existingJob.scrapedAt : now;
        mergedMap.set(job.id, { ...job, scrapedAt });
      }
    });

    const mergedList = Array.from(mergedMap.values());

    // 3. Keep memory footprint low by retaining the latest 150 jobs per source
    const trimmedList = mergedList.slice(-150);

    console.log(`[Cache] Scrape for "${source}" finished. Merged into ${trimmedList.length} unique cached jobs.`);
    store.data[source] = trimmedList;
  });

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
