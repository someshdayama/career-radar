import { BaseScraper } from './scraper.interface.js';
import { isIndiaOrStrictlyRemote } from '../classification.js';

export class JobicyScraper extends BaseScraper {
  async scrape() {
    try {
      console.log('[Jobicy] Fetching remote jobs via API...');
      const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        throw new Error(`Jobicy API returned status ${res.status}`);
      }

      const json = await res.json();
      const rawJobs = json.jobs || json.data || [];

      console.log(`[Jobicy] Received ${rawJobs.length} raw jobs from API.`);

      const jobs = [];
      for (const item of rawJobs) {
        const title = item.jobTitle || item.title || 'Software Developer';
        const company = item.companyName || item.company || 'Tech Company';
        
        let location = 'Remote';
        if (item.jobGeo || item.geo) {
          location = `Remote (${item.jobGeo || item.geo})`;
        } else if (item.jobLevel) {
          location = `Remote (${item.jobLevel})`;
        }

        if (!isIndiaOrStrictlyRemote(location)) continue;

        const rawDesc = item.jobDescription || item.description || '';
        const plainDesc = rawDesc
          ? rawDesc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 180) + '...'
          : `Explore ${title} role at ${company}.`;

        const applyUrl = item.url || item.jobUrl || 'https://jobicy.com/';
        const postedDate = item.pubDate ? new Date(item.pubDate).toISOString() : undefined;
        const id = 'jby-' + (item.id || Math.random().toString(36).substring(7));

        jobs.push({
          id,
          title,
          company,
          location,
          descriptionSnippet: plainDesc,
          applyUrl,
          postedDate
        });
      }

      console.log(`[Jobicy] Parsed ${jobs.length} remote jobs.`);
      return jobs;
    } catch (err) {
      console.error('[Jobicy] Scrape error:', err.message);
      return [];
    }
  }
}
