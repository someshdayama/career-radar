import { BaseScraper } from './scraper.interface.js';
import { isIndiaOrStrictlyRemote } from '../classification.js';

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
      console.log('[Remotive] Fetching tech categories in parallel...');
      const urls = [
        'https://remotive.com/api/remote-jobs?category=software-dev&limit=40',
        'https://remotive.com/api/remote-jobs?category=devops&limit=30',
        'https://remotive.com/api/remote-jobs?category=product&limit=30',
        'https://remotive.com/api/remote-jobs?category=qa&limit=20',
        'https://remotive.com/api/remote-jobs?category=data&limit=20'
      ];

      const responses = await Promise.all(urls.map(url => fetch(url).catch(() => null)));
      const jsons = await Promise.all(responses.map(async (res, idx) => {
        if (!res || !res.ok) {
          console.warn(`[Remotive] API category fetch ${idx} failed`);
          return { jobs: [] };
        }
        return res.json();
      }));

      const allJobs = jsons.flatMap(json => json.jobs || []);
      console.log(`[Remotive] Found ${allJobs.length} raw jobs across all tech categories.`);

      const seenIds = new Set();
      const uniqueJobs = [];
      for (const job of allJobs) {
        if (job && job.id && !seenIds.has(job.id)) {
          seenIds.add(job.id);
          uniqueJobs.push(job);
        }
      }

      const eligibleJobs = uniqueJobs.filter(job => {
        const reqLoc = job.candidate_required_location || 'Remote';
        return isIndiaOrStrictlyRemote(reqLoc);
      });

      console.log(`[Remotive] Retained ${eligibleJobs.length} eligible India/Remote tech jobs.`);

      const mapped = eligibleJobs.map(job => {
        const plainDesc = job.description 
          ? job.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 180) + '...'
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

      return mapped.length > 0 ? mapped : this.getMockJobs();
    } catch (err) {
      console.error('[Remotive] Scrape error:', err.message);
      return this.getMockJobs();
    }
  }
}
