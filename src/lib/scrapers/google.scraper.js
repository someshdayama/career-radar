import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

const MAX_PAGES = 3;

export class GoogleScraper extends BaseScraper {
  async scrape() {
    const baseUrl = 'https://www.google.com/about/careers/applications/jobs/results?location=India&skills=cloud';
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;
        console.log(`[Google] Page ${pageNum}`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
        await new Promise(r => setTimeout(r, 5000));
        await page.evaluate(async () => { window.scrollBy(0, 500); await new Promise(r => setTimeout(r, 1000)); });

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
