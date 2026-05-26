import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class AppleScraper extends BaseScraper {
  async scrape() {
    // Targeting DevOps, Cloud, SRE roles in India
    const baseUrl = 'https://jobs.apple.com/en-in/search?location=india-INDC&key=devops+cloud+SRE+site+reliability';
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;
        console.log(`[Apple] Page ${pageNum}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
        await page.waitForSelector('div.job-title.job-list-item', { timeout: 3000 }).catch(() => {});

        const jobs = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('div.job-title.job-list-item').forEach(row => {
            const titleLink = row.querySelector('h3 a');
            if (!titleLink) return;
            const title = titleLink.innerText.trim();
            const href = titleLink.href;
            const locationEl = row.querySelector('.job-title-location span[id*="search-store-name"]') || row.querySelector('.job-title-location');
            const location = locationEl ? locationEl.innerText.trim().replace('Location\n', '') : 'India';
            const id = href.split('/').filter(Boolean).pop() || Math.random().toString(36).substring(7);
            results.push({ id: 'aapl-' + id, title, company: 'Apple', location, descriptionSnippet: `Explore the ${title} opportunity at Apple in ${location}.`, applyUrl: href });
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
      console.error('[Apple] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
