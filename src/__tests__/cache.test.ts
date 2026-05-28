/**
 * Unit tests for src/lib/cache.js
 *
 * Tests: TTL expiry, setCachedJobs, getCacheAge, invalidation,
 * and the stampede-guard (inFlight) flow.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reset the globalThis singleton before every test so state doesn't bleed
beforeEach(() => {
  // @ts-expect-error — intentional reset
  globalThis.__jobCache = undefined;
  vi.resetModules();
});

async function importCache() {
  return await import('@/lib/cache');
}

describe('cache.js', () => {
  it('returns null on cold start (no data yet)', async () => {
    const { getCachedJobs } = await importCache();
    expect(getCachedJobs()).toBeNull();
  });

  it('returns stored data immediately after setCachedJobs', async () => {
    const { getCachedJobs, setCachedJobs } = await importCache();
    const payload = { linkedin: [{ id: 'j1', title: 'SRE' }] };
    setCachedJobs(payload);
    expect(getCachedJobs()).toEqual(payload);
  });

  it('returns null after TTL expires', async () => {
    const { getCachedJobs, setCachedJobs } = await importCache();
    setCachedJobs({ google: [] });

    // Fake the clock forward past 15 minutes
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000);

    expect(getCachedJobs()).toBeNull();
    vi.restoreAllMocks();
  });

  it('invalidateCache clears stored data', async () => {
    const { getCachedJobs, setCachedJobs, invalidateCache } = await importCache();
    setCachedJobs({ amazon: [] });
    invalidateCache();
    expect(getCachedJobs()).toBeNull();
  });

  it('getCacheAge returns seconds since last set', async () => {
    const { getCacheAge, setCachedJobs } = await importCache();
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValueOnce(now);    // setCachedJobs call
    setCachedJobs({ nvidia: [] });

    vi.spyOn(Date, 'now').mockReturnValue(now + 90_000); // 90 seconds later
    expect(getCacheAge()).toBe(90);
    vi.restoreAllMocks();
  });

  it('inFlight stampede-guard: markCacheInFlight + setCachedJobs clears flag', async () => {
    const { isCacheInFlight, markCacheInFlight, setCachedJobs } = await importCache();
    expect(isCacheInFlight()).toBe(false);
    markCacheInFlight();
    expect(isCacheInFlight()).toBe(true);
    setCachedJobs({});
    expect(isCacheInFlight()).toBe(false);
  });

  it('invalidateCache also clears inFlight flag', async () => {
    const { isCacheInFlight, markCacheInFlight, invalidateCache } = await importCache();
    markCacheInFlight();
    invalidateCache();
    expect(isCacheInFlight()).toBe(false);
  });
});
