import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class MicrosoftScraper extends BaseScraper {
  async scrape() {
    const baseUrl = 'https://apply.careers.microsoft.com/careers?hl=en&location=India&filter_profession=software+engineering';
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;
        console.log(`[Microsoft] Page ${pageNum}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        // Expanded wait specifically for heavy SPA React/Angular loading on cold Vercel 
        await page.waitForSelector('a[href*="/job"]', { timeout: 8000 }).catch(() => {});

        const jobs = await page.evaluate(() => {
          const results = [];
          const links = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('/job'));
          links.forEach(link => {
            const rawText = link.innerText.trim();
            if (!rawText || rawText.length < 5 || rawText.toLowerCase().includes('navigating here') || link.href.includes('actioncenter')) return;
            const parts = rawText.split('\n');
            const title = parts[0]?.trim() || 'Software Engineer';
            const location = parts[1]?.trim() || 'India';
            const posted = parts[2]?.trim() || '';
            const urlParts = link.href.split('/job/');
            const id = urlParts.length > 1 ? urlParts[1].split('?')[0] : Math.random().toString(36).substring(7);
            results.push({
              id: 'msft-' + id,
              title,
              company: 'Microsoft',
              location,
              descriptionSnippet: posted ? `${location}. ${posted}.` : `Software Engineering opportunity in ${location}.`,
              applyUrl: link.href,
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
      console.error('[Microsoft] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
