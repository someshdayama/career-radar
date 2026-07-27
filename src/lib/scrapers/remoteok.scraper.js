import { BaseScraper } from './scraper.interface.js';
import { isIndiaOrStrictlyRemote } from '../classification.js';

export class RemoteOKScraper extends BaseScraper {
  async scrape() {
    try {
      console.log('[RemoteOK] Fetching remote tech jobs via API...');
      const res = await fetch('https://remoteok.com/api', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        throw new Error(`RemoteOK API returned status ${res.status}`);
      }

      const rawData = await res.json();
      if (!Array.isArray(rawData)) {
        return [];
      }

      const jobItems = rawData.slice(1);
      console.log(`[RemoteOK] Received ${jobItems.length} raw jobs from API.`);

      const jobs = [];
      for (const item of jobItems) {
        if (!item || (!item.position && !item.title)) continue;

        const title = item.position || item.title || 'Software Specialist';
        const company = item.company || 'Tech Startup';
        const location = item.location || 'Remote (Worldwide)';

        if (!isIndiaOrStrictlyRemote(location)) continue;

        let applyUrl = item.url || item.apply_url || 'https://remoteok.com/';
        if (applyUrl && !applyUrl.startsWith('http')) {
          applyUrl = 'https://remoteok.com' + applyUrl;
        }

        const rawDesc = item.description || '';
        const plainDesc = rawDesc
          ? rawDesc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 180) + '...'
          : `Explore ${title} position at ${company}.`;

        const postedDate = item.date ? new Date(item.date).toISOString() : undefined;
        const id = 'rok-' + (item.id || Math.random().toString(36).substring(7));

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

      console.log(`[RemoteOK] Parsed ${jobs.length} remote tech jobs.`);
      return jobs;
    } catch (err) {
      console.error('[RemoteOK] Scrape error:', err.message);
      return [];
    }
  }
}
