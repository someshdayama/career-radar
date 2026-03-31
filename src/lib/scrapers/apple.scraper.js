import puppeteer from 'puppeteer';
import { BaseScraper } from './scraper.interface';

export class AppleScraper extends BaseScraper {
  async scrape() {
    const url = 'https://jobs.apple.com/en-in/search?location=india-INDC&key=software%20engineer';
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let jobs = [];
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
      
      // Give it some extra time for the table to render
      await new Promise(r => setTimeout(r, 5000));
      
      jobs = await page.evaluate(() => {
        const results = [];
        
        // Apple uses a new accordion list layout for job search results
        const rows = document.querySelectorAll('div.job-title.job-list-item');
        
        rows.forEach(row => {
            const titleLink = row.querySelector('h3 a');
            if (!titleLink) return;
            
            const title = titleLink.innerText.trim();
            const href = titleLink.href;
            
            const locationEl = row.querySelector('.job-title-location span[id*="search-store-name"]') || row.querySelector('.job-title-location');
            const location = locationEl ? locationEl.innerText.trim().replace('Location\n', '') : 'India';
            
            // Try to fetch team/role info if available
            const teamEl = row.querySelector('.team-name');
            const team = teamEl ? ` (${teamEl.innerText.trim()})` : '';
            
            results.push({
                id: 'aapl-' + Math.random().toString(36).substring(7),
                title: title,
                company: 'Apple',
                location: location,
                descriptionSnippet: `Explore the ${title} opportunity at Apple in ${location}.`,
                applyUrl: href
            });
        });
        
        return results.slice(0, 15);
      });
      
    } catch (error) {
      console.error('Puppeteer scraping error on Apple:', error);
    } finally {
      await browser.close();
    }
    
    return jobs;
  }
}
