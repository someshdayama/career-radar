import { BaseScraper } from './scraper.interface.js';
import { isIndiaOrStrictlyRemote } from '../classification.js';

export class ArbeitnowScraper extends BaseScraper {
  async scrape() {
    try {
      console.log('[Arbeitnow] Fetching jobs...');
      const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
      if (!response.ok) {
        throw new Error(`Arbeitnow API returned status ${response.status}`);
      }
      const json = await response.json();
      
      if (!json || !Array.isArray(json.data)) {
        return [];
      }

      console.log(`[Arbeitnow] Found ${json.data.length} jobs before filtering.`);

      const eligibleJobs = json.data.filter(job => {
        const loc = job.location || (job.remote ? 'Remote' : '');
        return isIndiaOrStrictlyRemote(loc);
      });

      console.log(`[Arbeitnow] Retained ${eligibleJobs.length} eligible India/Remote jobs.`);

      const mapped = eligibleJobs.map(job => {
        const plainDesc = job.description 
          ? job.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 180) + '...'
          : 'Explore tech roles and application details on Arbeitnow.';

        return {
          id: 'an-' + (job.slug || Math.random().toString(36).substring(7)),
          title: job.title || 'Software Specialist',
          company: job.company_name || 'Tech Company',
          location: job.location || (job.remote ? 'Remote' : 'India / Remote'),
          descriptionSnippet: plainDesc,
          applyUrl: job.url || 'https://www.arbeitnow.com/',
          postedDate: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined
        };
      });

      return mapped;
    } catch (err) {
      console.error('[Arbeitnow] Scrape error:', err.message);
      return [];
    }
  }
}
