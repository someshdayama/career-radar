import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

export class MetaScraper extends BaseScraper {
  async scrape() {
    const url = 'https://www.metacareers.com/jobs?offices[0]=Hyderabad%2C%20India&offices[1]=Gurugram%2C%20India&offices[2]=Mumbai%2C%20India&roles[0]=Engineering&is_leadership=0&is_in_page=0';
    const { page, release } = await acquireBrowser();
    let jobs = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await page.waitForSelector('a[href*="/jobs/"]', { timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));

      jobs = await page.evaluate(() => {
        const results = [];
        const seen = new Set();

        // Meta careers page uses <a> cards linking to /jobs/<id>
        const links = Array.from(document.querySelectorAll('a[href*="/jobs/"]'))
          .filter(a => /\/jobs\/\d+/.test(a.href));

        links.forEach(link => {
          if (seen.has(link.href)) return;
          seen.add(link.href);

          const titleEl = link.querySelector('h2, h3, [class*="title"], [class*="Title"]');
          const title = titleEl?.innerText?.trim() || link.innerText.split('\n')[0].trim();
          if (!title || title.length < 4) return;

          const locEl = link.querySelector('[class*="location"], [class*="Location"]');
          const location = locEl?.innerText?.trim() || 'India';

          const idMatch = link.href.match(/\/jobs\/(\d+)/);
          const id = idMatch ? idMatch[1] : Math.random().toString(36).substring(7);

          results.push({
            id: 'meta-' + id,
            title,
            company: 'Meta',
            location,
            descriptionSnippet: `Build at scale with Meta. ${title} role based in ${location}.`,
            applyUrl: link.href.startsWith('http') ? link.href : 'https://www.metacareers.com' + link.getAttribute('href'),
          });
        });

        return results.slice(0, 25);
      });
    } catch (err) {
      console.error('[Meta] Scrape error:', err.message);
    } finally {
      await release();
    }

    return jobs;
  }
}
