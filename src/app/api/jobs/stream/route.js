import { getScraper, getSupportedCompanies } from '@/lib/scrapers/registry';
import { getCachedJobs, setCachedJobs, getCacheAge, isCacheInFlight, markCacheInFlight } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function stripMockJobs(jobs) {
  if (!Array.isArray(jobs)) return [];
  return jobs.filter(j => {
    if (!j) return false;
    const id = String(j.id || '');
    const url = String(j.applyUrl || '');
    if (id.startsWith('mock-') || id.includes('-mock-')) return false;
    if (url.includes('/mock-') || url.includes('mock-')) return false;
    return true;
  });
}

/**
 * Scrape one company with a single automatic retry.
 * Never injects mock jobs — empty results and failures return real empty data + status.
 */
async function scrapeWithRetry(companyId, attempt = 1) {
  const scraper = getScraper(companyId);
  if (!scraper) {
    return { data: [], status: 'error', error: 'Scraper not found', count: 0 };
  }

  try {
    const raw = await scraper.scrape();
    const data = stripMockJobs(Array.isArray(raw) ? raw : []);
    if (data.length > 0) {
      return { data, status: 'ok', count: data.length };
    }
    console.warn(`[Stream] Scraper for ${companyId} returned 0 real jobs (no mock fallback)`);
    return { data: [], status: 'empty', count: 0 };
  } catch (err) {
    if (attempt < 2) {
      console.warn(`[Stream] Retrying ${companyId} (attempt ${attempt + 1})...`);
      return scrapeWithRetry(companyId, attempt + 1);
    }
    console.error(`[Stream] Failed scraping ${companyId} after retries: ${err.message}.`);
    return { data: [], status: 'error', error: err.message, count: 0 };
  }
}

// Next.js streaming endpoint using Server-Sent Events (SSE).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  const companies = getSupportedCompanies();
  const encoder = new TextEncoder();

  // --- Cache hit: stream all data instantly ---
  const cached = getCachedJobs();
  if (cached && !forceRefresh) {
    const age = getCacheAge();
    console.log(`[Stream] Cache hit (${age}s old) — streaming instantly`);
    const stream = new ReadableStream({
      start(controller) {
        for (const c of companies) {
          const list = stripMockJobs(cached[c] || []);
          const payload = { company: c, data: list, cached: true, cacheAge: age };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // --- Cache miss: scrape in parallel, stream as each finishes ---
  if (isCacheInFlight()) {
    console.log('[Stream] Scrape already in flight — waiting 3s then re-checking cache');
    await new Promise(r => setTimeout(r, 3000));
    const laterCache = getCachedJobs();
    if (laterCache) {
      const age = getCacheAge();
      const stream = new ReadableStream({
        start(controller) {
          for (const c of companies) {
            const list = stripMockJobs(laterCache[c] || []);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ company: c, data: list, cached: true, cacheAge: age })}\n\n`));
          }
          controller.close();
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
    }
  }

  markCacheInFlight();
  console.log('[Stream] Cache miss — starting parallel scrape');
  const freshData = {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const promises = companies.map(async (c) => {
        console.log(`[Stream] Scraping ${c}...`);
        const { data, error, status, count } = await scrapeWithRetry(c);
        if (error) {
          console.error(`[Stream] Failed ${c}: ${error}`);
        } else {
          console.log(`[Stream] Done: ${c} — ${data.length} jobs (${status})`);
        }
        freshData[c] = data;
        send({ company: c, data, status, count, ...(error ? { error } : {}) });
      });

      await Promise.allSettled(promises);

      // Persist to cache
      setCachedJobs(freshData);
      console.log('[Stream] Results cached for 15 minutes');

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
