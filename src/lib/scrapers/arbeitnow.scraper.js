import { BaseScraper } from './scraper.interface';

export class ArbeitnowScraper extends BaseScraper {
  getMockJobs() {
    return [
      {
        id: 'mock-an-1',
        title: 'Backend Engineer (Node.js)',
        company: 'FinTech Corp',
        location: 'Remote (Europe)',
        descriptionSnippet: 'Build reliable finance APIs and transaction infrastructure using Node.js and TypeScript.',
        applyUrl: 'https://arbeitnow.com/jobs/mock-an-1',
        postedDate: new Date().toISOString()
      }
    ];
  }

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
        const loc = (job.location || '').toLowerCase();
        return (
          loc.includes('india') ||
          loc.includes('worldwide') ||
          loc.includes('global') ||
          loc.includes('anywhere')
        );
      });

      console.log(`[Arbeitnow] Retained ${eligibleJobs.length} eligible India/Worldwide jobs.`);

      return eligibleJobs.map(job => {
        // Create a short description snippet from the html/text description
        const plainDesc = job.description 
          ? job.description.replace(/<[^>]*>/g, '').substring(0, 180) + '...'
          : 'Explore tech roles and application details on Arbeitnow.';

        return {
          id: 'an-' + (job.slug || Math.random().toString(36).substring(7)),
          title: job.title || 'Software Specialist',
          company: job.company_name || 'Tech Company',
          location: job.location || 'Remote',
          descriptionSnippet: plainDesc,
          applyUrl: job.url || 'https://www.arbeitnow.com/',
          postedDate: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined
        };
      });
    } catch (err) {
      console.error('[Arbeitnow] Scrape error:', err.message);
      return [];
    }
  }
}
