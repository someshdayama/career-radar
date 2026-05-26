import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class GoogleScraper extends BaseScraper {
  async scrape() {
    // Targeting DevOps, Cloud, SRE roles in India
    const baseUrl = 'https://www.google.com/about/careers/applications/jobs/results?location=India&skills=cloud,devops,kubernetes,terraform,site+reliability';
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;
        console.log(`[Google] Page ${pageNum}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
        await page.waitForSelector('.lLd3Je', { timeout: 3000 }).catch(() => {});
        await page.evaluate(() => window.scrollBy(0, 500));

        const jobs = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('.lLd3Je').forEach(card => {
            const titleEl = card.querySelector('h3');
            const linkEl = card.querySelector('a.WpHeLc');
            const locEl = card.querySelector('.r0wTof');
            if (!titleEl || !linkEl) return;
            let href = linkEl.getAttribute('href') || '';
            if (href && !href.startsWith('http')) href = 'https://www.google.com/about/careers/applications/' + href;
            const id = href.split('/').pop() || Math.random().toString(36).substring(7);
            results.push({
              id: 'goog-' + id,
              title: titleEl.innerText.trim(),
              company: 'Google',
              location: locEl ? locEl.innerText.trim() : 'India',
              descriptionSnippet: 'Explore this position at Google.',
              applyUrl: href,
            });
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
      console.error('[Google] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
