import { getScraper, getSupportedCompanies } from '@/lib/scrapers/registry';
import { getCachedJobs, setCachedJobs, getCacheAge } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed for Vercel free tier (Hobby)

// Next.js streaming endpoint using Server-Sent Events (SSE).
// All scrapers run in PARALLEL sharing a single Chromium instance.
// Results are pushed to the client as each company finishes.
// Responses are cached for 15 minutes — repeat visits are instant.
export async function GET() {
  const companies = getSupportedCompanies();
  const encoder = new TextEncoder();

  // --- Cache hit: stream all data instantly ---
  const cached = getCachedJobs();
  if (cached) {
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
  console.log('[Stream] Cache miss — starting parallel scrape');
  const freshData = {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const promises = companies.map(async (c) => {
        try {
          const scraper = getScraper(c);
          if (!scraper) { send({ company: c, data: [], error: 'Scraper not found' }); return; }
          console.log(`[Stream] Scraping ${c}...`);
          const data = await scraper.scrape();
          console.log(`[Stream] Done: ${c} — ${data.length} jobs`);
          freshData[c] = data || [];
          send({ company: c, data: data || [] });
        } catch (err) {
          console.error(`[Stream] Error scraping ${c}:`, err.message);
          freshData[c] = [];
          send({ company: c, data: [], error: err.message });
        }
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
