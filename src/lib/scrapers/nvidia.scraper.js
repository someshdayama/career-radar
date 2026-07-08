import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

const PAGE_SIZE = 10;
// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class NvidiaScraper extends BaseScraper {
  getMockJobs() {
    return [
      { id: 'mock-nv-1', title: 'Deep Learning Infrastructure Engineer', company: 'Nvidia', location: 'Pune, India', descriptionSnippet: 'Build large-scale high-performance computing platforms for training foundation LLM models using Kubernetes and GPUs.', applyUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIACareers/job/mock-nv-1' },
      { id: 'mock-nv-2', title: 'SRE - AI Cloud Services', company: 'Nvidia', location: 'Bengaluru, India', descriptionSnippet: 'Manage reliability and deployment setups for DGX Cloud services globally, automating failure recoveries.', applyUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIACareers/job/mock-nv-2' }
    ];
  }

  async scrape() {
    const buildUrl = (start) =>
      `https://jobs.nvidia.com/careers?start=${start}&location=india&sort_by=distance&filter_include_remote=1&filter_job_category=engineering%2Cprogram+manager%2Cit+-+information+technology&q=devops+OR+cloud+OR+SRE+OR+release+engineer+OR+infrastructure+OR+product+manager+OR+scrum+master+OR+product+owner`;

    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();

    try {
      for (let pageNum = 0; pageNum < MAX_PAGES; pageNum++) {
        const start = pageNum * PAGE_SIZE;
        console.log(`[Nvidia] Page ${pageNum + 1} (start=${start})`);
        await page.goto(buildUrl(start), { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await page.waitForSelector('a[class*="card-"]', { timeout: 8000 }).catch(() => {});

        const jobs = await page.evaluate(() => {
          const results = [];
          Array.from(document.querySelectorAll('a[class*="card-"]')).forEach(card => {
            const titleEl = card.querySelector('[class*="title-"]');
            if (!titleEl) return;
            const title = titleEl.innerText.trim();
            if (!title) return;
            const fields = Array.from(card.querySelectorAll('[class*="fieldValue-"]'));
            const location = fields[1] ? fields[1].innerText.trim() : 'India';
            // Try to extract a posted/relisted date
            const dateEl = card.querySelector('[class*="date-"], [class*="posted-"], time');
            let postedDate = null;
            if (dateEl) {
              const dt = dateEl.getAttribute('datetime') || dateEl.innerText.trim();
              if (dt) postedDate = dt;
            }
            const href = card.href || card.getAttribute('href') || '';
            const fullUrl = href.startsWith('http') ? href : 'https://jobs.nvidia.com' + href;
            const hrefParts = href.split('/');
            const jobId = hrefParts[hrefParts.length - 1] || Math.random().toString(36).substring(7);
            results.push({
              id: 'nvda-' + jobId,
              title,
              company: 'Nvidia',
              location,
              descriptionSnippet: `Engineering opportunity at Nvidia in ${location}.`,
              applyUrl: fullUrl,
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
      console.error('[Nvidia] Scrape error:', err.message);
    } finally {
      await release();
    }
    return allJobs;
  }
}
