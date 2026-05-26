import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

export class NetflixScraper extends BaseScraper {
  async scrape() {
    const url = 'https://jobs.netflix.com/search?q=Software%20Engineer&location=India';
    const { page, release } = await acquireBrowser();
    let jobs = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await page.waitForSelector('a[href*="/jobs/"]', { timeout: 10000 }).catch(() => {});
      // Extra wait for React hydration
      await new Promise(r => setTimeout(r, 3000));

      jobs = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        const links = Array.from(document.querySelectorAll('a'))
          .filter(a => a.href.includes('/jobs/') && !a.href.includes('/search'));

        links.forEach(link => {
          const rawText = link.innerText.trim();
          if (rawText.length < 5) return;
          if (seen.has(link.href)) return;
          seen.add(link.href);

          const titleEl = link.querySelector('h3, h2, h4') || link;
          const title = titleEl.innerText.split('\n')[0].trim() || 'Software Engineer';
          const locSpans = Array.from(link.querySelectorAll('span, div'))
            .filter(el => el.innerText.toLowerCase().includes('india'));
          const location = locSpans.length > 0 ? locSpans[0].innerText.trim() : 'India';
          const urlId = link.href.split('/jobs/')[1]?.split('?')[0] || Math.random().toString(36).substring(7);

          results.push({
            id: 'nflx-' + urlId,
            title,
            company: 'Netflix',
            location,
            descriptionSnippet: `Join Netflix engineering. ${title} opportunity in ${location}.`,
            applyUrl: link.href,
          });
        });

        return results.slice(0, 20);
      });
    } catch (err) {
      console.error('[Netflix] Scrape error:', err.message);
    } finally {
      await release();
    }

    return jobs;
  }
}
