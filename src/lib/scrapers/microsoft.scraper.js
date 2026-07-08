import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class MicrosoftScraper extends BaseScraper {
  getMockJobs() {
    return [
      { id: 'mock-ms-1', title: 'Senior Azure DevOps Engineer', company: 'Microsoft', location: 'Hyderabad, India', descriptionSnippet: 'Drive the design and automation of Azure CI/CD pipelines and infrastructure as code for critical cloud products.', applyUrl: 'https://careers.microsoft.com/us/en/job/mock-ms-1' },
      { id: 'mock-ms-2', title: 'Cloud Engineer (Azure)', company: 'Microsoft', location: 'Bengaluru, India', descriptionSnippet: 'Deploy, monitor, and scale enterprise workloads in Azure, ensuring high reliability and security.', applyUrl: 'https://careers.microsoft.com/us/en/job/mock-ms-2' }
    ];
  }

  async scrape() {
    const baseUrl = 'https://jobs.careers.microsoft.com/global/en/search?q=devops+OR+cloud+engineer+OR+site+reliability+OR+release+engineer+OR+product+manager+OR+scrum+master+OR+product+owner&lc=India&l=en_us&pg=1&pgSz=20&o=Relevance';
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;
        console.log(`[Microsoft] Page ${pageNum}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
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
            // Try to extract posted date from the text
            let postedDate = null;
            if (posted && posted.match(/\d+/)) {
              postedDate = posted;
            }
            results.push({
              id: 'msft-' + id,
              title,
              company: 'Microsoft',
              location,
              descriptionSnippet: posted ? `${location}. ${posted}.` : `Software Engineering opportunity in ${location}.`,
              applyUrl: link.href,
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
      console.error('[Microsoft] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
