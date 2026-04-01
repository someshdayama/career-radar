import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class AmazonScraper extends BaseScraper {
  async scrape() {
    const baseUrl = 'https://www.amazon.jobs/en/search?base_query=Software+Engineer&loc_query=India';
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;
        console.log(`[Amazon] Page ${pageNum}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
        await page.waitForSelector('.job-tile, .job, article, div[data-job-id]', { timeout: 3000 }).catch(() => {});

        const jobs = await page.evaluate(() => {
          const results = [];
          const jobTiles = document.querySelectorAll('.job-tile, .job, article, div[data-job-id]');
          jobTiles.forEach(tile => {
            const titleEl = tile.querySelector('h2, h3, .job-title');
            if (!titleEl) return;
            const title = titleEl.innerText.trim();
            const linkEl = tile.tagName === 'A' ? tile : tile.querySelector('a');
            const href = linkEl ? linkEl.href : window.location.href;
            const locEl = tile.querySelector('.location-and-id, .location, span.locality');
            const location = locEl ? locEl.innerText.trim().split('|')[0] : 'India';
            const descEl = tile.querySelector('.description, p');
            const desc = descEl ? descEl.innerText.trim().substring(0, 150) + '...' : `Software Engineering opportunity at Amazon in ${location}.`;
            const id = href.split('/').filter(Boolean).pop() || Math.random().toString(36).substring(7);
            results.push({ id: 'amzn-' + id, title, company: 'Amazon', location, descriptionSnippet: desc, applyUrl: href });
          });
          return results;
        });

        let newFound = 0;
        for (const job of jobs) {
          if (!seen.has(job.id)) { seen.add(job.id); allJobs.push(job); newFound++; }
        }
        if (newFound === 0) break;
      }
    } catch (err) {
      console.error('[Amazon] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
