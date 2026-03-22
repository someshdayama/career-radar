import puppeteer from 'puppeteer';
import { BaseScraper } from './scraper.interface';

export class GoogleScraper extends BaseScraper {
  async scrape() {
    const url = 'https://www.google.com/about/careers/applications/jobs/results/?q="Software%20Engineering"&location=India';
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let jobs = [];
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
      
      await new Promise(r => setTimeout(r, 6000));
      
      // Scroll to trigger lazy loading
      await page.evaluate(async () => {
          window.scrollBy(0, 500);
          await new Promise(r => setTimeout(r, 1000));
      });
      
      jobs = await page.evaluate(() => {
        const results = [];
        
        // Google uses <a> elements that link to /jobs/results/
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/jobs/results/') && a.href !== window.location.href);
            
        links.forEach(link => {
            const rawText = link.innerText.trim();
            // Expected format often includes title, company, locations, etc inside the block
            // Title is usually an h2 or h3 inside
            const titleEl = link.querySelector('h2, h3');
            let title = titleEl ? titleEl.innerText.trim() : '';
            
            if (!title && rawText.includes('Software')) {
                title = rawText.split('\n')[0]; // fallback
            }
            if (!title) return;
            
            // Google jobs usually have location info inside styled spans
            const locEl = link.querySelector('span[aria-label*="location"]');
            let location = locEl ? locEl.innerText.trim() : 'India';
            
            results.push({
                id: 'goog-' + Math.random().toString(36).substring(7),
                title: title,
                company: 'Google',
                location: location,
                descriptionSnippet: `Explore this Software Engineering position at Google in ${location}.`,
                applyUrl: link.href
            });
        });
        
        // Dedup
        const unique = [];
        const seen = new Set();
        for (const job of results) {
            if (!seen.has(job.applyUrl)) {
                seen.add(job.applyUrl);
                unique.push(job);
            }
        }
        
        return unique.slice(0, 15);
      });
      
    } catch (error) {
      console.error('Puppeteer scraping error on Google:', error);
    } finally {
      await browser.close();
    }
    
    return jobs;
  }
}
