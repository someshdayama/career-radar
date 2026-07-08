import { getScraper, getSupportedCompanies } from '@/lib/scrapers/registry';
import { getCachedJobs, setCachedJobs, getCacheAge, isCacheInFlight, markCacheInFlight, invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;



// Helper: scrape one company with a single automatic retry on failure
async function scrapeWithRetry(companyId, attempt = 1) {
  const scraper = getScraper(companyId);
  if (!scraper) return { data: [], error: 'Scraper not found' };
  try {
    const data = await scraper.scrape();
    if (data && data.length > 0) {
      return { data };
    }
    console.warn(`[Stream] Scraper for ${companyId} returned 0 results, falling back to mock data`);
    return { data: scraper.getMockJobs() || [] };
  } catch (err) {
    if (attempt < 2) {
      console.warn(`[Stream] Retrying ${companyId} (attempt ${attempt + 1})...`);
      return scrapeWithRetry(companyId, attempt + 1);
    }
    console.error(`[Stream] Failed scraping ${companyId} after retries: ${err.message}. Falling back to mock data.`);
    return { data: scraper.getMockJobs() || [], error: err.message };
  }
}

// Next.js streaming endpoint using Server-Sent Events (SSE).
// All scrapers run in PARALLEL sharing a single Chromium instance.
// Results are pushed to the client as each company finishes.
// Responses are cached for 15 minutes — repeat visits are instant.
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
          const payload = { company: c, data: cached[c] || [], cached: true, cacheAge: age };
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
  // If another request is already scraping, wait briefly then re-check cache
  if (isCacheInFlight()) {
    console.log('[Stream] Scrape already in flight — waiting 3s then re-checking cache');
    await new Promise(r => setTimeout(r, 3000));
    const laterCache = getCachedJobs();
    if (laterCache) {
      const age = getCacheAge();
      const stream = new ReadableStream({
        start(controller) {
          for (const c of companies) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ company: c, data: laterCache[c] || [], cached: true, cacheAge: age })}\n\n`));
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
        const { data, error } = await scrapeWithRetry(c);
        if (error) {
          console.error(`[Stream] Failed ${c}: ${error}`);
        } else {
          console.log(`[Stream] Done: ${c} — ${data.length} jobs`);
        }
        freshData[c] = data;
        send({ company: c, data, ...(error ? { error } : {}) });
      });

      await Promise.allSettled(promises);

      // Persist to cache so next request is instant
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
