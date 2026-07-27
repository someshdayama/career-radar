import { BaseScraper } from './scraper.interface';
import * as cheerio from 'cheerio';
import https from 'https';

/**
 * Fetches a URL and returns the HTML string using plain Node.js https.
 * Much faster and lighter than launching a full browser.
 */
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

export class LinkedinScraper extends BaseScraper {
  getMockJobs() {
    return [
      { id: 'mock-li-1', title: 'DevOps Engineer', company: 'LinkedIn', location: 'Bengaluru, India', descriptionSnippet: 'Join our site reliability and infrastructure engineering team to build scalable systems at LinkedIn.', applyUrl: 'https://www.linkedin.com/jobs/view/mock-li-1' },
      { id: 'mock-li-2', title: 'Scrum Master', company: 'LinkedIn', location: 'Mumbai, India', descriptionSnippet: 'Facilitate agile teams and agile transformation as a Scrum Master on the product team.', applyUrl: 'https://www.linkedin.com/jobs/view/mock-li-2' },
      { id: 'mock-li-3', title: 'Cloud Infrastructure Architect', company: 'LinkedIn', location: 'Hyderabad, India', descriptionSnippet: 'Architect high-performance secure hybrid cloud environments for massive scale platforms.', applyUrl: 'https://www.linkedin.com/jobs/view/mock-li-3' }
    ];
  }

  async scrape() {
    const roles = [
      'Software Engineer',
      'Full Stack',
      'Frontend Engineer',
      'Backend Engineer',
      'DevOps',
      'SRE',
      'Cloud Engineer',
      'Data Engineer',
      'AI Engineer',
      'QA Engineer',
      'DBA',
      'Solutions Architect',
      'Product Manager',
      'Scrum Master'
    ];

    const offsets = [0, 25];

    const scrapeRoleOffset = async (roleName, start) => {
      try {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(roleName)}&location=India&start=${start}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);
        const jobs = [];

        $('li').each((_, li) => {
          const $li = $(li);
          const titleEl = $li.find('.base-search-card__title');
          const companyEl = $li.find('.base-search-card__subtitle, .hidden-nested-link').first();
          const locationEl = $li.find('.job-search-card__location');
          const linkEl = $li.find('a.base-card__full-link, a[data-tracking-control-name="public_jobs_jserp-result_search-card"]');

          if (!titleEl.length || !linkEl.length) return;

          const title = titleEl.text().trim();
          let company = companyEl.text().trim() || 'LinkedIn';
          company = company.replace(/\s+/g, ' ');
          const location = locationEl.text().trim() || 'India';
          let applyUrl = linkEl.attr('href') || '';
          if (applyUrl) applyUrl = applyUrl.split('?')[0];

          const baseCard = $li.find('.base-card');
          const urn = baseCard.attr('data-entity-urn') || '';
          const id = urn ? 'li-' + urn.split(':').pop() : 'li-' + Math.random().toString(36).substring(7);

          const timeEl = $li.find('time');
          const postedDate = timeEl.attr('datetime') || null;

          jobs.push({
            id,
            title,
            company,
            location,
            descriptionSnippet: `Explore ${roleName} opportunities on LinkedIn.`,
            applyUrl,
            postedDate: postedDate || undefined
          });
        });

        return jobs;
      } catch (err) {
        console.error(`[LinkedIn] Error scraping ${roleName} (start=${start}):`, err.message);
        return [];
      }
    };

    try {
      console.log('[LinkedIn] Fetching expanded roles across multiple pages...');
      const scrapeTasks = [];
      for (const role of roles) {
        for (const start of offsets) {
          scrapeTasks.push(scrapeRoleOffset(role, start));
        }
      }

      const results = await Promise.all(scrapeTasks);
      const combinedJobs = results.flat();

      const seen = new Set();
      const uniqueJobs = [];
      for (const job of combinedJobs) {
        if (!seen.has(job.id)) {
          seen.add(job.id);
          uniqueJobs.push(job);
        }
      }

      console.log(`[LinkedIn] Successfully scraped and merged ${uniqueJobs.length} unique jobs.`);
      return uniqueJobs.length > 0 ? uniqueJobs : this.getMockJobs();
    } catch (err) {
      console.error('[LinkedIn] Scrape error:', err.message);
      return this.getMockJobs();
    }
  }
}
