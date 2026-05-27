import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

export class LinkedinScraper extends BaseScraper {
  async scrape() {
    const roles = ['DevOps', 'Scrum Master', 'Cloud Engineer'];
    
    // Scrape a specific role in a parallel Puppeteer tab
    const scrapeRole = async (roleName) => {
      console.log(`[LinkedIn] Scraping role: ${roleName}`);
      const { page, release } = await acquireBrowser();
      try {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(roleName)}&location=India&start=0`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        
        // Brief pause for DOM loading
        await new Promise(r => setTimeout(r, 1000));

        const jobs = await page.evaluate((role) => {
          const results = [];
          document.querySelectorAll('li').forEach(li => {
            const titleEl = li.querySelector('.base-search-card__title');
            const companyEl = li.querySelector('.base-search-card__subtitle, .hidden-nested-link');
            const locationEl = li.querySelector('.job-search-card__location');
            const linkEl = li.querySelector('a.base-card__full-link, a[data-tracking-control-name="public_jobs_jserp-result_search-card"]');
            
            if (!titleEl || !linkEl) return;
            
            const title = titleEl.textContent?.trim() || '';
            let company = companyEl?.textContent?.trim() || 'LinkedIn';
            company = company.replace(/\s+/g, ' ');

            const location = locationEl?.textContent?.trim() || 'India';
            let applyUrl = linkEl.getAttribute('href') || '';
            if (applyUrl) {
              applyUrl = applyUrl.split('?')[0];
            }
            
            const baseCard = li.querySelector('.base-card');
            const urn = baseCard?.getAttribute('data-entity-urn') || '';
            const id = urn ? 'li-' + urn.split(':').pop() : 'li-' + Math.random().toString(36).substring(7);

            results.push({
              id,
              title,
              company,
              location,
              descriptionSnippet: `Explore ${role} opportunities on LinkedIn.`,
              applyUrl,
            });
          });
          return results;
        }, roleName);

        return jobs;
      } catch (err) {
        console.error(`[LinkedIn] Error scraping ${roleName}:`, err.message);
        return [];
      } finally {
        await release();
      }
    };

    try {
      // Run all three role searches in parallel
      const results = await Promise.all(roles.map(scrapeRole));
      const combinedJobs = results.flat();

      // Deduplicate jobs by unique ID
      const seen = new Set();
      const uniqueJobs = [];
      for (const job of combinedJobs) {
        if (!seen.has(job.id)) {
          seen.add(job.id);
          uniqueJobs.push(job);
        }
      }

      console.log(`[LinkedIn] Successfully scraped and merged ${uniqueJobs.length} unique jobs.`);
      return uniqueJobs;
    } catch (err) {
      console.error('[LinkedIn] Scrape error:', err.message);
      return [];
    }
  }
}
