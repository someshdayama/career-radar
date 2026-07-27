import { BaseScraper } from './scraper.interface.js';
import * as cheerio from 'cheerio';

export class WeWorkRemotelyScraper extends BaseScraper {
  async scrape() {
    try {
      console.log('[WeWorkRemotely] Fetching RSS feeds for tech roles...');
      const feedUrls = [
        'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
        'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
        'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss'
      ];

      const responses = await Promise.all(feedUrls.map(url => fetch(url).catch(() => null)));
      const xmlTexts = await Promise.all(responses.map(async (res) => {
        if (!res || !res.ok) return '';
        return res.text();
      }));

      const allJobs = [];
      const seenUrls = new Set();

      for (const xml of xmlTexts) {
        if (!xml) continue;
        const $ = cheerio.load(xml, { xmlMode: true });

        $('item').each((_, item) => {
          const $item = $(item);
          const rawTitle = $item.find('title').text().trim();
          const applyUrl = $item.find('link').text().trim();
          const pubDate = $item.find('pubDate').text().trim();
          const descriptionHtml = $item.find('description').text().trim();

          if (!rawTitle || !applyUrl || seenUrls.has(applyUrl)) return;
          seenUrls.add(applyUrl);

          let company = 'WeWorkRemotely Company';
          let title = rawTitle;
          if (rawTitle.includes(':')) {
            const split = rawTitle.split(':');
            company = split[0].trim();
            title = split.slice(1).join(':').trim();
          }

          const plainDesc = descriptionHtml
            ? descriptionHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 180) + '...'
            : `Explore ${title} position at ${company}.`;

          const postedDate = pubDate ? new Date(pubDate).toISOString() : undefined;
          const id = 'wwr-' + Math.random().toString(36).substring(7);

          allJobs.push({
            id,
            title,
            company,
            location: 'Remote (Global)',
            descriptionSnippet: plainDesc,
            applyUrl,
            postedDate
          });
        });
      }

      console.log(`[WeWorkRemotely] Parsed ${allJobs.length} remote tech jobs from RSS feeds.`);
      return allJobs;
    } catch (err) {
      console.error('[WeWorkRemotely] Scrape error:', err.message);
      return [];
    }
  }
}
