import { BaseScraper } from './scraper.interface';

export class RemotiveScraper extends BaseScraper {
  getMockJobs() {
    return [
      {
        id: 'mock-rem-1',
        title: 'Senior DevOps Engineer',
        company: 'CloudScale',
        location: 'Remote (Global)',
        descriptionSnippet: 'Architect and scale Kubernetes infrastructure, CI/CD pipelines, and cloud resources.',
        applyUrl: 'https://remotive.com/jobs/mock-rem-1',
        postedDate: new Date().toISOString()
      }
    ];
  }

  async scrape() {
    try {
      console.log('[Remotive] Fetching software-dev and product jobs in parallel...');
      const urls = [
        'https://remotive.com/api/remote-jobs?category=software-dev&limit=40',
        'https://remotive.com/api/remote-jobs?category=product&limit=30'
      ];

      const responses = await Promise.all(urls.map(url => fetch(url)));
      const jsons = await Promise.all(responses.map(async (res, idx) => {
        if (!res.ok) {
          console.warn(`[Remotive] API category fetch ${idx} failed with status ${res.status}`);
          return { jobs: [] };
        }
        return res.json();
      }));

      const allJobs = jsons.flatMap(json => json.jobs || []);

      console.log(`[Remotive] Found ${allJobs.length} raw jobs from all categories before filtering.`);

      // Deduplicate jobs that appear in both software-dev and product categories
      const seenIds = new Set();
      const uniqueJobs = [];
      for (const job of allJobs) {
        if (job && job.id && !seenIds.has(job.id)) {
          seenIds.add(job.id);
          uniqueJobs.push(job);
        }
      }

      const eligibleJobs = uniqueJobs.filter(job => {
        const reqLoc = (job.candidate_required_location || '').toLowerCase();
        return (
          reqLoc === '' || 
          reqLoc.includes('worldwide') || 
          reqLoc.includes('global') || 
          reqLoc.includes('anywhere') || 
          reqLoc.includes('india') ||
          reqLoc.includes('apac')
        );
      });

      console.log(`[Remotive] Retained ${eligibleJobs.length} eligible India/Worldwide remote jobs.`);

      return eligibleJobs.map(job => {
        // Create plain text description snippet
        const plainDesc = job.description 
          ? job.description.replace(/<[^>]*>/g, '').substring(0, 180) + '...'
          : 'View tech opportunities and remote specifications on Remotive.';

        return {
          id: 'rem-' + (job.id || Math.random().toString(36).substring(7)),
          title: job.title || 'Software Developer',
          company: job.company_name || 'Tech Company',
          location: job.candidate_required_location || 'Remote',
          descriptionSnippet: plainDesc,
          applyUrl: job.url || 'https://remotive.com/',
          postedDate: job.publication_date ? new Date(job.publication_date).toISOString() : undefined
        };
      });
    } catch (err) {
      console.error('[Remotive] Scrape error:', err.message);
      return [];
    }
  }
}
