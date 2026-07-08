import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class AppleScraper extends BaseScraper {
  getMockJobs() {
    return [
      { id: 'mock-apl-1', title: 'Infrastructure Engineer (Kubernetes)', company: 'Apple', location: 'Hyderabad, India', descriptionSnippet: 'Manage internal GKE and EKS container fabrics powering Apple Cloud services like iCloud and Siri.', applyUrl: 'https://jobs.apple.com/en-in/details/mock-apl-1' },
      { id: 'mock-apl-2', title: 'DevOps Architect', company: 'Apple', location: 'Bengaluru, India', descriptionSnippet: 'Design build-and-test tooling pipelines for Apple software engineering teams globally.', applyUrl: 'https://jobs.apple.com/en-in/details/mock-apl-2' }
    ];
  }

  async scrape() {
    const baseUrl = 'https://jobs.apple.com/en-in/search?location=india-INDC&key=devops+cloud+SRE+site+reliability+product+manager+scrum+master+product+owner';
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
            // Apple shows posted date in a span with class "job-title-date" or similar
            const dateEl = row.querySelector('.job-title-date, span[class*="date"], time');
            let postedDate = null;
            if (dateEl) {
              const dt = dateEl.getAttribute('datetime') || dateEl.innerText.trim();
              if (dt) postedDate = dt;
            }
            const id = href.split('/').filter(Boolean).pop() || Math.random().toString(36).substring(7);
            results.push({
              id: 'aapl-' + id,
              title,
              company: 'Apple',
              location,
              descriptionSnippet: `Explore the ${title} opportunity at Apple in ${location}.`,
              applyUrl: href,
              postedDate: postedDate || undefined,
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
      console.error('[Apple] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
